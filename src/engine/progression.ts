import { LibraryExercise } from '../data/exercises'
import { SetData, UserSettings, WorkoutSession } from '../types'

export type Goal = UserSettings['goal']

export interface GoalParams {
  compoundReps: [number, number]
  isolationReps: [number, number]
  compoundSets: number
  isolationSets: number
  restSeconds: number
}

// Rep ranges, set counts, and rest periods by training goal. This table is
// the engine's equivalent of the trainer's programming philosophy — it used
// to live only as prose inside the Gemini prompt (functions/trainer/*.md);
// here it's data the app can act on with no AI call.
export const GOAL_PARAMS: Record<Goal, GoalParams> = {
  stronger:   { compoundReps: [4, 6],   isolationReps: [8, 10],   compoundSets: 4, isolationSets: 3, restSeconds: 240 },
  muscle:     { compoundReps: [8, 12],  isolationReps: [10, 15],  compoundSets: 3, isolationSets: 3, restSeconds: 90 },
  loseweight: { compoundReps: [12, 15], isolationReps: [15, 20],  compoundSets: 3, isolationSets: 2, restSeconds: 45 },
  stayfit:    { compoundReps: [8, 12],  isolationReps: [12, 15],  compoundSets: 3, isolationSets: 2, restSeconds: 60 },
}

export interface ProgressionResult {
  sets: number
  repRange: string
  weight: number | null
  reason?: string
}

export function round25(n: number): number {
  return Math.round(n / 2.5) * 2.5
}

// Sessions (most-recent-first) that actually logged this exercise, reduced
// to just the sets with a completed source session — history[0] is the most
// recent, history[1] the one before that, etc.
function exerciseHistory(exerciseId: string, sessions: WorkoutSession[]): SetData[][] {
  return sessions
    .filter((s) => s.completed && s.exercises?.[exerciseId]?.sets?.length)
    .map((s) => s.exercises![exerciseId].sets)
}

function topWeight(sets: SetData[]): number | null {
  const weights = sets.map((s) => s.weight).filter((w): w is number => w != null && w > 0)
  return weights.length ? Math.max(...weights) : null
}

function topReps(sets: SetData[]): number {
  const reps = sets.map((s) => s.reps).filter((r): r is number => r != null && r > 0)
  return reps.length ? Math.max(...reps) : 0
}

