import { EXERCISES, LibraryExercise } from '../data/exercises'
import { CardioData, DayPlan, ExerciseTarget, UserSettings, WeeklyPlan, WorkoutSession } from '../types'
import { dateStr, weeksSinceEpoch } from '../utils'
import { GOAL_PARAMS, applyDeload, applyReturnFromBreak, progressExercise } from './progression'

type StrengthDayType = 'push' | 'pull' | 'legs' | 'fullbody'

function computeMesocycleWeek(mesocycleStart: string, weekStartDate: string): number {
  const start = new Date(mesocycleStart + 'T00:00:00')
  const wkStart = new Date(weekStartDate + 'T00:00:00')
  return Math.max(1, Math.floor((wkStart.getTime() - start.getTime()) / (7 * 86400000)) + 1)
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime()
  const db = new Date(b + 'T00:00:00').getTime()
  return Math.round((db - da) / 86400000)
}

function weekParityFor(weekStartDate: string): 0 | 1 {
  const n = weeksSinceEpoch(new Date(weekStartDate + 'T00:00:00'))
  return (((n % 2) + 2) % 2) as 0 | 1
}

// Which day gets which workout type, honoring the user's actual rest days
// (the old static schedule ignored these — see UPGRADE.md §0.3).
function buildDayTypeLayout(settings: UserSettings, weekStartDate: string): { date: string; type: DayPlan['type'] }[] {
  const isPPL = settings.goal === 'stronger' || settings.goal === 'muscle'
  const start = new Date(weekStartDate + 'T00:00:00')
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return { date: dateStr(d), dow: d.getDay() }
  })

  const STRENGTH_CYCLE: StrengthDayType[] = ['push', 'pull', 'legs']
  const cardioEvery = settings.goal === 'loseweight' ? 3 : 4
  let workingIdx = 0

  return days.map(({ date, dow }) => {
    if (settings.restDays.includes(dow)) return { date, type: 'rest' as const }
    const i = workingIdx++
    if (isPPL) {
      if (i < 3) return { date, type: STRENGTH_CYCLE[i] }
      if (i < 5) return { date, type: 'cardio' as const }
      return { date, type: STRENGTH_CYCLE[i % 3] }
    }
    return { date, type: (i + 1) % cardioEvery === 0 ? ('cardio' as const) : ('fullbody' as const) }
  })
}

function passesFilters(e: LibraryExercise, settings: UserSettings): boolean {
  const hasEquipment = e.equipment.some((eq) => eq === 'bodyweight' || settings.equipment.includes(eq))
  if (!hasEquipment) return false
  if (settings.exclusions.includes(e.movement)) return false
  if (settings.exclusions.includes('overhead') && e.overhead) return false
  if (settings.exclusions.includes('highImpact') && e.highImpact) return false
  if (settings.exclusions.includes('singleLeg') && e.singleLeg) return false
  return true
}

// Deterministic A/B-style variety: picks a different slice of the eligible
// pool depending on week parity, so the same day type doesn't repeat the
// identical exercise list every single week.
function pickAlternating<T>(pool: T[], count: number, weekParity: 0 | 1): T[] {
  if (!pool.length || count <= 0) return []
  const out: T[] = []
  const seen = new Set<number>()
  for (let i = 0; i < count; i++) {
    const idx = (i * 2 + weekParity) % pool.length
    if (seen.has(idx)) continue
    seen.add(idx)
    out.push(pool[idx])
  }
  return out
}

function pickExercisesForDay(dayType: StrengthDayType, settings: UserSettings, weekParity: 0 | 1): LibraryExercise[] {
  const pool = EXERCISES
    .filter((e) => (dayType === 'fullbody' ? e.style === 'fullbody' || e.style === 'both' : e.day === dayType && (e.style === 'ppl' || e.style === 'both')))
    .filter((e) => passesFilters(e, settings))
    .sort((a, b) => a.id.localeCompare(b.id))

  if (!pool.length) return []

  const compounds = pool.filter((e) => e.compound)
  const isolations = pool.filter((e) => !e.compound)

  const targetCompoundCount = dayType === 'fullbody' ? 2 : Math.min(2, compounds.length)
  const targetTotal = dayType === 'fullbody' ? 4 : 5

  const chosenCompounds = pickAlternating(compounds, targetCompoundCount, weekParity)
  const remainingSlots = Math.max(0, targetTotal - chosenCompounds.length)
  const chosenIsolations = pickAlternating(isolations, remainingSlots, weekParity)

  return [...chosenCompounds, ...chosenIsolations]
}

