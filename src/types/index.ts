// ── TYPESCRIPT CONCEPT: Interfaces ────────────────────────────────────────────
// An interface describes the shape of an object. TypeScript checks that any
// value typed as an interface has exactly those fields. It's a compile-time
// contract — no runtime overhead.

export interface SetData {
  weight: number | null  // "number | null" is a union type — the value is either a number OR null
  reps: number | null
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
  type: 'run' | 'elliptical'
  duration: string
  notes: string
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

// ── TYPESCRIPT CONCEPT: Type aliases ─────────────────────────────────────────
// "type" creates an alias for a more complex type expression.
// This one describes the in-progress form state: exercise id → set index → field values.
export type FormData = Record<string, Record<number, { weight: string; reps: string }>>
