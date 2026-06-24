import * as admin from 'firebase-admin'
import * as crypto from 'crypto'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { AI_CONFIG, callAI } from './ai'
import { assemblePrompt } from './promptAssembler'

admin.initializeApp()
const db = admin.firestore()

const geminiApiKey = defineSecret('GEMINI_API_KEY')

// ── Types ────────────────────────────────────────────────────────────────────

interface UserSettings {
  goal: 'stronger' | 'muscle' | 'loseweight' | 'stayfit'
  equipment: string[]
  exclusions: string[]
  workoutDuration: number
  startDay: number
  restDays: number[]
  mesocycleStart: string
}

interface ExerciseTarget {
  sets: number
  repRange: string
  weight: number | null
}

interface DayPlan {
  type: string
  exercises?: Record<string, ExerciseTarget>
  cardioDuration?: number
  cardioEffort?: string
  note?: string
}

interface WeeklyPlan {
  weekStartDate: string
  settingsHash: string
  status: 'ok' | 'error'
  durationConflict?: boolean
  schedule: Record<string, DayPlan>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStartDate(startDay: number): string {
  const today = new Date()
  const diff = (today.getDay() - startDay + 7) % 7
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - diff)
  return weekStart.toISOString().split('T')[0]
}

function computeSettingsHash(settings: UserSettings): string {
  const key = JSON.stringify([
    settings.goal,
    [...settings.equipment].sort(),
    [...settings.exclusions].sort(),
  ])
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16)
}

function transformAIResponse(
  raw: {
    schedule: Array<{
      date: string
      type: string
      exercises?: Array<{ id: string; sets: number; repRange: string; weight?: number }>
      cardioDuration?: number
      cardioEffort?: string
      note?: string
    }>
    durationConflict: boolean
  },
  weekStartDate: string,
  settingsHash: string,
): WeeklyPlan {
  const schedule: Record<string, DayPlan> = {}

  for (const day of raw.schedule) {
    const plan: DayPlan = { type: day.type }

    if (day.exercises?.length) {
      plan.exercises = {}
      for (const ex of day.exercises) {
        plan.exercises[ex.id] = {
          sets: ex.sets,
          repRange: ex.repRange,
          weight: ex.weight ?? null,
        }
      }
    }

    if (day.cardioDuration) plan.cardioDuration = day.cardioDuration
    if (day.cardioEffort)   plan.cardioEffort   = day.cardioEffort
    if (day.note)           plan.note           = day.note

    schedule[day.date] = plan
  }

  return {
    weekStartDate,
    settingsHash,
    status: 'ok',
    durationConflict: raw.durationConflict,
    schedule,
  }
}

async function logTokenUsage(uid: string, inputTokens: number, outputTokens: number) {
  const userIdHash = crypto.createHash('sha256').update(uid).digest('hex').slice(0, 12)
  await db.collection('admin').doc('tokenLog').collection('entries').add({
    model: AI_CONFIG.model,
    inputTokens,
    outputTokens,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    userIdHash,
  })
}

// ── Cloud Function ───────────────────────────────────────────────────────────

export const generateWeeklyPlan = onCall(
  { secrets: [geminiApiKey] },
  async (request): Promise<WeeklyPlan> => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in')

    // Load settings
    const settingsSnap = await db.doc(`users/${uid}/config/settings`).get()
    if (!settingsSnap.exists) throw new HttpsError('not-found', 'Settings not configured')
    const settings = settingsSnap.data() as UserSettings

    const weekStartDate = getWeekStartDate(settings.startDay)
    const settingsHash  = computeSettingsHash(settings)

    // Return cached plan if settings unchanged
    const planRef = db.doc(`users/${uid}/plans/${weekStartDate}`)
    const existingSnap = await planRef.get()
    if (existingSnap.exists) {
      const existing = existingSnap.data() as WeeklyPlan
      if (existing.settingsHash === settingsHash && existing.status === 'ok') {
        return existing
      }
    }

    // Load recent sessions
    const sessionsSnap = await db
      .collection(`users/${uid}/sessions`)
      .orderBy('date', 'desc')
      .limit(28)
      .get()
    const sessions = sessionsSnap.docs.map((d) => d.data())

    const lastCompleted = sessions.find((s) => s.completed)
    const lastSessionDate = lastCompleted?.date ?? null

    const prompt = assemblePrompt(settings, sessions as never, weekStartDate, lastSessionDate)

    try {
      const { text, inputTokens, outputTokens } = await callAI(prompt, geminiApiKey.value())
      const raw = JSON.parse(text)
      const plan = transformAIResponse(raw, weekStartDate, settingsHash)

      await planRef.set(plan)
      await logTokenUsage(uid, inputTokens, outputTokens)

      return plan
    } catch (e) {
      console.error('Plan generation error:', e)
      await planRef.set({ weekStartDate, settingsHash, status: 'error', schedule: {} })
      throw new HttpsError('internal', 'Plan generation failed')
    }
  },
)
