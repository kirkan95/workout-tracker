import { describe, expect, it } from 'vitest'
import { UserSettings, WorkoutSession } from '../types'
import { planWeek } from './planner'

const baseSettings: UserSettings = {
  goal: 'muscle',
  startDay: 1,           // Monday
  restDays: [0, 6],       // Sun/Sat
  equipment: ['dumbbells', 'pullupbar', 'bench'],
  exclusions: [],
  mesocycleStart: '2026-06-01',
  timerAlert: 'sound',
  workoutDuration: 45,
}

describe('planWeek', () => {
  it('honors the user\'s actual rest days, not a hardcoded schedule', () => {
    const plan = planWeek({ settings: baseSettings, sessions: [], weekStartDate: '2026-07-06' })
    // 2026-07-06 is a Monday; week runs Mon..Sun. Rest days are Sun(0)/Sat(6).
    expect(plan.schedule['2026-07-11'].type).toBe('rest') // Saturday
    expect(plan.schedule['2026-07-12'].type).toBe('rest') // Sunday
    expect(plan.schedule['2026-07-06'].type).not.toBe('rest')
  })

  it('produces a strength day with exercises the user has equipment for', () => {
    const plan = planWeek({ settings: baseSettings, sessions: [], weekStartDate: '2026-07-06' })
    const day = plan.schedule['2026-07-06']
    expect(['push', 'pull', 'legs']).toContain(day.type)
    expect(day.exercises).toBeTruthy()
    expect(Object.keys(day.exercises!).length).toBeGreaterThan(0)
  })

  it('marks every 4th mesocycle week as a deload', () => {
    // mesocycleStart 2026-06-01 -> week containing 2026-06-22 is week 4
    const plan = planWeek({ settings: baseSettings, sessions: [], weekStartDate: '2026-06-22' })
    expect(plan.mesocycleWeek).toBe(4)
    const strengthDay = Object.values(plan.schedule).find((d) => d.exercises)
    expect(strengthDay?.deload).toBe(true)
  })

  it('is a pure function — same inputs produce the same output', () => {
    const sessions: WorkoutSession[] = [{
      date: '2026-07-03', dayOfWeek: 5, type: 'strength', workoutId: 'push', completed: true, timestamp: 1,
      exercises: { db_chest_press: { sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }] } },
    }]
    const a = planWeek({ settings: baseSettings, sessions, weekStartDate: '2026-07-06' })
    const b = planWeek({ settings: baseSettings, sessions, weekStartDate: '2026-07-06' })
    expect(a).toEqual(b)
  })

  it('gives repeated day types within a week different exercises', () => {
    // A "stay fit" user training every day gets many full-body days; each one
    // should pull a different slice of the pool, not the identical workout.
    const settings: UserSettings = {
      ...baseSettings, goal: 'stayfit', restDays: [],
      equipment: ['dumbbells', 'pullupbar', 'bench', 'kettlebell'],
    }
    const plan = planWeek({ settings, sessions: [], weekStartDate: '2026-07-06' })
    const fullBodyDays = Object.values(plan.schedule)
      .filter((d) => d.type === 'fullbody' && d.exercises)
      .map((d) => Object.keys(d.exercises!).sort().join(','))

    expect(fullBodyDays.length).toBeGreaterThanOrEqual(2)
    // Not every full-body day is the identical exercise list.
    expect(new Set(fullBodyDays).size).toBeGreaterThan(1)
  })

  it('flags a duration conflict for strength goals under 30 minutes', () => {
    const plan = planWeek({
      settings: { ...baseSettings, goal: 'stronger', workoutDuration: 20 },
      sessions: [],
      weekStartDate: '2026-07-06',
    })
    expect(plan.durationConflict).toBe(true)
  })
})
