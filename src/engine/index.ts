// Public surface of the deterministic training engine. Everything here is a
// pure function of (settings, session history, dates) — no network calls, no
// AI dependency. See UPGRADE.md §0 for the rationale.
export { planWeek } from './planner'
export type { PlanWeekInput } from './planner'
export { progressExercise, applyDeload, applyReturnFromBreak, GOAL_PARAMS } from './progression'
export type { Goal, GoalParams, ProgressionResult } from './progression'
export { epley1RM, bestE1RM } from './e1rm'
export { sessionVolume, sessionSetsLogged, findPRs, exerciseTrend, computeStreak } from './stats'
export type { PRResult, TrendPoint } from './stats'
export { toDaySchedule } from './toDaySchedule'
export { findAlternatives } from './alternatives'
