import { useState } from 'react'
import { DaySchedule, CardioData } from '../../../types'
import styles from './CardioView.module.css'

interface Props {
  day: DaySchedule
  cd: CardioData
  setCd: React.Dispatch<React.SetStateAction<CardioData>>
  completed: boolean
  onComplete: () => Promise<void>
}

export default function CardioView({ day, cd, setCd, completed, onComplete }: Props) {
  const [saving, setSaving] = useState(false)

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

      <div className={styles.card}>
        <div className={styles.fieldLbl}>Activity</div>
        <div className={styles.typeRow}>
          <button
            className={`${styles.typeBtn} ${cd.type === 'run' ? styles.active : ''}`}
            onClick={() => setCd((p) => ({ ...p, type: 'run' }))}
          >
            🏃 Run
          </button>
          <button
            className={`${styles.typeBtn} ${cd.type === 'elliptical' ? styles.active : ''}`}
            onClick={() => setCd((p) => ({ ...p, type: 'elliptical' }))}
          >
            🔄 Elliptical
          </button>
        </div>

        <div className={styles.fieldLbl}>Duration (minutes)</div>
        <input
          className={styles.fieldInput}
          type="number"
          inputMode="numeric"
          placeholder="30"
          value={cd.duration}
          onChange={(e) => setCd((p) => ({ ...p, duration: e.target.value }))}
        />

        <div className={styles.fieldLbl}>Notes</div>
        <input
          className={styles.fieldInput}
          type="text"
          placeholder="How did it feel?"
          value={cd.notes}
          onChange={(e) => setCd((p) => ({ ...p, notes: e.target.value }))}
        />
      </div>

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
