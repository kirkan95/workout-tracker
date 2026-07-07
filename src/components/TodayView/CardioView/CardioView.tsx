import { useState } from 'react'
import { DaySchedule, CardioData, Feel } from '../../../types'
import WarmupBanner from '../../WarmupBanner/WarmupBanner'
import styles from './CardioView.module.css'

const FEEL_LABELS = ['Easy', 'Medium', 'Hard'] as const
const FEEL_KEYS: Feel[] = ['easy', 'medium', 'hard']

const TYPE_OPTIONS: { key: CardioData['type']; label: string; hasDistance: boolean }[] = [
  { key: 'run',        label: 'Run',        hasDistance: true },
  { key: 'walk',       label: 'Walk',       hasDistance: true },
  { key: 'bike',       label: 'Bike',       hasDistance: true },
  { key: 'row',        label: 'Row',        hasDistance: false },
  { key: 'elliptical', label: 'Elliptical', hasDistance: false },
]

function formatPace(duration: number, distance: number): string | null {
  if (!duration || !distance) return null
  const paceMin = duration / distance
  const m = Math.floor(paceMin)
  const s = Math.round((paceMin - m) * 60)
  return `${m}:${String(s).padStart(2, '0')} /mi`
}

interface Props {
  day: DaySchedule
  cd: CardioData
  setCd: React.Dispatch<React.SetStateAction<CardioData>>
  completed: boolean
  suggestedDuration?: number
  onComplete: () => Promise<void>
}

export default function CardioView({ day, cd, setCd, completed, suggestedDuration, onComplete }: Props) {
  const [saving, setSaving] = useState(false)
  const showDistance = TYPE_OPTIONS.find((t) => t.key === cd.type)?.hasDistance ?? false
  const pace = showDistance ? formatPace(cd.duration, cd.distance ?? 0) : null

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

      <div className={styles.card}>
        <div className={styles.fieldLbl}>Activity</div>
        <div className={styles.typeRow}>
          {TYPE_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.typeBtn} ${cd.type === key ? styles.active : ''}`}
              onClick={() => setCd((p) => ({ ...p, type: key }))}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.fieldCol}>
            <div className={styles.fieldLbl}>Duration (min)</div>
            <input
              className={styles.fieldInput}
              type="number"
              inputMode="numeric"
              placeholder={suggestedDuration ? String(suggestedDuration) : '30'}
              value={cd.duration === 0 ? '' : String(cd.duration)}
              onChange={(e) => setCd((p) => ({ ...p, duration: e.target.value ? parseInt(e.target.value) : 0 }))}
            />
          </div>
          {showDistance && (
            <div className={styles.fieldCol}>
              <div className={styles.fieldLbl}>Distance (mi)</div>
              <input
                className={styles.fieldInput}
                type="number"
                inputMode="decimal"
                placeholder="optional"
                value={cd.distance ? String(cd.distance) : ''}
                onChange={(e) => setCd((p) => ({ ...p, distance: e.target.value ? parseFloat(e.target.value) : undefined }))}
              />
            </div>
          )}
        </div>

        {pace && <div className={styles.pace}>{pace} pace</div>}

        <div className={styles.fieldLbl}>How did it feel?</div>
        <div className={styles.feelRow}>
          {FEEL_KEYS.map((key, i) => (
            <button
              key={key}
              className={`${styles.feelBtn} ${cd.feel === key ? styles[key] : ''}`}
              onClick={() => setCd((p) => ({ ...p, feel: key }))}
            >
              {FEEL_LABELS[i]}
            </button>
          ))}
        </div>

        <div className={styles.fieldLbl}>Notes</div>
        <input
          className={styles.fieldInput}
          type="text"
          placeholder="Optional"
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
