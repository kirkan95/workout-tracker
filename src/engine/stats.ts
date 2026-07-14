import { UserSettings, WorkoutSession } from '../types'
import { dateStr, getWeekStartDate } from '../utils'
import { bestE1RM } from './e1rm'

// Sum of weight×reps across every logged set — the standard "how much did I
// move today" number.
export function sessionVolume(session: WorkoutSession): number {
  if (!session.exercises) return 0
  let total = 0
  for (const log of Object.values(session.exercises)) {
    for (const s of log.sets) {
      if (s.weight != null && s.reps != null) total += s.weight * s.reps
    }
  }
  return Math.round(total)
}

export function sessionSetsLogged(session: WorkoutSession): number {
  if (!session.exercises) return 0
  let n = 0
  for (const log of Object.values(session.exercises)) {
    for (const s of log.sets) if (s.weight != null || s.reps != null) n++
  }
  return n
}

export interface PRResult {
  exerciseId: string
  e1rm: number
  prevBest: number
}

// New PR = today's best estimated 1RM for an exercise beats every prior
// completed session's best for that same exercise.
export function findPRs(session: WorkoutSession, priorSessions: WorkoutSession[]): PRResult[] {
  if (!session.exercises) return []
  const prs: PRResult[] = []
  for (const [exId, log] of Object.entries(session.exercises)) {
    const e1rm = bestE1RM(log.sets)
    if (e1rm <= 0) continue
    let prevBest = 0
    for (const s of priorSessions) {
      if (s.date === session.date || !s.completed) continue
      const sets = s.exercises?.[exId]?.sets
      if (!sets) continue
      const b = bestE1RM(sets)
      if (b > prevBest) prevBest = b
    }
    if (e1rm > prevBest) prs.push({ exerciseId: exId, e1rm, prevBest })
  }
  return prs
}

export interface TrendPoint {
  date: string
  e1rm: number
}

// Chronological (oldest → newest) e1RM trend for one exercise, for the
// Progress tab sparkline. `sessions` is expected most-recent-first.
export function exerciseTrend(exerciseId: string, sessions: WorkoutSession[], limit = 12): TrendPoint[] {
  return sessions
    .filter((s) => s.completed && s.exercises?.[exerciseId]?.sets?.length)
    .slice()
    .reverse()
    .map((s) => ({ date: s.date, e1rm: bestE1RM(s.exercises![exerciseId].sets) }))
    .filter((p) => p.e1rm > 0)
    .slice(-limit)
}

// Consecutive days worked out, walking backward from today. A configured rest
// day never breaks the streak (it's a planned off day, not a missed one), and
// today itself is a "grace" day — if you haven't trained yet today the streak
// still stands, it just doesn't count until you log something. This is the
// motivating, attainable counterpart to the weekly streak below (a full week
// every week is a high bar — see the "streak should be days and weeks" note).
export function computeDayStreak(sessions: WorkoutSession[], settings: UserSettings, today: Date = new Date()): number {
  const completedDates = new Set(sessions.filter((s) => s.completed).map((s) => s.date))
  const restDays = new Set(settings.restDays)

  let streak = 0
  const cursor = new Date(today)
  for (let i = 0; i < 366; i++) {
    const isToday = i === 0
    const ds = dateStr(cursor)
    if (completedDates.has(ds)) {
      streak++
    } else if (restDays.has(cursor.getDay())) {
      // planned rest — bridges the streak without adding to it
    } else if (!isToday) {
      break // a missed working day on any past day ends the streak
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// Consecutive fully-completed past weeks, walking backward from last week
// (the current, possibly-still-in-progress week is never counted). A week
// "counts" when the number of distinct completed dates in it meets the
// number of working (non-rest) days the user configured.
export function computeStreak(sessions: WorkoutSession[], settings: UserSettings, today: Date = new Date()): number {
  const expectedWorkingDays = 7 - settings.restDays.length
  if (expectedWorkingDays <= 0) return 0

  const completedDates = new Set(sessions.filter((s) => s.completed).map((s) => s.date))
  const thisWeekStart = new Date(getWeekStartDate(settings.startDay, today) + 'T00:00:00')
  const cursor = new Date(thisWeekStart)
  cursor.setDate(cursor.getDate() - 7)

  let streak = 0
  for (let i = 0; i < 52; i++) {
    let count = 0
    for (let d = 0; d < 7; d++) {
      const day = new Date(cursor)
      day.setDate(cursor.getDate() + d)
      if (completedDates.has(dateStr(day))) count++
    }
    if (count < expectedWorkingDays) break
    streak++
    cursor.setDate(cursor.getDate() - 7)
  }
  return streak
}
