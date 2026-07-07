import { useState } from 'react'
import { ExerciseDefinition, ExerciseTarget, Feel, WorkoutSession } from '../../../../types'
import { EXERCISES } from '../../../../data/exercises'
import { resolveSetTarget } from '../../../../utils'
import styles from './ExerciseCard.module.css'

const FEEL_KEYS: Feel[] = ['easy', 'medium', 'hard']

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

interface Props {
  ex: ExerciseDefinition
  setData: Record<number, { weight: string; reps: string; feel?: Feel }>
  prevSession: WorkoutSession | null
  aiTarget?: ExerciseTarget
  configured: number
  onChange: (setIdx: number, field: 'weight' | 'reps', value: string) => void
  onFeelChange: (setIdx: number, feel: Feel) => void
  onLogSet: (setIdx: number) => void
  onAdjust: (delta: number) => void
  onSwap: () => void
}

export default function ExerciseCard({ ex, setData, prevSession, aiTarget, configured, onChange, onFeelChange, onLogSet, onAdjust, onSwap }: Props) {
  const [tipOpen, setTipOpen] = useState(false)
  const [menuSet, setMenuSet] = useState<number | null>(null)
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
        <div className={styles.headRight}>
          <button className={styles.swapBtn} onClick={onSwap}>⇄ swap</button>
          <div className={styles.target}>{label}</div>
        </div>
      </div>

      {libEx?.description && tipOpen && <div className={styles.tip}>{libEx.description}</div>}
      {aiTarget?.reason && <div className={styles.reason}>{aiTarget.reason}</div>}

      <div className={styles.setsWrap}>
        {Array.from({ length: ex.sets }, (_, s) => {
          const prevSet = prevSession?.exercises?.[ex.id]?.sets?.[s]
          const fd = setData[s] ?? { weight: '', reps: '' }
          const unit = ex.time ? 'Sec' : 'Reps'
          const menuOpen = menuSet === s

          const { weight: resolvedWeight, reps: resolvedReps } = resolveSetTarget(fd, aiTarget, prevSet, ex.target)

          const filled = ex.wt ? !!fd.weight : !!fd.reps

          const beatLast = filled && !!prevSet && (
            (parseFloat(fd.weight || '0') > (prevSet.weight ?? 0)) ||
            (parseFloat(fd.weight || '0') === (prevSet.weight ?? 0) && parseFloat(fd.reps || '0') > (prevSet.reps ?? 0))
          )

          const step = (field: 'weight' | 'reps', delta: number) => {
            const current = field === 'weight' ? fd.weight : fd.reps
            const base = current || (field === 'weight' ? resolvedWeight : resolvedReps) || '0'
            const next = Math.max(0, (parseFloat(base) || 0) + delta)
            onChange(s, field, String(next))
          }

          return (
            <div key={s} className={`${styles.setRow} ${filled ? styles.done : ''}`}>
              <div className={styles.setMain}>
                <span className={styles.setN}>{s + 1}</span>

                {ex.wt && (
                  <div className={styles.setValGroup}>
                    <button className={styles.step} onClick={() => step('weight', -2.5)} aria-label="Decrease weight">−</button>
                    <div className={styles.setVal}>
                      <input
                        className={styles.numInput}
                        type="number"
                        inputMode="decimal"
                        placeholder={resolvedWeight}
                        value={fd.weight}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => onChange(s, 'weight', e.target.value)}
                      />
                      <small>lbs</small>
                    </div>
                    <button className={styles.step} onClick={() => step('weight', 2.5)} aria-label="Increase weight">+</button>
                  </div>
                )}

                <div className={styles.setValGroup}>
                  <button className={styles.step} onClick={() => step('reps', -1)} aria-label={`Decrease ${unit.toLowerCase()}`}>−</button>
                  <div className={styles.setVal}>
                    <input
                      className={styles.numInput}
                      type="number"
                      inputMode="numeric"
                      placeholder={resolvedReps || ex.target}
                      value={fd.reps}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => onChange(s, 'reps', e.target.value)}
                    />
                    <small>{unit}</small>
                  </div>
                  <button className={styles.step} onClick={() => step('reps', 1)} aria-label={`Increase ${unit.toLowerCase()}`}>+</button>
                </div>

                <button
                  className={`${styles.ck} ${filled ? styles.ckDone : ''}`}
                  onClick={() => onLogSet(s)}
                  aria-label={filled ? 'Restart rest timer' : 'Log this set'}
                >
                  ✓
                </button>
              </div>

              <div className={styles.setMeta}>
                {beatLast && <span className={styles.beat}>▲ beat last</span>}
                <div className={styles.feelDots}>
                  {FEEL_KEYS.map((k) => (
                    <button
                      key={k}
                      className={`${styles.fdot} ${fd.feel === k ? `${styles.on} ${styles[k]}` : ''}`}
                      onClick={() => onFeelChange(s, k)}
                      aria-pressed={fd.feel === k}
                      aria-label={`Rate this set ${k}`}
                    />
                  ))}
                </div>
                <button
                  className={`${styles.menuBtn} ${menuOpen ? styles.menuBtnActive : ''}`}
                  onClick={() => setMenuSet(menuOpen ? null : s)}
                  aria-label="Rest timer settings"
                >
                  ⋮
                </button>
              </div>

              {menuOpen && (
                <div className={styles.timerPanel}>
                  <button className={styles.tpBtn} onClick={() => onAdjust(-5)}>−5s</button>
                  <span className={styles.tpTime}>{fmt(configured)}</span>
                  <button className={styles.tpBtn} onClick={() => onAdjust(5)}>+5s</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