// Estimate total session time (~45s work + goal rest per set) and trim
// isolation exercises from the end until it fits workoutDuration, keeping at
// least the compound lifts.
function fitToDuration(chosen: LibraryExercise[], goal: UserSettings['goal'], workoutDuration: number): LibraryExercise[] {
  const params = GOAL_PARAMS[goal]
  const perSetMinutes = params.restSeconds / 60 + 0.75
  const setsFor = (e: LibraryExercise) => (e.compound ? params.compoundSets : params.isolationSets)
  const estimate = (list: LibraryExercise[]) => list.reduce((sum, e) => sum + setsFor(e) * perSetMinutes, 0)
  const minKeep = Math.max(1, chosen.filter((e) => e.compound).length)

  const list = [...chosen]
  while (list.length > minKeep && estimate(list) > workoutDuration) {
    const dropIdx = [...list].reverse().findIndex((e) => !e.compound)
    if (dropIdx === -1) break
    list.splice(list.length - 1 - dropIdx, 1)
  }
  return list
}

function planCardioDay(sessions: WorkoutSession[], deload: boolean): DayPlan {
  const recent = sessions.filter((s) => s.type === 'cardio' && s.completed && s.cardio).slice(0, 4)
  const avgDuration = recent.length
    ? Math.round(recent.reduce((sum, s) => sum + (s.cardio?.duration ?? 0), 0) / recent.length)
    : 20
  let duration = recent.length ? Math.min(avgDuration + Math.round(avgDuration * 0.1), 60) : 20
  if (deload) duration = Math.max(10, Math.round(duration * 0.6))

  const lastType: CardioData['type'] = recent[0]?.cardio?.type ?? 'run'

  return {
    type: 'cardio',
    cardioType: lastType,
    cardioDuration: duration,
    cardioEffort: deload ? 'easy' : 'medium',
    deload,
    note: deload
      ? 'Deload week — keep this easy and conversational.'
      : recent.length
        ? `+10% from your recent average — push the pace a little today.`
        : 'Start at a comfortable pace and see how it feels.',
  }
}

const DAY_LABEL: Record<StrengthDayType, string> = { push: 'Push', pull: 'Pull', legs: 'Legs', fullbody: 'Full Body' }

function buildDayNote(type: StrengthDayType, deload: boolean, gapDays: number, mesocycleWeek: number): string {
  if (deload) return 'Deload week — lighter sets and loads today so you can come back stronger.'
  if (gapDays > 28) return "Welcome back — targets are eased after the time off. Rebuild the habit before pushing hard again."
  if (gapDays > 14) return 'Back from a short break — targets are a bit lighter today to ease back in.'
  if (mesocycleWeek % 4 === 3) return 'One more solid week before your scheduled deload.'
  return `${DAY_LABEL[type]} day — beat your last session where you can.`
}

export interface PlanWeekInput {
  settings: UserSettings
  sessions: WorkoutSession[]
  weekStartDate: string
}

// The engine's single entry point: (settings, history, week) -> WeeklyPlan.
// Pure and synchronous — no network call, so it's available offline, at
// week 1, and instantly on every app open. See UPGRADE.md §0.
export function planWeek({ settings, sessions, weekStartDate }: PlanWeekInput): WeeklyPlan {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
  const mesocycleWeek = computeMesocycleWeek(settings.mesocycleStart, weekStartDate)
  const deload = mesocycleWeek > 1 && mesocycleWeek % 4 === 0
  const lastCompleted = sorted.find((s) => s.completed)
  const gapDays = lastCompleted ? daysBetween(lastCompleted.date, weekStartDate) : 0
  const weekParity = weekParityFor(weekStartDate)

  const layout = buildDayTypeLayout(settings, weekStartDate)
  const schedule: Record<string, DayPlan> = {}

  layout.forEach(({ date, type }) => {
    if (type === 'rest') { schedule[date] = { type: 'rest' }; return }
    if (type === 'cardio') { schedule[date] = planCardioDay(sorted, deload); return }

    const chosen = fitToDuration(pickExercisesForDay(type, settings, weekParity), settings.goal, settings.workoutDuration)
    const exercises: Record<string, ExerciseTarget> = {}

    chosen.forEach((libEx) => {
      let result = progressExercise(libEx, settings.goal, sorted)
      if (deload) result = applyDeload(result)
      else if (gapDays > 14) result = applyReturnFromBreak(result, gapDays)
      exercises[libEx.id] = { sets: result.sets, repRange: result.repRange, weight: result.weight, reason: result.reason }
    })

    schedule[date] = {
      type,
      exercises,
      deload,
      note: buildDayNote(type, deload, gapDays, mesocycleWeek),
    }
  })

  return {
    weekStartDate,
    settingsHash: '',
    status: 'ok',
    source: 'engine',
    durationConflict: (settings.goal === 'stronger' || settings.goal === 'muscle') && settings.workoutDuration < 30,
    mesocycleWeek,
    schedule,
  }
}
