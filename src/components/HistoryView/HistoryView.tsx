import { useState } from 'react'
import { WorkoutSession } from '../../types'
import { SCHED } from '../../data/schedule'
import styles from './HistoryView.module.css'

interface Props {
  sessions: WorkoutSession[]
}

export default function HistoryView({ sessions }: Props) {
  // ── TYPESCRIPT CONCEPT: useState with null ────────────────────────────────
  // null means "no item is open". string means the date string of the open item.
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

  return (
    <>
      <div className="pg-title">History</div>
      {sessions.map((ses) => {
        const dow = new Date(ses.date + 'T12:00:00').getDay()
        const day = SCHED[dow]
        const d = new Date(ses.date + 'T12:00:00')
        const lbl = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        const open = openDate === ses.date

        let detail: React.ReactNode = null

        if (ses.type === 'strength' && ses.exercises && day?.exercises) {
          detail = day.exercises.map((ex) => {
            const logged = ses.exercises![ex.id]
            if (!logged?.sets?.length) return null
            const rows = logged.sets
              .map((set, i) => {
                const parts: string[] = []
                if (set.weight != null && set.weight !== 0) parts.push(`${set.weight} lbs`)
                if (set.reps   != null && set.reps   !== 0) parts.push(`${set.reps} ${ex.time ? 'sec' : 'reps'}`)
                if (!parts.length) return null
                return (
                  <div key={i} className={styles.hSet}>
                    <span className={styles.hSetLbl}>Set {i + 1}</span>
                    <span>{parts.join(' × ')}</span>
                  </div>
                )
              })
              .filter(Boolean)
            if (!rows.length) return null
            return (
              <div key={ex.id} className={styles.hEx}>
                <div className={styles.hExName}>{ex.name}</div>
                {rows}
              </div>
            )
          })
        } else if (ses.type === 'cardio' && ses.cardio) {
          const c = ses.cardio
          detail = (
            <div className={styles.hEx}>
              <div className={styles.hSet}><span className={styles.hSetLbl}>Type</span><span>{c.type === 'run' ? '🏃 Run' : '🔄 Elliptical'}</span></div>
              {c.duration && <div className={styles.hSet}><span className={styles.hSetLbl}>Time</span><span>{c.duration} min</span></div>}
              {c.notes    && <div className={styles.hSet}><span className={styles.hSetLbl}>Notes</span><span>{c.notes}</span></div>}
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
                <div className={styles.hType}>{day?.name ?? 'Workout'}</div>
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
