import * as fs from 'fs'
import * as path from 'path'
import { compressHistory } from './compressHistory'

// Loaded once at cold start — path resolves from functions/lib/ → functions/trainer/
const TRAINER_CORE     = fs.readFileSync(path.join(__dirname, '../trainer/TRAINER.md'), 'utf8')
const TRAINER_PPL      = fs.readFileSync(path.join(__dirname, '../trainer/TRAINER_PPL.md'), 'utf8')
const TRAINER_FULLBODY = fs.readFileSync(path.join(__dirname, '../trainer/TRAINER_FULLBODY.md'), 'utf8')
const TRAINER_CARDIO   = fs.readFileSync(path.join(__dirname, '../trainer/TRAINER_CARDIO.md'), 'utf8')

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Settings {
  goal: 'stronger' | 'muscle' | 'loseweight' | 'stayfit'
  equipment: string[]
  exclusions: string[]
  workoutDuration: number
  startDay: number
  restDays: number[]
  mesocycleStart: string
}

interface Session {
  date: string
  workoutId: string
  completed: boolean
  exercises?: Record<string, { sets: { weight: number | null; reps: number | null; feel?: 'easy' | 'medium' | 'hard' }[] }>
  cardio?: { duration: number; feel?: 'easy' | 'medium' | 'hard' }
}

export function assemblePrompt(
  settings: Settings,
  sessions: Session[],
  weekStartDate: string,
  lastSessionDate: string | null,
): string {
  const isPPL = settings.goal === 'stronger' || settings.goal === 'muscle'

  const msStart = new Date(settings.mesocycleStart)
  const wkStart = new Date(weekStartDate)
  const weekNum = Math.max(1, Math.floor((wkStart.getTime() - msStart.getTime()) / (7 * 86400000)) + 1)

  const sections: string[] = [TRAINER_CORE]
  sections.push(isPPL ? TRAINER_PPL : TRAINER_FULLBODY)
  sections.push(TRAINER_CARDIO)

  const history = compressHistory(sessions)
  if (history) {
    sections.push(`## Session History (last 28 days)\n\n${history}`)
  }

  if (lastSessionDate) {
    sections.push(`## Last Completed Session\n\n${lastSessionDate}`)
  }

  const restDayNames = settings.restDays.map((d) => DAYS[d]).join(', ')
  const equipmentList = settings.equipment.length
    ? settings.equipment.join(', ')
    : 'bodyweight only'

  sections.push(`## User Settings

Goal: ${settings.goal}
Equipment: ${equipmentList}
Exclusions: ${settings.exclusions.join(', ') || 'none'}
Workout duration: ${settings.workoutDuration} minutes
Week starts: ${DAYS[settings.startDay]}
Rest days: ${restDayNames}
Mesocycle week: ${weekNum}`)

  sections.push(`## Task

Generate the weekly training plan for the 7 days starting ${weekStartDate}.

For each day, output:
- date (ISO string, e.g. "${weekStartDate}")
- type: one of push / pull / legs / fullbody / cardio / rest
- exercises (array, strength days only): exercise id, sets, repRange (e.g. "8-12"), weight in lbs (null if bodyweight)
- cardioDuration (integer minutes, cardio days only)
- cardioEffort (easy / medium / hard, cardio days only)
- note (workout days only, omit for rest days): 1-2 sentences explaining what muscle groups or movements are being targeted that day and why, given the user's training history and progression stage

Apply all trainer rules above, including return-from-break adjustments if the last session date indicates a gap.`)

  return sections.join('\n\n---\n\n')
}