// ── TYPESCRIPT CONCEPT: this is the pure function at the center of the app ──
// (exercise, goal, history) -> next target. No dates read, no I/O, no
// randomness — same inputs always produce the same output. That's what makes
// it unit-testable with plain fixture arrays and safe to run on the client.
// See UPGRADE.md §0.2 for the rule table this implements.
export function progressExercise(
  libEx: LibraryExercise,
  goal: Goal,
  sessions: WorkoutSession[],
): ProgressionResult {
  const params = GOAL_PARAMS[goal]
  const sets = libEx.compound ? params.compoundSets : params.isolationSets
  const history = exerciseHistory(libEx.id, sessions)

  // ── to-failure exercises (push-ups, pull-ups): reps target, no weight ──
  if (libEx.repRange === 'max') {
    if (!history.length) return { sets, repRange: 'max', weight: null }
    const last = history[0].filter((s) => s.reps != null)
    if (!last.length) return { sets, repRange: 'max', weight: null }
    const reps = topReps(last)
    const anyHard = last.some((s) => s.feel === 'hard')
    return anyHard
      ? { sets, repRange: 'max', weight: null, reason: `Match ${reps} reps from last time — that set was rated hard.` }
      : { sets, repRange: 'max', weight: null, reason: `Beat your last max — you did ${reps} last time.` }
  }

  // ── timed holds (planks): seconds target, no weight ──
  if (libEx.repRange === 'time') {
    if (!history.length) return { sets, repRange: '30s', weight: null }
    const last = history[0].filter((s) => s.reps != null)
    if (!last.length) return { sets, repRange: '30s', weight: null }
    const secs = topReps(last)
    const anyHard = last.some((s) => s.feel === 'hard')
    if (anyHard) return { sets, repRange: `${secs}s`, weight: null, reason: `Match ${secs}s from last time.` }
    const next = secs + 5
    return { sets, repRange: `${next}s`, weight: null, reason: `+5s — hold ${next}s, up from ${secs}s.` }
  }

  // ── standard rep-range exercises (weighted or bodyweight) ──
  const [lo, hi] = libEx.compound ? params.compoundReps : params.isolationReps
  const repRange = `${lo}-${hi}`

  if (!history.length) return { sets, repRange, weight: null }
  const last = history[0].filter((s) => s.reps != null)
  if (!last.length) return { sets, repRange, weight: null }

  const allAtOrAboveTop = last.every((s) => (s.reps ?? 0) >= hi)
  const anyHard = last.some((s) => s.feel === 'hard')
  const anyBelowBottom = last.some((s) => (s.reps ?? 0) < lo)
  const lastWeight = topWeight(last)

  if (!libEx.usesWeight) {
    // bodyweight exercise with a numeric rep range (lunges, glute bridges…)
    if (allAtOrAboveTop && !anyHard) {
      return { sets, repRange, weight: null, reason: `You hit the top of your rep range last time — push for +1–2 reps per set today.` }
    }
    if (anyBelowBottom) {
      return { sets, repRange, weight: null, reason: `Focus on form and hold steady — last session dipped under the rep range.` }
    }
    return { sets, repRange, weight: null, reason: `On track — match or beat last session's reps.` }
  }

  if (lastWeight == null) return { sets, repRange, weight: null }

  // lower-body compounds progress faster (+5) than everything else (+2.5)
  const increment = libEx.compound && (libEx.movement === 'squat' || libEx.movement === 'hinge') ? 5 : 2.5

  if (allAtOrAboveTop && !anyHard) {
    const next = round25(lastWeight + increment)
    return { sets, repRange, weight: next, reason: `+${increment} lbs — you hit ${sets}×${hi}+ last time and it wasn't rated hard.` }
  }

  if (anyBelowBottom) {
    const prevBelow = history[1]?.some((s) => (s.reps ?? 0) < lo) ?? false
    const hardBelow = last.some((s) => s.feel === 'hard' && (s.reps ?? 0) < lo)
    if (prevBelow || hardBelow) {
      const next = Math.max(0, round25(lastWeight * 0.9))
      return { sets, repRange, weight: next, reason: `Dropping to ${next} lbs — two sessions under range, time to rebuild reps.` }
    }
    return { sets, repRange, weight: lastWeight, reason: `Stay at ${lastWeight} lbs — consolidate your reps before moving up.` }
  }

  // in range, but not yet at the top
  if (anyHard) {
    return { sets, repRange, weight: lastWeight, reason: `Same weight, ${lastWeight} lbs — aim for +1 rep per set. Last session had a hard set.` }
  }
  return { sets, repRange, weight: lastWeight, reason: `On track at ${lastWeight} lbs — match or beat last session's reps.` }
}

export function applyDeload(result: ProgressionResult): ProgressionResult {
  const sets = Math.max(1, Math.ceil(result.sets * 0.6))
  if (result.weight == null) {
    return { ...result, sets, reason: 'Deload week — fewer sets, same movements, lighter effort.' }
  }
  return {
    ...result,
    sets,
    weight: round25(result.weight * 0.9),
    reason: 'Deload week — 40% fewer sets and 10% less weight to help you recover.',
  }
}

export function applyReturnFromBreak(result: ProgressionResult, gapDays: number): ProgressionResult {
  if (gapDays > 28) {
    return {
      ...result,
      sets: Math.max(1, result.sets - 1),
      weight: result.weight != null ? round25(result.weight * 0.7) : null,
      reason: `Back after ${gapDays} days off — starting lighter to ease back in.`,
    }
  }
  if (gapDays > 14) {
    return {
      ...result,
      weight: result.weight != null ? round25(result.weight * 0.8) : null,
      reason: `Back after ${gapDays} days off — 20% lighter today.`,
    }
  }
  return result
}
