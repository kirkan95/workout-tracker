import { DaySchedule } from '../types'

// ── TYPESCRIPT CONCEPT: Record<K, V> ─────────────────────────────────────────
// Record<number, DaySchedule> means: an object whose keys are numbers and
// whose values are DaySchedule objects. TypeScript will error if you add a
// key with the wrong type or a value missing required fields.
export const SCHED: Record<number, DaySchedule> = {
  1: {
    type: 'strength',
    id: 'push',
    name: 'Push Day',
    sub: 'Chest · Shoulders · Triceps',
    exercises: [
      { id: 'chest_press',    name: 'Dumbbell Chest Press',      sets: 3, target: '10',  wt: true  },
      { id: 'shoulder_press', name: 'Dumbbell Shoulder Press',   sets: 3, target: '10',  wt: true  },
      { id: 'lateral_raises', name: 'Dumbbell Lateral Raises',   sets: 2, target: '12',  wt: true  },
      { id: 'tricep_dips',    name: 'Tricep Dips',               sets: 3, target: '10',  wt: false },
      { id: 'pushups',        name: 'Push-ups',                  sets: 1, target: 'max', wt: false },
    ],
  },
  2: {
    type: 'cardio',
    id: 'cardio',
    name: 'Cardio',
    sub: '2-mile run or 30 min elliptical',
  },
  3: {
    type: 'strength',
    id: 'pull',
    name: 'Pull Day',
    sub: 'Back · Biceps · Core',
    exercises: [
      { id: 'pullups',      name: 'Pull-ups',                    sets: 3, target: 'max', wt: false },
      { id: 'bent_rows',    name: 'Dumbbell Bent-Over Rows',     sets: 3, target: '10',  wt: true,  note: 'each side' },
      { id: 'hammer_curls', name: 'Dumbbell Hammer Curls',       sets: 3, target: '10',  wt: true  },
      { id: 'leg_lifts',    name: 'Leg Lifts',                   sets: 3, target: '12',  wt: false },
      { id: 'shrugs',       name: 'Dumbbell Shrugs',             sets: 2, target: '12',  wt: true  },
    ],
  },
  4: {
    type: 'cardio',
    id: 'cardio',
    name: 'Cardio',
    sub: '2-mile run or 30 min elliptical',
  },
  5: {
    type: 'strength',
    id: 'legs',
    name: 'Legs + Core',
    sub: 'Legs · Core',
    exercises: [
      { id: 'goblet_squat', name: 'Dumbbell Goblet Squat',       sets: 3, target: '12',  wt: true  },
      { id: 'rdl',          name: 'Romanian Deadlift',           sets: 3, target: '10',  wt: true  },
      { id: 'rev_lunges',   name: 'Reverse Lunges',              sets: 3, target: '8',   wt: false, note: 'each side' },
      { id: 'calf_raises',  name: 'Single-Leg Calf Raises',      sets: 2, target: '15',  wt: false, note: 'each side' },
      { id: 'plank',        name: 'Plank',                       sets: 2, target: '30s', wt: false, time: true },
    ],
  },
  6: { type: 'rest', id: 'rest', name: 'Rest Day', sub: 'Optional: sauna or light walk' },
  0: { type: 'rest', id: 'rest', name: 'Rest Day', sub: 'Optional: sauna or light walk' },
}

export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
