// ── TYPESCRIPT CONCEPT: Interfaces ────────────────────────────────────────────
// An interface describes the shape of an object. TypeScript checks that any
// value typed as an interface has exactly those fields. It's a compile-time
// contract — no runtime overhead.

import type { Equipment } from '../data/exercises'

export type Feel = 'easy' | 'medium' | 'hard'

export interface SetData {
  weight: number | null  // "number | null" is a union type — the value is either a number OR null
  reps: number | null
  feel?: Feel
}

export interface ExerciseLog {
  sets: SetData[]  // SetData[] means "an array of SetData objects"
}

export interface WorkoutSession {
  date: string
  dayOfWeek: number
  type: 'strength' | 'cardio' | 'rest'  // string literal union — only these three values are valid
  workoutId: string
  completed: boolean
  timestamp: number
  exercises?: Record<string, ExerciseLog>  // "?" makes a field optional. Record<K,V> is a typed key→value map
  cardio?: CardioData
}

export interface CardioData {
  type: 'run' | 'elliptical' | 'walk' | 'bike' | 'row'
  duration: number  // minutes
  distance?: number // miles — optional, powers pace tracking
  notes: string
  feel?: Feel
}

export interface ExerciseDefinition {
  id: string
  name: string
  sets: number
  target: string
  wt: boolean       // whether this exercise uses weight
  note?: string
  time?: boolean    // whether reps are actually seconds
}

export interface DaySchedule {
  type: 'strength' | 'cardio' | 'rest'
  id: string
  name: string
  sub: string
  exercises?: ExerciseDefinition[]
}

export interface UserSettings {
  goal: 'stronger' | 'muscle' | 'loseweight' | 'stayfit'
  startDay: number          // 0–6, Sunday = 0
  restDays: number[]
  equipment: Equipment[]
  exclusions: string[]      // movement type keys
  mesocycleStart: string    // ISO date of first session
  timerAlert: 'sound' | 'silent'
  workoutDuration: number   // minutes
}

export interface ExerciseTarget {
  sets: number
  repRange: string          // e.g. "8-12"
  weight: number | null
  reason?: string           // human-readable — why this target ("hit 3x12 last time, rated easy")
}

export interface DayPlan {
  type: 'push' | 'pull' | 'legs' | 'fullbody' | 'cardio' | 'rest'
  exercises?: Record<string, ExerciseTarget>
  cardioType?: CardioData['type']
  cardioDuration?: number
  cardioDistance?: number
  cardioEffort?: Feel
  note?: string
  deload?: boolean
}

export interface WeeklyPlan {
  weekStartDate: string
  settingsHash: string
  status: 'ok' | 'error'
  source: 'engine' | 'ai'   // engine = generated on-device, no AI call needed
  durationConflict?: boolean
  mesocycleWeek?: number
  schedule: Record<string, DayPlan>
}

export interface BodyweightEntry {
  date: string
  weight: number  // lbs
}

// ── TYPESCRIPT CONCEPT: Type aliases ─────────────────────────────────────────
// "type" creates an alias for a more complex type expression.
// This one describes the in-progress form state: exercise id → set index → field values.
// feel lives here too (not in separate state) so it shares the form's lifecycle —
// previously a separate `feelData` state got wiped on tab switches and re-saves.
// `logged` is set only when the lifter taps the ✓ button — it's what marks a
// set "done" (green row + filled check), so merely typing a weight or rep no
// longer checks the set off.
export type FormData = Record<string, Record<number, { weight: string; reps: string; feel?: Feel; logged?: boolean }>>
