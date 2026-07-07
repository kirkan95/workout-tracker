import { useState, useCallback, useRef } from 'react'
import { User } from 'firebase/auth'
import { collection, doc, getDocs, setDoc, orderBy, query, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { WorkoutSession } from '../types'

// A year of consistent use is ~300 session docs — reading all of them on
// every app open is an unbounded cost that only grows. Load the most recent
// page up front and fetch further pages on demand (Progress tab's "Load
// more"), instead of paying for the whole history every single launch.
// See UPGRADE.md §1.6.
const PAGE_SIZE = 90

export function useSession(user: User | null) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [sessionsLoaded, setSessionsLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null)

  const loadAllSessions = useCallback(async () => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('date', 'desc'), limit(PAGE_SIZE))
    const snap = await getDocs(q)
    const data: WorkoutSession[] = []
    snap.forEach((d) => data.push(d.data() as WorkoutSession))
    setSessions(data)
    lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null
    setHasMore(snap.docs.length === PAGE_SIZE)
    setSessionsLoaded(true)
  }, [user])

  const loadMoreSessions = useCallback(async () => {
    if (!user || !lastDocRef.current) return
    const q = query(
      collection(db, 'users', user.uid, 'sessions'),
      orderBy('date', 'desc'),
      startAfter(lastDocRef.current),
      limit(PAGE_SIZE),
    )
    const snap = await getDocs(q)
    const data: WorkoutSession[] = []
    snap.forEach((d) => data.push(d.data() as WorkoutSession))
    setSessions((prev) => [...prev, ...data])
    lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null
    setHasMore(snap.docs.length === PAGE_SIZE)
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

  return { sessions, sessionsLoaded, hasMore, loadAllSessions, loadMoreSessions, saveSession, getSession, getPrevSession }
}
