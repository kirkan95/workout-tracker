import { describe, expect, it } from 'vitest'
import { UserSettings, WorkoutSession } from '../types'
import { computeDayStreak } from './stats'

const settings: UserSettings = {
  goal: 'stayfit',
  startDay: 1,
  restDays: [0, 6], // Sun/Sat are planned rest days
  equipment: ['dumbbells'],
  exclusions: [],
  mesocycleStart: '2026-06-01',
  timerAlert: 'sound',
  workoutDuration: 45,
}

const session = (date: string): WorkoutSession => ({
  date, dayOfWeek: new Date(date + 'T12:00:00').getDay(),
  type: 'strength', workoutId: 'fullbody', completed: true, timestamp: 1,
})

describe('computeDayStreak', () => {
  it('counts consecutive workout days ending today', () => {
    const today = new Date('2026-07-15T12:00:00') // Wednesday
    const sessions = [session('2026-07-15'), session('2026-07-14'), session('2026-07-13')]
    expect(computeDayStreak(sessions, settings, today)).toBe(3)
  })

  it('does not break the streak on a planned rest day', () => {
    const today = new Date('2026-07-13T12:00:00') // Monday
    // Fri + Sun-and-Sat-are-rest + Mon: the weekend rest days bridge the streak.
    const sessions = [session('2026-07-13'), session('2026-07-10')] // Mon + Fri
    expect(computeDayStreak(sessions, settings, today)).toBe(2)
  })

  it('gives today a grace period — an untrained today does not reset it', () => {
    const today = new Date('2026-07-15T12:00:00') // Wednesday, nothing logged yet
    const sessions = [session('2026-07-14'), session('2026-07-13')]
    expect(computeDayStreak(sessions, settings, today)).toBe(2)
  })

  it('breaks on a missed working day in the past', () => {
    const today = new Date('2026-07-15T12:00:00') // Wednesday
    // Missed Monday (a working day) — streak is only Wed + Tue.
    const sessions = [session('2026-07-15'), session('2026-07-14')]
    expect(computeDayStreak(sessions, settings, today)).toBe(2)
  })
})
