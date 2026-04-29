import { User } from 'firebase/auth'
import { WorkoutSession } from '../../types'
import { SCHED, DAY_SHORT } from '../../data/schedule'
import styles from './WeekBar.module.css'

interface Props {
  user: User
  sessions: WorkoutSession[]
  onSignOut: () => void
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function WeekBar({ user, sessions, onSignOut }: Props) {
  const name = user.displayName?.split(' ')[0] ?? 'there'
  const photo = user.photoURL

  const now = new Date()
  const today = now.getDay()

  // Calculate Monday of the current week
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((today + 6) % 7))

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    const dow = d.getDay()
    const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const session = sessions.find((s) => s.date === ds)

    const isToday = d.toDateString() === now.toDateString()
    const isCompleted = !!session?.completed
    const isRest = SCHED[dow]?.type === 'rest'

    let dotClass = isRest ? '' : styles.workout
    let inner: string = DAY_SHORT[dow].charAt(0)

    if (isCompleted && isToday)  { dotClass = styles.todayDone; inner = '✓' }
    else if (isCompleted)        { dotClass = styles.done;      inner = '✓' }
    else if (isToday)            { dotClass = styles.today }

    return { dow, label: DAY_SHORT[dow], dotClass, inner }
  })

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
        {days.map((d, i) => (
          <div key={i} className={styles.wday}>
            <span className={styles.wdayLbl}>{d.label}</span>
            <div className={`${styles.wdayDot} ${d.dotClass}`}>{d.inner}</div>
          </div>
        ))}
      </div>
    </header>
  )
}
