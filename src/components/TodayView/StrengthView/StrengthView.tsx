import { useState } from 'react'
import { DaySchedule, FormData, WorkoutSession } from '../../../types'
import ExerciseCard from './ExerciseCard/ExerciseCard'
import styles from './StrengthView.module.css'

interface Props {
  day: DaySchedule
  fd: FormData
  setFd: React.Dispatch<React.SetStateAction<FormData>>
  completed: boolean
  prevSession: WorkoutSession | null
  onComplete: () => Promise<void>
}

export default function StrengthView({ day, fd, setFd, completed, prevSession, onComplete }: Props) {
  const [saving, setSaving] = useState(false)

  // ── TYPESCRIPT CONCEPT: Literal types as function parameters ─────────────
  // "field: 'weight' | 'reps'" means this function only accepts exactly those
  // two strings. Passing any other string is a compile-time error.
  const handleChange = (exId: string, setIdx: number, field: 'weight' | 'reps', value: string) => {
    setFd((prev) => ({
      ...prev,
      [exId]: {
        ...prev[exId],
        [setIdx]: { ...(prev[exId]?.[setIdx] ?? { weight: '', reps: '' }), [field]: value },
      },
    }))
  }

  const handleComplete = async () => {
    setSaving(true)
    await onComplete()
    setSaving(false)
  }

  return (
    <>
      <div className="pg-title">{day.name}</div>
      <div className="pg-sub">{day.sub}</div>
      {completed && <div className="done-badge">✓ Workout Logged</div>}

      {day.exercises?.map((ex) => (
        <ExerciseCard
          key={ex.id}
          ex={ex}
          setData={fd[ex.id] ?? {}}
          prevSession={prevSession}
          onChange={(setIdx, field, value) => handleChange(ex.id, setIdx, field, value)}
        />
      ))}

      <button
        className={`${styles.completeBtn} ${completed ? styles.saved : ''}`}
        onClick={handleComplete}
        disabled={saving}
      >
        {saving ? 'Saving…' : completed ? '✓ Saved — Tap to Update' : 'Complete Workout'}
      </button>
    </>
  )
}
