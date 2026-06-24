import { useState } from 'react'
import { WorkoutSession } from '../../types'
import { EXERCISES } from '../../data/exercises'
import styles from './HistoryView.module.css'

const EXERCISE_MAP = new Map(EXERCISES.map((e) => [e.id, e]))

const WORKOUT_NAMES: Record<string, string> = {
  push: 'Push Day', pull: 'Pull Day', legs: 'Legs + Core', cardio: 'Cardio', rest: 'Rest Day',
}

const FEEL_COLORS: Record<string, string> = {
  easy: styles.feelEasy, medium: styles.feelMedium, hard: styles.feelHard,
}

interface Props {
  sessions: WorkoutSession[]
}

export default function HistoryView({ sessions }: Props) {
  const [openDate, setOpenDate] = useState<string | null>(null)

  if (!sessions.length) {
    return (
      <>
        <div className="pg-title">History</div>
        <div className={styles.empty}>
          <div className={styles.emptyIco}>📋</div>
          <p>No workouts logged yet.<br />Complete today's session<br />to get started.</p>
        </div>
      </>
    )
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const workoutCounts: Record<string, number> = {}
  const hardCounts: Record<string, number> = {}
  const feelTotals: Record<string, number> = {}

  sessions.forEach((ses) => {
    if (ses.type !== 'strength' || !ses.workoutId) return
    workoutCounts[ses.workoutId] = (workoutCounts[ses.workoutId] ?? 0) + 1
    if (!ses.exercises) return
    Object.values(ses.exercises).forEach((ex) => {
      ex.sets.forEach((set) => {
        if (!set.feel) return
        feelTotals[ses.workoutId] = (feelTotals[ses.workoutId] ?? 0) + 1
        if (set.feel === 'hard') hardCounts[ses.workoutId] = (hardCounts[ses.workoutId] ?? 0) + 1
      })
    })
  })

  const workoutIds = Object.keys(workoutCounts)
  const hardestId = workoutIds.length > 0
    ? workoutIds.reduce((best, id) => {
        const ratio = (hardCounts[id] ?? 0) / (feelTotals[id] ?? 1)
        const bestRatio = (hardCounts[best] ?? 0) / (feelTotals[best] ?? 1)
        return ratio > bestRatio ? id : best
      })
    : null

  const leastDoneId = workoutIds.length > 1
    ? workoutIds.reduce((a, b) => workoutCounts[a] < workoutCounts[b] ? a : b)
    : null

  const showStats = sessions.length >= 3

  return (
    <>
      <div className="pg-title">History</div>

      {showStats && (
        <div className={styles.statsCard}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Total workouts</span>
            <span className={styles.statValue}>{sessions.filter((s) => s.type === 'strength').length}</span>
          </div>
          {hardestId && feelTotals[hardestId] >= 5 && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Toughest day</span>
              <span className={styles.statValue}>{WORKOUT_NAMES[hardestId] ?? hardestId}</span>
            </div>
          )}
          {leastDoneId && workoutCounts[leastDoneId] < workoutCounts[workoutIds[0]] && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Most skipped</span>
              <span className={`${styles.statValue} ${styles.statWarn}`}>{WORKOUT_NAMES[leastDoneId] ?? leastDoneId}</span>
            </div>
          )}
        </div>
      )}

      {sessions.map((ses) => {
        const d = new Date(ses.date + 'T12:00:00')
        const lbl = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        const open = openDate === ses.date
        const dayName = ses.workoutId ? (WORKOUT_NAMES[ses.workoutId] ?? 'Workout') : 'Workout'

        let detail: React.ReactNode = null

        if (ses.type === 'strength' && ses.exercises) {
          detail = Object.entries(ses.exercises).map(([exId, logged]) => {
            if (!logged?.sets?.length) return null
            const libEx = EXERCISE_MAP.get(exId)
            const exName = libEx?.name ?? exId
            const isTime = libEx ? libEx.repRange === 'time' : false

            const rows = logged.sets
              .map((set, i) => {
                const parts: string[] = []
                if (set.weight != null && set.weight !== 0) parts.push(`${set.weight} lbs`)
                if (set.reps   != null && set.reps   !== 0) parts.push(`${set.reps} ${isTime ? 'sec' : 'reps'}`)
                if (!parts.length) return null
                return (
                  <div key={i} className={styles.hSet}>
                    <span className={styles.hSetLbl}>Set {i + 1}</span>
                    <span className={styles.hSetData}>{parts.join(' × ')}</span>
                    {set.feel && (
                      <span className={`${styles.feelBadge} ${FEEL_COLORS[set.feel] ?? ''}`}>
                        {set.feel}
                      </span>
                    )}
                  </div>
                )
              })
              .filter(Boolean)

            if (!rows.length) return null
            return (
              <div key={exId} className={styles.hEx}>
                <div className={styles.hExName}>{exName}</div>
                {rows}
              </div>
            )
          })
        } else if (ses.type === 'cardio' && ses.cardio) {
          const c = ses.cardio
          detail = (
            <div className={styles.hEx}>
              <div className={styles.hSet}><span className={styles.hSetLbl}>Type</span><span>{c.type === 'run' ? '🏃 Run' : '🔄 Elliptical'}</span></div>
              {c.duration ? <div className={styles.hSet}><span className={styles.hSetLbl}>Time</span><span>{c.duration} min</span></div> : null}
              {c.notes    ? <div className={styles.hSet}><span className={styles.hSetLbl}>Notes</span><span>{c.notes}</span></div> : null}
              {c.feel     ? <div className={styles.hSet}><span className={styles.hSetLbl}>Feel</span><span className={`${styles.feelBadge} ${FEEL_COLORS[c.feel] ?? ''}`}>{c.feel}</span></div> : null}
            </div>
          )
        }

        return (
          <div
            key={ses.date}
            className={`${styles.hItem} ${open ? styles.open : ''}`}
            onClick={() => setOpenDate(open ? null : ses.date)}
          >
            <div className={styles.hHead}>
              <div>
                <div className={styles.hDate}>{lbl}</div>
                <div className={styles.hType}>{dayName}</div>
              </div>
              <span className={styles.hChevron}>›</span>
            </div>
            {open && (
              <div className={styles.hBody}>
                {detail ?? <p className={styles.noDetail}>No details recorded.</p>}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
