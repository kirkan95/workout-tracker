import { useState } from 'react'
import { SCHED } from '../../data/schedule'
import { FormData, CardioData, WorkoutSession, UserSettings, WeeklyPlan, ExerciseTarget } from '../../types'
import { todayStr } from '../../utils'
import { useRestTimer } from '../../hooks/useRestTimer'
import StrengthView from './StrengthView/StrengthView'
import CardioView from './CardioView/CardioView'
import RestView from './RestView/RestView'
import RestTimer from '../RestTimer/RestTimer'

type Feel = 'easy' | 'medium' | 'hard'

const GOAL_REST: Record<string, number> = {
  stronger: 240, muscle: 90, loseweight: 45, stayfit: 60,
}

interface Props {
  fd: FormData
  setFd: React.Dispatch<React.SetStateAction<FormData>>
  cd: CardioData
  setCd: React.Dispatch<React.SetStateAction<CardioData>>
  settings: UserSettings
  plan: WeeklyPlan | null
  planGenerating: boolean
  getSession: (date: string) => WorkoutSession | null
  getPrevSession: (workoutId: string, todayDate: string) => WorkoutSession | null
  onComplete: (session: WorkoutSession) => Promise<void>
}

export default function TodayView({ fd, setFd, cd, setCd, settings, plan, planGenerating, getSession, getPrevSession, onComplete }: Props) {
  const dow = new Date().getDay()
  const today = todayStr()
  const existing = getSession(today)
  const completed = !!existing?.completed

  const [feelData, setFeelData] = useState<Record<string, Record<number, Feel>>>({})

  const defaultRest = GOAL_REST[settings.goal] ?? 90
  const timer = useRestTimer(defaultRest, settings.timerAlert === 'silent')

  const handleFeelChange = (exId: string, setIdx: number, feel: Feel) => {
    setFeelData((prev) => ({
      ...prev,
      [exId]: { ...(prev[exId] ?? {}), [setIdx]: feel },
    }))
  }


  const planDay = plan?.schedule[today]

  // Use plan type to override day type, fall back to SCHED
  const schedDay = SCHED[dow]
  const dayType = planDay?.type === 'cardio' ? 'cardio'
                : planDay?.type === 'rest'   ? 'rest'
                : planDay                    ? 'strength'
                : schedDay?.type

  const day = schedDay
  if (!day) return null

  const aiTargets: Record<string, ExerciseTarget> = planDay?.exercises ?? {}

  const isStrength = dayType === 'strength'
  const prev = isStrength ? getPrevSession(day.id, today) : null

  const buildStrengthSession = (): WorkoutSession => {
    const exercises: WorkoutSession['exercises'] = {}
    day.exercises?.forEach((ex) => {
      exercises[ex.id] = {
        sets: Array.from({ length: ex.sets }, (_, s) => ({
          weight: fd[ex.id]?.[s]?.weight ? parseFloat(fd[ex.id][s].weight) : null,
          reps:   fd[ex.id]?.[s]?.reps   ? (ex.time ? parseFloat(fd[ex.id][s].reps) : parseInt(fd[ex.id][s].reps)) : null,
          feel:   feelData[ex.id]?.[s],
        })),
      }
    })
    return { date: today, dayOfWeek: dow, type: 'strength', workoutId: day.id, completed: true, timestamp: Date.now(), exercises }
  }

  if (dayType === 'rest') return <RestView day={day} />

  if (dayType === 'cardio') {
    return (
      <>
        {planGenerating && <div style={{ padding: '8px 0 12px', fontSize: 13, color: 'var(--text3)' }}>Generating your plan…</div>}
        <CardioView
          day={day}
          cd={cd}
          setCd={setCd}
          completed={completed}
          onComplete={async () => {
            await onComplete({ date: today, dayOfWeek: dow, type: 'cardio', workoutId: day.id, completed: true, timestamp: Date.now(), cardio: { ...cd } })
          }}
        />
      </>
    )
  }

  return (
    <>
      {planGenerating && <div style={{ padding: '8px 0 12px', fontSize: 13, color: 'var(--text3)' }}>Generating your plan…</div>}
      <StrengthView
        day={day}
        fd={fd}
        setFd={setFd}
        completed={completed}
        prevSession={prev}
        feelData={feelData}
        aiTargets={aiTargets}
        configured={timer.configured}
        timerRunning={timer.running}
        onComplete={async () => { await onComplete(buildStrengthSession()) }}
        onFeelChange={handleFeelChange}
        onTimerStart={timer.start}
        onAdjust={timer.adjust}
      />
      <RestTimer
        seconds={timer.seconds}
        running={timer.running}
        onStop={timer.stop}
      />
    </>
  )
}
