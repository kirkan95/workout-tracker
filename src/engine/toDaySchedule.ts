import { EXERCISES } from '../data/exercises'
import { DayPlan, DaySchedule, ExerciseDefinition } from '../types'

const DAY_META: Record<DayPlan['type'], { name: string; sub: string }> = {
  push:     { name: 'Push Day',    sub: 'Chest · Shoulders · Triceps' },
  pull:     { name: 'Pull Day',    sub: 'Back · Biceps · Core' },
  legs:     { name: 'Legs + Core', sub: 'Legs · Core' },
  fullbody: { name: 'Full Body',   sub: 'Total-body strength' },
  cardio:   { name: 'Cardio',      sub: 'Get your heart rate up' },
  rest:     { name: 'Rest Day',    sub: 'Optional: light walk or stretch' },
}

// Converts an engine-generated DayPlan (type + per-exercise targets) into the
// DaySchedule shape the UI renders (name/sub/exercise list). Exercise display
// data (name, note, whether it uses weight) is looked up from the same
// EXERCISES library the engine picked the exercise from — so the day's type
// and its exercise list can never disagree (the old bug: UPGRADE.md §1.5,
// where the AI's day type and the hardcoded schedule's exercise list came
// from two different sources and could mismatch).
export function toDaySchedule(dayPlan: DayPlan): DaySchedule {
  const meta = DAY_META[dayPlan.type] ?? { name: 'Workout', sub: '' }

  if (dayPlan.type === 'rest') {
    return { type: 'rest', id: 'rest', name: meta.name, sub: meta.sub }
  }
  if (dayPlan.type === 'cardio') {
    return { type: 'cardio', id: 'cardio', name: meta.name, sub: meta.sub }
  }

  const exercises: ExerciseDefinition[] = Object.entries(dayPlan.exercises ?? {}).map(([id, target]) => {
    const libEx = EXERCISES.find((e) => e.id === id)
    return {
      id,
      name: libEx?.name ?? id,
      sets: target.sets,
      target: target.repRange,
      wt: libEx?.usesWeight ?? false,
      note: libEx?.note,
      time: libEx?.repRange === 'time',
    }
  })

  return { type: 'strength', id: dayPlan.type, name: meta.name, sub: meta.sub, exercises }
}
