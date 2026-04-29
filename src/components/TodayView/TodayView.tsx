import { SCHED } from '../../data/schedule'
import { FormData, CardioData, WorkoutSession } from '../../types'
import { todayStr } from '../../utils'
import StrengthView from './StrengthView/StrengthView'
import CardioView from './CardioView/CardioView'
import RestView from './RestView/RestView'

// ── TYPESCRIPT CONCEPT: Callback prop types ───────────────────────────────────
// "(session: WorkoutSession) => Promise<void>" describes a function that
// receives a WorkoutSession and returns a Promise (i.e. it's async).
// This is how you type async callbacks passed down as props.
interface Props {
  fd: FormData
  setFd: React.Dispatch<React.SetStateAction<FormData>>
  cd: CardioData
  setCd: React.Dispatch<React.SetStateAction<CardioData>>
  getSession: (date: string) => WorkoutSession | null
  getPrevSession: (workoutId: string, todayDate: string) => WorkoutSession | null
  onComplete: (session: WorkoutSession) => Promise<void>
}

export default function TodayView({ fd, setFd, cd, setCd, getSession, getPrevSession, onComplete }: Props) {
  const dow = new Date().getDay()
  const day = SCHED[dow]
  const today = todayStr()
  const existing = getSession(today)
  const completed = !!existing?.completed

  if (!day) return null

  if (day.type === 'rest') return <RestView day={day} />

  if (day.type === 'cardio') {
    return (
      <CardioView
        day={day}
        cd={cd}
        setCd={setCd}
        completed={completed}
        onComplete={async () => {
          const session: WorkoutSession = {
            date: today,
            dayOfWeek: dow,
            type: 'cardio',
            workoutId: day.id,
            completed: true,
            timestamp: Date.now(),
            cardio: { ...cd },
          }
          await onComplete(session)
        }}
      />
    )
  }

  // strength
  const prev = getPrevSession(day.id, today)
  return (
    <StrengthView
      day={day}
      fd={fd}
      setFd={setFd}
      completed={completed}
      prevSession={prev}
      onComplete={async () => {
        const exercises: WorkoutSession['exercises'] = {}
        day.exercises!.forEach((ex) => {
          exercises[ex.id] = {
            sets: Array.from({ length: ex.sets }, (_, s) => {
              const f = fd[ex.id]?.[s] ?? {}
              return {
                weight: f.weight ? parseFloat(f.weight) : null,
                reps:   f.reps   ? (ex.time ? parseFloat(f.reps) : parseInt(f.reps)) : null,
              }
            }),
          }
        })
        const session: WorkoutSession = {
          date: today,
          dayOfWeek: dow,
          type: 'strength',
          workoutId: day.id,
          completed: true,
          timestamp: Date.now(),
          exercises,
        }
        await onComplete(session)
      }}
    />
  )
}
