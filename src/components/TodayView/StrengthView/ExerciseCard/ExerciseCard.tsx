import { useState } from 'react'
import { ExerciseDefinition, WorkoutSession } from '../../../../types'
import { TIPS } from '../../../../data/tips'
import styles from './ExerciseCard.module.css'

type Feel = 'easy' | 'medium' | 'hard'

const FEEL_LABELS: { key: Feel; label: string }[] = [
  { key: 'easy',   label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard',   label: 'Hard' },
]

interface Props {
  ex: ExerciseDefinition
  setData: Record<number, { weight: string; reps: string }>
  prevSession: WorkoutSession | null
  feel: Record<number, Feel>
  aiTarget?: { repRange: string; weight: number | null }
  onChange: (setIdx: number, field: 'weight' | 'reps', value: string) => void
  onFeelChange: (setIdx: number, feel: Feel) => void
  onTimerStart: () => void
}

export default function ExerciseCard({ ex, setData, prevSession, feel, aiTarget, onChange, onFeelChange, onTimerStart }: Props) {
  const [tipOpen, setTipOpen] = useState(false)
  const tip = TIPS[ex.id]
  const label = aiTarget ? `${ex.sets} × ${aiTarget.repRange}` : `${ex.sets} × ${ex.target}`

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div>
          <div className={styles.nameRow}>
            <span className={styles.name}>{ex.name}</span>
            {tip && (
              <button
                className={`${styles.tipBtn} ${tipOpen ? styles.tipBtnActive : ''}`}
                onClick={() => setTipOpen((o) => !o)}
                aria-label="How to"
              >
                ?
              </button>
            )}
          </div>
          {ex.note && <div className={styles.note}>{ex.note}</div>}
        </div>
        <div className={styles.target}>{label}</div>
      </div>

      {tip && tipOpen && <div className={styles.tip}>{tip}</div>}

      <div className={styles.setsWrap}>
        {Array.from({ length: ex.sets }, (_, s) => {
          const prevSet = prevSession?.exercises?.[ex.id]?.sets?.[s]
          const fd = setData[s] ?? { weight: '', reps: '' }
          const unit = ex.time ? 'Sec' : 'Reps'

          const wtPH   = aiTarget?.weight != null ? String(aiTarget.weight)
                       : prevSet?.weight  != null ? String(prevSet.weight) : '—'
          const repsPH = aiTarget         ? aiTarget.repRange
                       : prevSet?.reps    != null ? String(prevSet.reps)   : ex.target

          const filled = ex.wt ? !!fd.weight : !!fd.reps

          return (
            <div key={s} className={styles.setBlock}>
              <div className={styles.setRow}>
                <span className={styles.setLbl}>Set {s + 1}</span>
                <div className={styles.setInputs}>
                  {ex.wt && (
                    <div className={styles.setField}>
                      <span className={styles.setFieldLbl}>lbs</span>
                      <input
                        className={styles.setInput}
                        type="number"
                        inputMode="decimal"
                        placeholder={wtPH}
                        value={fd.weight}
                        onChange={(e) => onChange(s, 'weight', e.target.value)}
                      />
                    </div>
                  )}
                  <div className={styles.setField}>
                    <span className={styles.setFieldLbl}>{unit}</span>
                    <input
                      className={styles.setInput}
                      type="number"
                      inputMode="numeric"
                      placeholder={repsPH}
                      value={fd.reps}
                      onChange={(e) => onChange(s, 'reps', e.target.value)}
                    />
                  </div>
                </div>
                <button className={styles.timerBtn} onClick={onTimerStart} aria-label="Start rest timer">
                  ⏱
                </button>
              </div>

              {filled && (
                <div className={styles.feelRow}>
                  {FEEL_LABELS.map(({ key, label: fl }) => (
                    <button
                      key={key}
                      className={`${styles.feelBtn} ${feel[s] === key ? styles[key] : ''}`}
                      onClick={() => onFeelChange(s, key)}
                    >
                      {fl}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
