import { useState } from 'react'
import { DaySchedule, FormData, WorkoutSession, ExerciseTarget } from '../../../types'
import ExerciseCard from './ExerciseCard/ExerciseCard'
import WarmupBanner from '../../WarmupBanner/WarmupBanner'
import styles from './StrengthView.module.css'

type Feel = 'easy' | 'medium' | 'hard'

interface Props {
  day: DaySchedule
  fd: FormData
  setFd: React.Dispatch<React.SetStateAction<FormData>>
  completed: boolean
  prevSession: WorkoutSession | null
  feelData: Record<string, Record<number, Feel>>
  aiTargets: Record<string, ExerciseTarget>
  configured: number
  timerRunning: boolean
  onComplete: () => Promise<void>
  onFeelChange: (exId: string, setIdx: number, feel: Feel) => void
  onTimerStart: () => void
  onAdjust: (delta: number) => void
}

export default function StrengthView({ day, fd, setFd, completed, prevSession, feelData, aiTargets, configured, timerRunning, onComplete, onFeelChange, onTimerStart, onAdjust }: Props) {
  const [saving, setSaving] = useState(false)

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

      <WarmupBanner workoutId={day.id} />

      {day.exercises?.map((ex) => (
        <ExerciseCard
          key={ex.id}
          ex={ex}
          setData={fd[ex.id] ?? {}}
          prevSession={prevSession}
          feel={feelData[ex.id] ?? {}}
          aiTarget={aiTargets[ex.id]}
          configured={configured}
          onChange={(setIdx, field, value) => handleChange(ex.id, setIdx, field, value)}
          onFeelChange={(setIdx, feel) => onFeelChange(ex.id, setIdx, feel)}
          onTimerStart={onTimerStart}
          onAdjust={onAdjust}
        />
      ))}

      {timerRunning && <div style={{ height: 56 }} />}

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
