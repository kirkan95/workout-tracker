import { SetData } from '../types'

// Epley formula — the standard estimate of a one-rep max from any weight×reps
// set. Used for PR detection and the Progress tab's trend chart. Only an
// estimate (form/fatigue aren't modeled) but consistent enough to compare a
// lifter against their own history over time.
export function epley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

// Best (highest) estimated 1RM among a set of logged sets for one exercise.
export function bestE1RM(sets: Pick<SetData, 'weight' | 'reps'>[]): number {
  let best = 0
  for (const s of sets) {
    if (s.weight == null || s.reps == null || s.weight <= 0 || s.reps <= 0) continue
    const e = epley1RM(s.weight, s.reps)
    if (e > best) best = e
  }
  return Math.round(best * 10) / 10
}
