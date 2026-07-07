import { useState } from 'react'
import { User } from 'firebase/auth'
import { UserSettings, WeeklyPlan, WorkoutSession } from '../../types'
import { toDaySchedule } from '../../engine'
import { DAY_SHORT } from '../../data/schedule'
import { getWeekStartDate, dateStr, todayStr } from '../../utils'
import styles from './WeekBar.module.css'

interface Props {
  user: User
  sessions: WorkoutSession[]
  settings: UserSettings
  plan: WeeklyPlan | null
  onSignOut: () => void
}

const TYPE_LETTER: Record<string, string> = { push: 'P', pull: 'P', legs: 'L', fullbody: 'F', cardio: 'C', rest: '–' }

export default function WeekBar({ user, sessions, settings, plan, onSignOut }: Props) {
  const [previewDate, setPreviewDate] = useState<string | null>(null)
  const name = user.displayName?.split(' ')[0] ?? 'there'
  const photo = user.photoURL
  const today = todayStr()

  const weekStart = getWeekStartDate(settings.startDay)
  const start = new Date(weekStart + 'T00:00:00')
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const ds = dateStr(d)
    const dayPlan = plan?.schedule[ds]
    const type = dayPlan?.type ?? 'rest'
    const session = sessions.find((s) => s.date === ds)
    const isToday = ds === today
    const isCompleted = !!session?.completed
    const isMissed = ds < today && !isCompleted && type !== 'rest'
    return { date: ds, dow: d.getDay(), type, isToday, isCompleted, isMissed }
  })

  const previewDay = previewDate ? plan?.schedule[previewDate] : null
  const previewSchedule = previewDay ? toDaySchedule(previewDay) : null

  return (
    <header className={styles.weekBar}>
      <div className={styles.userRow}>
        <span className={styles.userName}>
          {photo
            ? <img className={styles.avatar} src={photo} referrerPolicy="no-referrer" alt="" />
            : <div className={styles.initials}>{name.charAt(0).toUpperCase()}</div>
          }
          Hi, {name}
        </span>
        <button className={styles.signOut} onClick={onSignOut}>Sign out</button>
      </div>
      <div className={styles.days}>
        {days.map((d) => (
          <button key={d.date} className={styles.wday} onClick={() => setPreviewDate(d.date)}>
            <span className={styles.wdayLbl}>{DAY_SHORT[d.dow]}</span>
            <div
              className={[
                styles.wdayDot,
                styles[d.type] ?? '',
                d.isCompleted ? styles.done : '',
                d.isToday ? styles.today : '',
                d.isMissed ? styles.missed : '',
              ].join(' ')}
            >
              {d.isCompleted ? '✓' : TYPE_LETTER[d.type] ?? '–'}
            </div>
          </button>
        ))}
      </div>

      {previewDate && previewSchedule && previewDay && (
        <div className="sheetScrim" onClick={() => setPreviewDate(null)}>
          <div className="sheetWrap" onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewSheet}>
              <div className="sheetGrabber" />
              <div className={styles.previewTitle}>{previewSchedule.name}</div>
              <div className={styles.previewSub}>{previewSchedule.sub}</div>
              {previewDay.note && <div className={styles.previewNote}>{previewDay.note}</div>}

              {previewSchedule.exercises?.map((ex) => (
                <div key={ex.id} className={styles.previewEx}>
                  <span>{ex.name}</span>
                  <span className={styles.previewTarget}>{ex.sets} × {ex.target}</span>
                </div>
              ))}

              {previewDay.type === 'cardio' && (
                <div className={styles.previewEx}>
                  <span>{previewDay.cardioType ?? 'Cardio'}</span>
                  <span className={styles.previewTarget}>{previewDay.cardioDuration ?? 20} min</span>
                </div>
              )}

              {previewDay.type === 'rest' && (
                <div className={styles.previewNote}>Optional: light walk or stretch.</div>
              )}

              <button className={styles.previewClose} onClick={() => setPreviewDate(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
