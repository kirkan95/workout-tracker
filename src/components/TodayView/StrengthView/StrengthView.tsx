import { useMemo, useState } from 'react'
import { DaySchedule, ExerciseDefinition, ExerciseTarget, Feel, FormData, UserSettings, WorkoutSession } from '../../../types'
import { EXERCISES } from '../../../data/exercises'
import { findAlternatives, progressExercise } from '../../../engine'
import { resolveSetTarget } from '../../../utils'
import ExerciseCard from './ExerciseCard/ExerciseCard'
import WarmupBanner from '../../WarmupBanner/WarmupBanner'
import styles from './StrengthView.module.css'

interface Props {
  day: DaySchedule
  fd: FormData
  setFd: React.Dispatch<React.SetStateAction<FormData>>
  completed: boolean
  deload: boolean
  prevSession: WorkoutSession | null
  aiTargets: Record<string, ExerciseTarget>
  settings: UserSettings
  sessions: WorkoutSession[]
  configured: number
  elapsedMinutes: number
  onComplete: () => Promise<void>
  onTimerStart: () => void
  onAdjust: (delta: number) => void
}

export default function StrengthView({ day, fd, setFd, completed, deload, prevSession, aiTargets, settings, sessions, configured, elapsedMinutes, onComplete, onTimerStart, onAdjust }: Props) {
  const [saving, setSaving] = useState(false)
  const [swaps, setSwaps] = useState<Record<string, string>>({})
  const [swapForExId, setSwapForExId] = useState<string | null>(null)

  // A swap only ever changes which exercise fills a "slot" — the sets/rest
  // day type and everything else about the plan stays exactly as the engine
  // generated it. Targets for the replacement are computed fresh via the
  // same progression engine, not copied from the original exercise. `slots`
  // keeps the original (engine-assigned) id paired with whatever's currently
  // displayed, so the swap sheet can always ask "swap THIS slot again"
  // without a reverse lookup.
  const slots = useMemo(() => {
    if (!day.exercises) return []
    return day.exercises.map((ex) => {
      const replacementId = swaps[ex.id]
      if (!replacementId) return { originalId: ex.id, display: ex }
      const libEx = EXERCISES.find((e) => e.id === replacementId)
      if (!libEx) return { originalId: ex.id, display: ex }
      const result = progressExercise(libEx, settings.goal, sessions)
      const display: ExerciseDefinition = {
        id: libEx.id, name: libEx.name, sets: result.sets, target: result.repRange,
        wt: libEx.usesWeight, note: libEx.note, time: libEx.repRange === 'time',
      }
      return { originalId: ex.id, display }
    })
  }, [day.exercises, swaps, settings.goal, sessions])

  const displayExercises: ExerciseDefinition[] = useMemo(() => slots.map((s) => s.display), [slots])

  const displayTargets: Record<string, ExerciseTarget> = useMemo(() => {
    const map: Record<string, ExerciseTarget> = { ...aiTargets }
    if (!day.exercises) return map
    day.exercises.forEach((ex) => {
      const replacementId = swaps[ex.id]
      if (!replacementId) return
      const libEx = EXERCISES.find((e) => e.id === replacementId)
      if (!libEx) return
      const result = progressExercise(libEx, settings.goal, sessions)
      map[libEx.id] = { sets: result.sets, repRange: result.repRange, weight: result.weight, reason: result.reason }
    })
    return map
  }, [day.exercises, aiTargets, swaps, settings.goal, sessions])

  const totalSets = displayExercises.reduce((sum, ex) => sum + ex.sets, 0)
  const loggedSets = displayExercises.reduce((sum, ex) => {
    let n = 0
    for (let s = 0; s < ex.sets; s++) {
      const v = fd[ex.id]?.[s]
      if (ex.wt ? v?.weight : v?.reps) n++
    }
    return sum + n
  }, 0)
  const volume = displayExercises.reduce((sum, ex) => {
    let v = 0
    for (let s = 0; s < ex.sets; s++) {
      const set = fd[ex.id]?.[s]
      if (set?.weight && set?.reps) v += parseFloat(set.weight) * parseFloat(set.reps)
    }
    return sum + v
  }, 0)
  const pct = totalSets > 0 ? loggedSets / totalSets : 0
  const circumference = 2 * Math.PI * 22

  const firstEx = displayExercises[0]
  const warmupWeight = firstEx ? displayTargets[firstEx.id]?.weight ?? null : null

  const handleChange = (exId: string, setIdx: number, field: 'weight' | 'reps', value: string) => {
    setFd((prev) => ({
      ...prev,
      [exId]: {
        ...prev[exId],
        [setIdx]: { ...(prev[exId]?.[setIdx] ?? { weight: '', reps: '' }), [field]: value },
      },
    }))
  }

  const handleFeelChange = (exId: string, setIdx: number, feel: Feel) => {
    setFd((prev) => ({
      ...prev,
      [exId]: {
        ...prev[exId],
        [setIdx]: { ...(prev[exId]?.[setIdx] ?? { weight: '', reps: '' }), feel },
      },
    }))
  }

  // One-tap set logging: if the lifter hasn't typed anything, commit the
  // exact numbers shown as the placeholder (target -> previous session ->
  // exercise default, in that order) and start the rest timer. If they
  // already typed something, this just confirms it and starts resting.
  const handleLogSet = (exId: string, setIdx: number) => {
    const ex = displayExercises.find((e) => e.id === exId)
    if (!ex) return
    const target = displayTargets[exId]
    const prevSet = prevSession?.exercises?.[exId]?.sets?.[setIdx]
    const current = fd[exId]?.[setIdx] ?? { weight: '', reps: '' }
    const { weight, reps } = resolveSetTarget(current, target, prevSet, ex.target)
    if (ex.wt && !current.weight && weight) handleChange(exId, setIdx, 'weight', weight)
    if (!current.reps && reps) handleChange(exId, setIdx, 'reps', reps)
    onTimerStart()
  }

  const handleComplete = async () => {
    setSaving(true)
    await onComplete()
    setSaving(false)
  }

  const swapCurrentId = swapForExId ? (swaps[swapForExId] ?? swapForExId) : null
  const alternatives = swapCurrentId ? findAlternatives(swapCurrentId, settings) : []

  return (
    <>
      <div className={styles.header}>
        <svg className={styles.ring} viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="none" stroke="var(--surface2)" strokeWidth="5" />
          <circle
            cx="26" cy="26" r="22" fill="none" stroke="var(--accent)" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            transform="rotate(-90 26 26)"
          />
          <text x="26" y="30" textAnchor="middle" fill="var(--text)" fontSize="11" fontWeight="800">{loggedSets}/{totalSets}</text>
        </svg>
        <div className={styles.headerText}>
          <div className={styles.dayName}>{day.name}</div>
          <div className={styles.headerMeta}>{day.sub}{deload ? ' · Deload week' : ''}</div>
        </div>
        <div className={styles.headerVol}>
          <span className={`num ${styles.volNum}`}>{Math.round(volume).toLocaleString()}</span>
          <span className={styles.volLbl}>lbs · {elapsedMinutes} min</span>
        </div>
      </div>

      {completed && <div className="done-badge">✓ Workout Logged</div>}

      <WarmupBanner workoutId={day.id} workingWeight={warmupWeight} />

      {slots.map(({ originalId, display: ex }) => (
        <ExerciseCard
          key={originalId}
          ex={ex}
          setData={fd[ex.id] ?? {}}
          prevSession={prevSession}
          aiTarget={displayTargets[ex.id]}
          configured={configured}
          onChange={(setIdx, field, value) => handleChange(ex.id, setIdx, field, value)}
          onFeelChange={(setIdx, feel) => handleFeelChange(ex.id, setIdx, feel)}
          onLogSet={(setIdx) => handleLogSet(ex.id, setIdx)}
          onAdjust={onAdjust}
          onSwap={() => setSwapForExId(originalId)}
        />
      ))}

      <button
        className={`${styles.completeBtn} ${completed ? styles.saved : ''}`}
        onClick={handleComplete}
        disabled={saving}
      >
        {saving ? 'Saving…' : completed ? '✓ Saved — Tap to Update' : 'Complete Workout'}
      </button>

      {swapForExId && (
        <div className="sheetScrim" onClick={() => setSwapForExId(null)}>
          <div className="sheetWrap" onClick={(e) => e.stopPropagation()}>
            <div className={styles.swapSheet}>
              <div className="sheetGrabber" />
              <div className={styles.swapTitle}>Swap exercise</div>
              <div className={styles.swapSub}>Same movement pattern, filtered by your equipment.</div>
              {alternatives.length === 0 && <p className={styles.swapEmpty}>No alternatives available with your current equipment.</p>}
              {alternatives.map((alt) => (
                <button key={alt.id} className={styles.swapOption} onClick={() => { setSwaps((prev) => ({ ...prev, [swapForExId]: alt.id })); setSwapForExId(null) }}>
                  <span className={styles.swapOptionName}>{alt.name}</span>
                  <span className={styles.swapOptionMuscles}>{alt.muscles.join(' · ')}</span>
                </button>
              ))}
              {swaps[swapForExId] && (
                <button className={styles.swapReset} onClick={() => { setSwaps((prev) => { const next = { ...prev }; delete next[swapForExId]; return next }); setSwapForExId(null) }}>
                  Reset to original
                </button>
              )}
              <button className={styles.swapClose} onClick={() => setSwapForExId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
