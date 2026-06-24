import { useState, useEffect, useCallback } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useAuth } from './hooks/useAuth'
import { useSession } from './hooks/useSession'
import { useSettings } from './hooks/useSettings'
import { usePlan } from './hooks/usePlan'
import PasswordGate from './components/PasswordGate/PasswordGate'
import AuthScreen from './components/AuthScreen/AuthScreen'
import Loading from './components/Loading/Loading'
import Onboarding from './components/Onboarding/Onboarding'
import WeekBar from './components/WeekBar/WeekBar'
import BottomNav, { Tab } from './components/BottomNav/BottomNav'
import TodayView from './components/TodayView/TodayView'
import HistoryView from './components/HistoryView/HistoryView'
import SettingsView from './components/SettingsView/SettingsView'
import { getSchedule } from './data/schedule'
import { todayStr, getWeekStartDate } from './utils'
import { FormData, CardioData, UserSettings } from './types'
import { app } from './lib/firebase'

const PW_KEY = 'wt_unlocked'

export default function App() {
  // ── TYPESCRIPT CONCEPT: Initializer function in useState ──────────────────
  // The () => ... form runs only once on mount. Without it, localStorage.getItem
  // would run on every render (harmless here, but a good habit for expensive reads).
  const [unlocked, setUnlocked] = useState(() => !!localStorage.getItem(PW_KEY))
  const [activeTab, setActiveTab] = useState<Tab>('today')
const [fd, setFd] = useState<FormData>({})
  const [cd, setCd] = useState<CardioData>({ type: 'run', duration: 0, notes: '' })

  const [planGenerating, setPlanGenerating] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const { user, loading: authLoading, signIn, signOutUser } = useAuth()
  const { sessions, sessionsLoaded, loadAllSessions, saveSession, getSession, getPrevSession } = useSession(user)
  const { settings, settingsLoaded, loadSettings, saveSettings } = useSettings(user)
  const { plan, loadPlan } = usePlan(user)

  useEffect(() => {
    if (user) {
      loadAllSessions()
      loadSettings()
    }
  }, [user, loadAllSessions, loadSettings])

  useEffect(() => {
    if (!user || !settingsLoaded || !settings) return
    const weekStart = getWeekStartDate(settings.startDay)
    loadPlan(weekStart).then(async (loadedPlan) => {
      if (loadedPlan?.status === 'ok') return
      setPlanGenerating(true)
      try {
        const fns = getFunctions(app)
        await httpsCallable(fns, 'generateWeeklyPlan')()
        await loadPlan(weekStart)
      } catch (e) {
        console.error('Plan generation failed', e)
      } finally {
        setPlanGenerating(false)
      }
    })
  }, [user, settingsLoaded])  // eslint-disable-line react-hooks/exhaustive-deps

const handleSaveSettings = useCallback(async (newSettings: UserSettings) => {
    if (!user) return
    setSettingsSaving(true)
    try {
      await saveSettings(newSettings)
      setPlanGenerating(true)
      try {
        const fns = getFunctions(app)
        await httpsCallable(fns, 'generateWeeklyPlan')()
        await loadPlan(getWeekStartDate(newSettings.startDay))
      } catch (e) {
        console.error('Plan generation failed', e)
      } finally {
        setPlanGenerating(false)
      }
    } finally {
      setSettingsSaving(false)
    }
  }, [user, saveSettings, loadPlan])

  // Initialize form inputs from today's cached session once sessions are loaded
  useEffect(() => {
    if (!sessionsLoaded) return
    const now = new Date()
    const dow = now.getDay()
    const day = getSchedule(now)[dow]
    const existing = getSession(todayStr())

    if (day?.type === 'strength' && day.exercises) {
      const newFd: FormData = {}
      day.exercises.forEach((ex) => {
        newFd[ex.id] = {}
        for (let s = 0; s < ex.sets; s++) {
          const es = existing?.exercises?.[ex.id]?.sets?.[s]
          newFd[ex.id][s] = {
            weight: es?.weight != null ? String(es.weight) : '',
            reps:   es?.reps   != null ? String(es.reps)   : '',
          }
        }
      })
      setFd(newFd)
    }

    if (day?.type === 'cardio' && existing?.cardio) {
      setCd((prev) => ({ ...prev, ...existing.cardio }))
    }
  }, [sessionsLoaded, getSession])

  const handleUnlock = () => {
    localStorage.setItem(PW_KEY, '1')
    setUnlocked(true)
  }

  const handleSignOut = async () => {
    await signOutUser()
    setFd({})
    setCd({ type: 'run', duration: 0, notes: '' })
  }

  if (!unlocked) return <PasswordGate onUnlock={handleUnlock} />
  if (authLoading || (user && (!sessionsLoaded || !settingsLoaded))) return <Loading />
  if (!user) return <AuthScreen onSignIn={signIn} />
  if (!settings) return <Onboarding onComplete={saveSettings} />

  return (
    <div className="app">
      <WeekBar user={user} sessions={sessions} onSignOut={handleSignOut} />
      <main className="main">
        {activeTab === 'today' ? (
          <TodayView
            fd={fd}
            setFd={setFd}
            cd={cd}
            setCd={setCd}
            settings={settings}
            plan={plan}

            planGenerating={planGenerating}
            getSession={getSession}
            getPrevSession={getPrevSession}
            onComplete={async (session) => {
              await saveSession(session)
            }}
          />
        ) : activeTab === 'history' ? (
          <HistoryView sessions={sessions} />
        ) : (
          <SettingsView
            settings={settings}
            saving={settingsSaving}
            onSave={handleSaveSettings}
          />
        )}
      </main>
<BottomNav activeTab={activeTab} onSwitch={setActiveTab} />
    </div>
  )
}
