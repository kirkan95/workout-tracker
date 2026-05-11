import { useState, useCallback } from 'react'
import { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { WeeklyPlan } from '../types'

export function usePlan(user: User | null) {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [planLoaded, setPlanLoaded] = useState(false)

  const loadPlan = useCallback(async (weekStartDate: string): Promise<WeeklyPlan | null> => {
    if (!user) return null
    const snap = await getDoc(doc(db, 'users', user.uid, 'plans', weekStartDate))
    const data = snap.exists() ? (snap.data() as WeeklyPlan) : null
    setPlan(data)
    setPlanLoaded(true)
    return data
  }, [user])

  return { plan, planLoaded, loadPlan }
}
