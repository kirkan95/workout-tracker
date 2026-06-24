import { useState } from 'react'
import { ExerciseDefinition, WorkoutSession } from '../../../../types'
import { EXERCISES } from '../../../../data/exercises'
import styles from './ExerciseCard.module.css'

type Feel = 'easy' | 'medium' | 'hard'

const FEEL_LABELS: { key: Feel; label: string }[] = [
  { key: 'easy',   label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard',   label: 'Hard' },
]

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

interface Props {
  ex: ExerciseDefinition
  setData: Record<number, { weight: string; reps: string }>
  prevSession: WorkoutSession | null
  feel: Record<number, Feel>
  aiTarget?: { repRange: string; weight: number | null }
  configured: number
  timerRunning: boolean
  onChange: (setIdx: number, field: 'weight' | 'reps', value: string) => void
  onFeelChange: (setIdx: number, feel: Feel) => void
  onTimerStart: () => void
  onAdjust: (delta: number) => void
}

export default function ExerciseCard({ ex, setData, prevSession, feel, aiTarget, configured, timerRunning, onChange, onFeelChange, onTimerStart, onAdjust }: Props) {
  const [tipOpen, setTipOpen] = useState(false)
  const [openMenuSet, setOpenMenuSet] = useState<number | null>(null)
  const libEx = EXERCISES.find((e) => e.id === ex.id)
  const label = aiTarget ? `${ex.sets} × ${aiTarget.repRange}` : `${ex.sets} × ${ex.target}`
  const primaryMuscle = libEx?.muscles[0]
  const secondaryMuscles = libEx && libEx.muscles.length > 1 ? libEx.muscles.slice(1) : []

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div>
          <div className={styles.nameRow}>
            <span className={styles.name}>{ex.name}</span>
            {libEx?.description && (
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
          {primaryMuscle && <div className={styles.muscles}>{primaryMuscle}{secondaryMuscles.length > 0 ? ` · ${secondaryMuscles.join(' · ')}` : ''}</div>}
        </div>
        <div className={styles.target}>{label}</div>
      </div>

      {libEx?.description && tipOpen && <div className={styles.tip}>{libEx.description}</div>}

      <div className={styles.setsWrap}>
        {Array.from({ length: ex.sets }, (_, s) => {
          const prevSet = prevSession?.exercises?.[ex.id]?.sets?.[s]
          const fd = setData[s] ?? { weight: '', reps: '' }
          const unit = ex.time ? 'Sec' : 'Reps'

          const wtPH   = aiTarget?.weight != null ? String(aiTarget.weight)
                       : prevSet?.weight  != null ? String(prevSet.weight) : ''
          const repsPH = aiTarget         ? aiTarget.repRange
                       : prevSet?.reps    != null ? String(prevSet.reps)   : ex.target

          const filled = ex.wt ? !!fd.weight : !!fd.reps
          const menuOpen = openMenuSet === s

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
                <div className={styles.timerGroup}>
                  <button
                    className={`${styles.timerBtn} ${timerRunning ? styles.timerBtnRunning : ''}`}
                    onClick={() => { onTimerStart(); setOpenMenuSet(null) }}
                    aria-label="Start rest timer"
                  >
                    ⏱
                  </button>
                  <button
                    className={`${styles.menuBtn} ${menuOpen ? styles.menuBtnActive : ''}`}
                    onClick={() => setOpenMenuSet(menuOpen ? null : s)}
                    aria-label="Timer settings"
                  >
                    ⋮
                  </button>
                </div>
              </div>

              {menuOpen && (
                <div className={styles.timerPanel}>
                  <button className={styles.tpBtn} onClick={() => onAdjust(-5)}>−5s</button>
                  <span className={styles.tpTime}>{fmt(configured)}</span>
                  <button className={styles.tpBtn} onClick={() => onAdjust(+5)}>+5s</button>
                </div>
              )}

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
