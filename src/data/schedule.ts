import { DaySchedule } from '../types'
import { weeksSinceEpoch } from '../utils'

export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Variant A (even weeks) ─────────────────────────────────────────────────
const PUSH_A = [
  { id: 'db_chest_press',    name: 'Dumbbell Chest Press',      sets: 3, target: '10',  wt: true  },
  { id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press',   sets: 3, target: '10',  wt: true  },
  { id: 'lateral_raises',    name: 'Dumbbell Lateral Raises',   sets: 2, target: '12',  wt: true  },
  { id: 'tricep_dips',       name: 'Tricep Dips',               sets: 3, target: '10',  wt: false },
  { id: 'pushups',           name: 'Push-ups',                  sets: 1, target: 'max', wt: false },
]

const PULL_A = [
  { id: 'pullups',        name: 'Pull-ups',                    sets: 3, target: 'max', wt: false },
  { id: 'db_bent_row',    name: 'Dumbbell Bent-Over Rows',     sets: 3, target: '10',  wt: true,  note: 'each side' },
  { id: 'hammer_curls',   name: 'Dumbbell Hammer Curls',       sets: 3, target: '10',  wt: true  },
  { id: 'leg_raises',     name: 'Leg Raises',                  sets: 3, target: '12',  wt: false },
  { id: 'db_shrugs',      name: 'Dumbbell Shrugs',             sets: 2, target: '12',  wt: true  },
]

const LEGS_A = [
  { id: 'goblet_squat', name: 'Dumbbell Goblet Squat',       sets: 3, target: '12',  wt: true  },
  { id: 'rdl',          name: 'Romanian Deadlift',           sets: 3, target: '10',  wt: true  },
  { id: 'rev_lunges',   name: 'Reverse Lunges',              sets: 3, target: '8',   wt: false, note: 'each side' },
  { id: 'calf_raises',  name: 'Single-Leg Calf Raises',      sets: 2, target: '15',  wt: false, note: 'each side' },
  { id: 'plank',        name: 'Plank',                       sets: 2, target: '30s', wt: false, time: true  },
]

// ── Variant B (odd weeks) ──────────────────────────────────────────────────
const PUSH_B = [
  { id: 'db_flyes',           name: 'Dumbbell Flyes',            sets: 3, target: '12',  wt: true  },
  { id: 'arnold_press',       name: 'Arnold Press',              sets: 3, target: '10',  wt: true  },
  { id: 'lateral_raises',     name: 'Dumbbell Lateral Raises',   sets: 2, target: '12',  wt: true  },
  { id: 'overhead_tricep_ext', name: 'Overhead Tricep Extension', sets: 3, target: '12',  wt: true  },
  { id: 'diamond_pushups',    name: 'Diamond Push-ups',          sets: 3, target: 'max', wt: false },
]

const PULL_B = [
  { id: 'chinups',           name: 'Chin-ups',                  sets: 3, target: 'max', wt: false },
  { id: 'db_single_arm_row', name: 'Single-Arm Dumbbell Row',   sets: 3, target: '10',  wt: true, note: 'each side' },
  { id: 'db_bicep_curls',    name: 'Dumbbell Bicep Curls',      sets: 3, target: '12',  wt: true  },
  { id: 'russian_twists',    name: 'Russian Twists',            sets: 3, target: '18',  wt: false, note: 'total reps' },
  { id: 'rear_delt_flyes',   name: 'Rear Delt Flyes',           sets: 2, target: '14',  wt: true  },
]

const LEGS_B = [
  { id: 'sumo_squat',   name: 'Sumo Squat',              sets: 3, target: '12',  wt: true  },
  { id: 'glute_bridges', name: 'Glute Bridges',           sets: 3, target: '15',  wt: false },
  { id: 'db_lunges',    name: 'Dumbbell Walking Lunges',  sets: 3, target: '10',  wt: true, note: 'each side' },
  { id: 'calf_raises',  name: 'Single-Leg Calf Raises',  sets: 2, target: '15',  wt: false, note: 'each side' },
  { id: 'dead_bug',     name: 'Dead Bug',                 sets: 3, target: '8',   wt: false, note: 'each side' },
]

const REST = { type: 'rest' as const, id: 'rest', name: 'Rest Day', sub: 'Optional: light walk or stretch' }
const CARDIO = { type: 'cardio' as const, id: 'cardio', name: 'Cardio', sub: '2-mile run or 30 min elliptical' }

function getWeekVariant(d: Date): 0 | 1 {
  // Fixed epoch (not Jan 1 of the current year) so variants keep alternating
  // cleanly across the New Year boundary instead of resetting to the same
  // variant two weeks running.
  const weekNum = weeksSinceEpoch(d)
  return (((weekNum % 2) + 2) % 2) as 0 | 1
}

export function getSchedule(d: Date = new Date()): Record<number, DaySchedule> {
  const v = getWeekVariant(d)
  return {
    1: { type: 'strength', id: 'push',  name: 'Push Day',    sub: 'Chest · Shoulders · Triceps', exercises: v === 0 ? PUSH_A : PUSH_B },
    2: CARDIO,
    3: { type: 'strength', id: 'pull',  name: 'Pull Day',    sub: 'Back · Biceps · Core',         exercises: v === 0 ? PULL_A : PULL_B },
    4: CARDIO,
    5: { type: 'strength', id: 'legs',  name: 'Legs + Core', sub: 'Legs · Core',                  exercises: v === 0 ? LEGS_A : LEGS_B },
    6: REST,
    0: REST,
  }
}

// Kept for any consumer that only needs day-type names (not exercises)
export const SCHED: Record<number, DaySchedule> = getSchedule()
