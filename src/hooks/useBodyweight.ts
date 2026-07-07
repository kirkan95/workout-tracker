import { useState, useCallback } from 'react'
import { User } from 'firebase/auth'
import { collection, doc, getDocs, orderBy, query, setDoc, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { BodyweightEntry } from '../types'
import { todayStr } from '../utils'

export function useBodyweight(user: User | null) {
  const [entries, setEntries] = useState<BodyweightEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  const loadEntries = useCallback(async () => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'bodyweight'), orderBy('date', 'desc'), limit(52))
    const snap = await getDocs(q)
    const data: BodyweightEntry[] = []
    snap.forEach((d) => data.push(d.data() as BodyweightEntry))
    setEntries(data)
    setLoaded(true)
  }, [user])

  const logWeight = useCallback(async (weight: number) => {
    if (!user) return
    const date = todayStr()
    await setDoc(doc(db, 'users', user.uid, 'bodyweight', date), { date, weight })
    setEntries((prev) => {
      const entry = { date, weight }
      const idx = prev.findIndex((e) => e.date === date)
      if (idx >= 0) { const next = [...prev]; next[idx] = entry; return next }
      return [entry, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    })
  }, [user])

  return { entries, loaded, loadEntries, logWeight }
}
