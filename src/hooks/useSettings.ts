import { useState, useCallback } from 'react'
import { User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { UserSettings } from '../types'

export function useSettings(user: User | null) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const loadSettings = useCallback(async () => {
    if (!user) return
    const snap = await getDoc(doc(db, 'users', user.uid, 'config', 'settings'))
    setSettings(snap.exists() ? (snap.data() as UserSettings) : null)
    setSettingsLoaded(true)
  }, [user])

  const saveSettings = useCallback(async (s: UserSettings) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid, 'config', 'settings'), s)
    setSettings(s)
  }, [user])

  return { settings, settingsLoaded, loadSettings, saveSettings }
}
