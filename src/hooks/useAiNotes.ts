import { useState, useCallback } from 'react'
import { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { WeeklyPlan } from '../types'

// The engine (src/engine) generates the actual plan — exercises, sets,
// weights — entirely on-device. This hook only fetches optional AI "coach
// note" flavor text to overlay on top of it. It's read from a cache doc the
// Cloud Function writes; if nothing's cached yet the caller decides whether
// to trigger a background generation (see App.tsx) — this hook never blocks
// the UI on it.
export function useAiNotes(user: User | null) {
  const [notes, setNotes] = useState<Record<string, string> | null>(null)

  const loadNotes = useCallback(async (weekStartDate: string): Promise<Record<string, string> | null> => {
    if (!user) return null
    const snap = await getDoc(doc(db, 'users', user.uid, 'plans', weekStartDate))
    if (!snap.exists()) { setNotes(null); return null }
    const data = snap.data() as WeeklyPlan
    if (data.status !== 'ok') { setNotes(null); return null }
    const map: Record<string, string> = {}
    Object.entries(data.schedule).forEach(([date, day]) => {
      if (day.note) map[date] = day.note
    })
    setNotes(map)
    return map
  }, [user])

  return { notes, loadNotes }
}
