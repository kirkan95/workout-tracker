import { useState, useEffect, useMemo } from 'react'
import { CardioData, FormData, UserSettings, WeeklyPlan, WorkoutSession } from '../../types'
import { toDaySchedule } from '../../engine'
import { dateStr } from '../../utils'
import { useRestTimer } from '../../hooks/useRestTimer'
import StrengthView from './StrengthView/StrengthView'
import CardioView from './CardioView/CardioView'
import RestView from './RestView/RestView'
import RestTimer from '../RestTimer/RestTimer'
import SummarySheet from '../SummarySheet/SummarySheet'

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
  sessions: WorkoutSession[]
  getSession: (date: string) => WorkoutSession | null
  getPrevSession: (workoutId: string, todayDate: string) => WorkoutSession | null
  onComplete: (session: WorkoutSession) => Promise<void>
}

export default function TodayView({ fd, setFd, cd, setCd, settings, plan, sessions, getSession, getPrevSession, onComplete }: Props) {
  // Midnight rollover: an app left open past midnight (or backgrounded
  // overnight) should log to the new day, not whatever day it happened to be
  // opened on. See UPGRADE.md §1.9.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const refresh = () => setNow(new Date())
    document.addEventListener('visibilitychange', refresh)
    const interval = setInterval(refresh, 60000)
    return () => { document.removeEventListener('visibilitychange', refresh); clearInterval(interval) }
  }, [])

  const today = dateStr(now)
  const dow = now.getDay()
  const existing = getSession(today)
  const completed = !!existing?.completed

  const [sessionStart] = useState(() => Date.now())
  const [elapsedMinutes, setElapsedMinutes] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setElapsedMinutes(Math.floor((Date.now() - sessionStart) / 60000)), 15000)
    return () => clearInterval(id)
  }, [sessionStart])

  const [summarySession, setSummarySession] = useState<WorkoutSession | null>(null)

  const defaultRest = GOAL_REST[settings.goal] ?? 90
  const timer = useRestTimer(defaultRest, settings.timerAlert === 'silent')

  const planDay = plan?.schedule[today]
  const day = planDay ? toDaySchedule(planDay) : null

  const aiTargets = planDay?.exercises ?? {}
  const isStrength = day?.type === 'strength'
  const prev = isStrength && day ? getPrevSession(day.id, today) : null

  // "What's next" for the post-workout summary — looks ahead a few days,
  // skipping rest days, so it reads naturally ("Cardio tomorrow").
  const nextUpText = useMemo(() => {
    if (!plan) return ''
    const start = new Date(today + 'T00:00:00')
    for (let i = 1; i <= 3; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const ds = dateStr(d)
      const dp = plan.schedule[ds]
      if (!dp || dp.type === 'rest') continue
      const label = i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'long' })
      if (dp.type === 'cardio') return `${label} — ${dp.cardioDuration ?? 20} min ${dp.cardioType ?? 'cardio'}.`
      return `${label} — ${toDaySchedule(dp).name}.`
    }
    return ''
  }, [plan, today])

  if (!day) return null

  const buildStrengthSession = (): WorkoutSession => {
    const exercises: WorkoutSession['exercises'] = {}
    day.exercises?.forEach((ex) => {
      exercises[ex.id] = {
        sets: Array.from({ length: ex.sets }, (_, s) => {
          const set = fd[ex.id]?.[s]
          return {
            weight: set?.weight ? parseFloat(set.weight) : null,
            reps:   set?.reps   ? (ex.time ? parseFloat(set.reps) : parseInt(set.reps)) : null,
            ...(set?.feel ? { feel: set.feel } : {}),
          }
        }),
      }
    })
    return { date: today, dayOfWeek: dow, type: 'strength', workoutId: day.id, completed: true, timestamp: Date.now(), exercises }
  }

  if (day.type === 'rest') return <RestView day={day} />

  if (day.type === 'cardio') {
    return (
      <>
        {planDay?.note && <div style={{ padding: '0 0 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{planDay.note}</div>}
        <CardioView
          day={day}
          cd={cd}
          setCd={setCd}
          completed={completed}
          suggestedDuration={planDay?.cardioDuration}
          onComplete={async () => {
            const session: WorkoutSession = { date: today, dayOfWeek: dow, type: 'cardio', workoutId: day.id, completed: true, timestamp: Date.now(), cardio: { ...cd } }
            await onComplete(session)
            setSummarySession(session)
          }}
        />
        {summarySession && (
          <SummarySheet
            session={summarySession}
            priorSessions={sessions}
            prevSameSession={null}
            settings={settings}
            dayName={day.name}
            elapsedMinutes={elapsedMinutes}
            nextUpText={nextUpText}
            deload={!!planDay?.deload}
            onClose={() => setSummarySession(null)}
          />
        )}
      </>
    )
  }

  return (
    <>
      {planDay?.note && <div style={{ padding: '0 0 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{planDay.note}</div>}
      <StrengthView
        day={day}
        fd={fd}
        setFd={setFd}
        completed={completed}
        deload={!!planDay?.deload}
        prevSession={prev}
        aiTargets={aiTargets}
        settings={settings}
        sessions={sessions}
        configured={timer.configured}
        elapsedMinutes={elapsedMinutes}
        onComplete={async () => {
          const session = buildStrengthSession()
          await onComplete(session)
          setSummarySession(session)
        }}
        onTimerStart={timer.start}
        onAdjust={timer.adjust}
      />
      <RestTimer
        seconds={timer.seconds}
        configured={timer.configured}
        running={timer.running}
        onSkip={timer.stop}
        onAdjust={timer.adjust}
      />
      {summarySession && (
        <SummarySheet
          session={summarySession}
          priorSessions={sessions}
          prevSameSession={prev}
          settings={settings}
          dayName={day.name}
          elapsedMinutes={elapsedMinutes}
          nextUpText={nextUpText}
          deload={!!planDay?.deload}
          onClose={() => setSummarySession(null)}
        />
      )}
    </>
  )
}
