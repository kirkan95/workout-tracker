import { WorkoutSession, UserSettings } from '../../types'
import { findPRs, computeStreak, sessionVolume, sessionSetsLogged } from '../../engine'
import { EXERCISES } from '../../data/exercises'
import styles from './SummarySheet.module.css'

interface Props {
  session: WorkoutSession
  priorSessions: WorkoutSession[]
  prevSameSession: WorkoutSession | null
  settings: UserSettings
  dayName: string
  elapsedMinutes: number
  nextUpText: string
  deload: boolean
  onClose: () => void
}

function countBeats(session: WorkoutSession, prev: WorkoutSession | null): number {
  if (!prev || !session.exercises) return 0
  let n = 0
  Object.entries(session.exercises).forEach(([exId, log]) => {
    const prevLog = prev.exercises?.[exId]
    log.sets.forEach((s, i) => {
      const p = prevLog?.sets?.[i]
      if (!p) return
      if (s.weight != null && p.weight != null && s.weight > p.weight) { n++; return }
      if (s.weight === p.weight && s.reps != null && p.reps != null && s.reps > p.reps) n++
    })
  })
  return n
}

// The dopamine payoff shown right after a workout is saved. Every number
// here is derived from data the app already has (see UPGRADE.md §2.2 / §3.2)
// — no extra writes, just pure functions over the session + history.
export default function SummarySheet({ session, priorSessions, prevSameSession, settings, dayName, elapsedMinutes, nextUpText, deload, onClose }: Props) {
  const volume = sessionVolume(session)
  const setsLogged = sessionSetsLogged(session)
  const beats = countBeats(session, prevSameSession)
  const streak = computeStreak([session, ...priorSessions], settings)
  const prs = findPRs(session, priorSessions)

  const dateLabel = new Date(session.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="sheetScrim" onClick={onClose}>
      <div className="sheetWrap" onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheet}>
          <div className="sheetGrabber" />
          <div className={styles.title}>{dayName} done 💪</div>
          <div className={styles.sub}>{dateLabel}{elapsedMinutes > 0 ? ` · ${elapsedMinutes} min` : ''}</div>

          {session.type === 'strength' && (
            <div className={styles.tiles}>
              <div className={styles.tile}><span className={`num ${styles.tileNum}`}>{volume.toLocaleString()}</span><label>lbs total volume</label></div>
              <div className={styles.tile}><span className={`num ${styles.tileNum}`}>{setsLogged}</span><label>sets logged</label></div>
              <div className={styles.tile}><span className={`num ${styles.tileNum}`} style={{ color: 'var(--success)' }}>{beats}</span><label>sets beat last time</label></div>
              <div className={styles.tile}><span className={`num ${styles.tileNum}`}>🔥 {streak}</span><label>week streak</label></div>
            </div>
          )}

          {prs.map((pr) => {
            const libEx = EXERCISES.find((e) => e.id === pr.exerciseId)
            return (
              <div key={pr.exerciseId} className={styles.pr}>
                <span className={styles.medal}>🏅</span>
                <div>
                  <b>New PR — {libEx?.name ?? pr.exerciseId}</b><br />
                  <span>est. 1-rep max {pr.e1rm} lbs{pr.prevBest > 0 ? ` (was ${pr.prevBest})` : ''}</span>
                </div>
              </div>
            )
          })}

          {deload && <div className={styles.deloadNote}>Deload week banked — recovery is part of the plan.</div>}

          {nextUpText && <div className={styles.nextUp}><b>Next up:</b> {nextUpText}</div>}

          <button className={styles.cta} onClick={onClose}>Nice. Done for today</button>
        </div>
      </div>
    </div>
  )
}
