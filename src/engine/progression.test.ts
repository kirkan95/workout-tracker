import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../data/exercises'
import { WorkoutSession } from '../types'
import { applyDeload, applyReturnFromBreak, progressExercise } from './progression'

const chestPress = EXERCISES.find((e) => e.id === 'db_chest_press')! // upper push compound, +2.5 increment
const gobletSquat = EXERCISES.find((e) => e.id === 'goblet_squat')! // lower compound, +5 increment
const pushups = EXERCISES.find((e) => e.id === 'pushups')! // to-failure, no weight

function session(date: string, exId: string, sets: { weight?: number | null; reps: number | null; feel?: 'easy' | 'medium' | 'hard' }[]): WorkoutSession {
  return {
    date,
    dayOfWeek: 1,
    type: 'strength',
    workoutId: 'push',
    completed: true,
    timestamp: Date.parse(date),
    exercises: { [exId]: { sets: sets.map((s) => ({ weight: s.weight ?? null, reps: s.reps, feel: s.feel })) } },
  }
}

describe('progressExercise', () => {
  it('returns a blank target with no history (week 1 behavior)', () => {
    const result = progressExercise(chestPress, 'muscle', [])
    expect(result.weight).toBeNull()
    expect(result.repRange).toBe('8-12')
    expect(result.reason).toBeUndefined()
  })

  it('progresses weight up when every set hit the top of the range and nothing was rated hard', () => {
    const sessions = [session('2026-07-01', chestPress.id, [
      { weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 30, reps: 12 },
    ])]
    const result = progressExercise(chestPress, 'muscle', sessions)
    expect(result.weight).toBe(32.5) // +2.5 for an upper-body compound
    expect(result.reason).toMatch(/\+2\.5 lbs/)
  })

  it('gives a bigger jump for lower-body compound movements', () => {
    const sessions = [session('2026-07-01', gobletSquat.id, [
      { weight: 25, reps: 15 }, { weight: 25, reps: 15 }, { weight: 25, reps: 15 },
    ])]
    const result = progressExercise(gobletSquat, 'muscle', sessions)
    expect(result.weight).toBe(30) // +5 for squat/hinge compounds
  })

  it('holds weight steady when the rep range was hit but a set was rated hard', () => {
    const sessions = [session('2026-07-01', chestPress.id, [
      { weight: 30, reps: 10, feel: 'hard' }, { weight: 30, reps: 9 }, { weight: 30, reps: 9 },
    ])]
    const result = progressExercise(chestPress, 'muscle', sessions)
    expect(result.weight).toBe(30)
    expect(result.reason).toMatch(/aim for \+1 rep/)
  })

  it('holds weight on the first below-range session (consolidate before deloading)', () => {
    const sessions = [session('2026-07-01', chestPress.id, [
      { weight: 30, reps: 6 }, { weight: 30, reps: 6 }, { weight: 30, reps: 6 },
    ])]
    const result = progressExercise(chestPress, 'muscle', sessions)
    expect(result.weight).toBe(30)
    expect(result.reason).toMatch(/Stay at/)
  })

  it('drops weight 10% after two consecutive below-range sessions', () => {
    const sessions = [
      session('2026-07-08', chestPress.id, [{ weight: 30, reps: 6 }, { weight: 30, reps: 6 }]),
      session('2026-07-01', chestPress.id, [{ weight: 30, reps: 6 }, { weight: 30, reps: 6 }]),
    ]
    const result = progressExercise(chestPress, 'muscle', sessions)
    expect(result.weight).toBe(27.5) // 30 * 0.9 = 27, rounded to nearest 2.5
    expect(result.reason).toMatch(/Dropping to/)
  })

  it('tracks reps (not weight) for to-failure bodyweight exercises', () => {
    const sessions = [session('2026-07-01', pushups.id, [{ reps: 20 }, { reps: 18 }, { reps: 15 }])]
    const result = progressExercise(pushups, 'stronger', sessions)
    expect(result.weight).toBeNull()
    expect(result.repRange).toBe('max')
    expect(result.reason).toMatch(/Beat your last max/)
  })
})

describe('applyDeload', () => {
  it('cuts sets by ~40% and weight by 10%', () => {
    const deloaded = applyDeload({ sets: 5, repRange: '8-12', weight: 100 })
    expect(deloaded.sets).toBe(3) // ceil(5 * 0.6)
    expect(deloaded.weight).toBe(90)
  })

  it('leaves weight null for bodyweight exercises', () => {
    const deloaded = applyDeload({ sets: 3, repRange: 'max', weight: null })
    expect(deloaded.weight).toBeNull()
  })
})

describe('applyReturnFromBreak', () => {
  it('cuts weight 20% for a 15-28 day gap', () => {
    const result = applyReturnFromBreak({ sets: 3, repRange: '8-12', weight: 100 }, 20)
    expect(result.weight).toBe(80)
    expect(result.sets).toBe(3)
  })

  it('cuts weight 30% and drops a set for a 28+ day gap', () => {
    const result = applyReturnFromBreak({ sets: 3, repRange: '8-12', weight: 100 }, 35)
    expect(result.weight).toBe(70)
    expect(result.sets).toBe(2)
  })

  it('leaves the target untouched under 14 days', () => {
    const result = applyReturnFromBreak({ sets: 3, repRange: '8-12', weight: 100 }, 5)
    expect(result.weight).toBe(100)
    expect(result.sets).toBe(3)
  })
})
