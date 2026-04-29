import { useState, useCallback } from 'react'
import { User } from 'firebase/auth'
import { collection, doc, getDocs, setDoc, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { WorkoutSession } from '../types'

// ── TYPESCRIPT CONCEPT: Function parameter types ──────────────────────────────
// "user: User | null" means this hook accepts either a logged-in Firebase
// user or null. The hook reacts to whichever state is current.
export function useSession(user: User | null) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [sessionsLoaded, setSessionsLoaded] = useState(false)

  // useCallback memoizes the function so it doesn't get recreated every render.
  // The dependency array [] means it only recreates when "user" changes.
  const loadAllSessions = useCallback(async () => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'sessions'),
      orderBy('date', 'desc'),
    )
    const snap = await getDocs(q)
    const data: WorkoutSession[] = []
    snap.forEach((d) => data.push(d.data() as WorkoutSession))
    setSessions(data)
    setSessionsLoaded(true)
  }, [user])

  const saveSession = useCallback(async (session: WorkoutSession) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid, 'sessions', session.date), session)
    // Update local cache so the UI reflects the save immediately
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.date === session.date)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = session
        return next
      }
      return [session, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    })
  }, [user])

  const getSession = useCallback(
    (date: string): WorkoutSession | null =>
      sessions.find((s) => s.date === date) ?? null,
    [sessions],
  )

  const getPrevSession = useCallback(
    (workoutId: string, todayDate: string): WorkoutSession | null =>
      sessions.find((s) => s.workoutId === workoutId && s.date !== todayDate && s.completed) ?? null,
    [sessions],
  )

  return { sessions, sessionsLoaded, loadAllSessions, saveSession, getSession, getPrevSession }
}
