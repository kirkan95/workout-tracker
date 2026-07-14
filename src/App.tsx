import { useState, useEffect, useCallback, useMemo } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useAuth } from './hooks/useAuth'
import { useSession } from './hooks/useSession'
import { useSettings } from './hooks/useSettings'
import { useAiNotes } from './hooks/useAiNotes'
import { useBodyweight } from './hooks/useBodyweight'
import PasswordGate from './components/PasswordGate/PasswordGate'
import AuthScreen from './components/AuthScreen/AuthScreen'
import Loading from './components/Loading/Loading'
import Onboarding from './components/Onboarding/Onboarding'
import WeekBar from './components/WeekBar/WeekBar'
import BottomNav, { Tab } from './components/BottomNav/BottomNav'
import TodayView from './components/TodayView/TodayView'
import ProgressView from './components/ProgressView/ProgressView'
import SettingsView from './components/SettingsView/SettingsView'
import Toast from './components/Toast/Toast'
import { planWeek, toDaySchedule } from './engine'
import { todayStr, getWeekStartDate } from './utils'
import { FormData, CardioData, UserSettings } from './types'
import { app } from './lib/firebase'
import { showToast } from './lib/toast'

const PW_KEY = 'wt_unlocked'

export default function App() {
  // ── TYPESCRIPT CONCEPT: Initializer function in useState ──────────────────
  // The () => ... form runs only once on mount. Without it, localStorage.getItem
  // would run on every render (harmless here, but a good habit for expensive reads).
  const [unlocked, setUnlocked] = useState(() => !!localStorage.getItem(PW_KEY))
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [fd, setFd] = useState<FormData>({})
  const [cd, setCd] = useState<CardioData>({ type: 'run', duration: 0, notes: '' })

  const [settingsSaving, setSettingsSaving] = useState(false)

  const { user, loading: authLoading, signIn, signOutUser } = useAuth()
  const { sessions, sessionsLoaded, hasMore, loadAllSessions, loadMoreSessions, saveSession, getSession, getPrevSession } = useSession(user)
  const { settings, settingsLoaded, loadSettings, saveSettings } = useSettings(user)
  const { notes: aiNotes, loadNotes } = useAiNotes(user)
  const { entries: bodyweight, loadEntries: loadBodyweight, logWeight } = useBodyweight(user)

  useEffect(() => {
    if (user) {
      loadAllSessions()
      loadSettings()
      loadBodyweight()
    }
  }, [user, loadAllSessions, loadSettings, loadBodyweight])

  const weekStartDate = useMemo(
    () => (settings ? getWeekStartDate(settings.startDay) : null),
    [settings],
  )

  // The engine computes the whole week instantly, offline, for free — no
  // network call and no cache that can go stale. See UPGRADE.md §0 and
  // src/engine/planner.ts. This replaces the old "await the Cloud Function,
  // show a loading state" flow entirely.
  const plan = useMemo(() => {
    if (!settings || !weekStartDate) return null
    return planWeek({ settings, sessions, weekStartDate })
  }, [settings, sessions, weekStartDate])

  // Optional AI "coach note" overlay — fetched in the background and merged
  // over the engine's own note when it arrives. Never blocks rendering: if
  // it fails (offline, no Gemini key, cold start) the engine's plan already
  // stands on its own.
  useEffect(() => {
    if (!user || !weekStartDate) return
    loadNotes(weekStartDate).then((cached) => {
      if (cached) return
      const fns = getFunctions(app)
      httpsCallable(fns, 'generateWeeklyPlan')({ weekStartDate })
        .then(() => loadNotes(weekStartDate))
        .catch((e) => console.error('AI coach notes unavailable (non-blocking):', e))
    })
  }, [user, weekStartDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const mergedPlan = useMemo(() => {
    if (!plan) return null
    if (!aiNotes) return plan
    const schedule = { ...plan.schedule }
    Object.keys(schedule).forEach((date) => {
      if (aiNotes[date]) schedule[date] = { ...schedule[date], note: aiNotes[date] }
    })
    return { ...plan, schedule }
  }, [plan, aiNotes])

  const handleSaveSettings = useCallback(async (newSettings: UserSettings) => {
    if (!user) return
    setSettingsSaving(true)
    try {
      await saveSettings(newSettings)
    } catch (e) {
      console.error('Failed to save settings:', e)
      showToast('Could not save settings — check your connection and try again.')
    } finally {
      setSettingsSaving(false)
    }
  }, [user, saveSettings])

  const handleOnboardingComplete = useCallback(async (newSettings: UserSettings) => {
    try {
      await saveSettings(newSettings)
    } catch (e) {
      console.error('Failed to save onboarding settings:', e)
      showToast('Could not save — check your connection and try again.')
    }
  }, [saveSettings])

  // Initialize form inputs from today's cached session + today's plan once both are loaded.
  // Reads exercise ids from the engine plan (not a hardcoded schedule) so the
  // seeded form always matches whatever the day actually renders — see
  // UPGRADE.md §1.5.
  useEffect(() => {
    if (!sessionsLoaded || !mergedPlan) return
    const today = todayStr()
    const planDay = mergedPlan.schedule[today]
    const day = planDay ? toDaySchedule(planDay) : null
    const existing = getSession(today)

    if (day?.type === 'strength' && day.exercises) {
      const newFd: FormData = {}
      day.exercises.forEach((ex) => {
        newFd[ex.id] = {}
        for (let s = 0; s < ex.sets; s++) {
          const es = existing?.exercises?.[ex.id]?.sets?.[s]
          newFd[ex.id][s] = {
            weight: es?.weight != null ? String(es.weight) : '',
            reps:   es?.reps   != null ? String(es.reps)   : '',
            feel:   es?.feel,
            // A set that was already saved counts as logged, so re-opening a
            // completed session shows its checkmarks instead of a blank slate.
            logged: es != null && (es.weight != null || es.reps != null),
          }
        }
      })
      setFd(newFd)
    }

    if (day?.type === 'cardio' && existing?.cardio) {
      setCd((prev) => ({ ...prev, ...existing.cardio }))
    }
  }, [sessionsLoaded, mergedPlan, getSession])

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
  if (authLoading || (user && (!sessionsLoaded || !settingsLoaded))) return <><Loading /><Toast /></>
  if (!user) return <><AuthScreen onSignIn={signIn} /><Toast /></>
  if (!settings) return <><Onboarding onComplete={handleOnboardingComplete} /><Toast /></>

  return (
    <div className="app">
      <Toast />
      <WeekBar user={user} sessions={sessions} settings={settings} plan={mergedPlan} onSignOut={handleSignOut} />
      <main className="main">
        {activeTab === 'today' ? (
          <TodayView
            fd={fd}
            setFd={setFd}
            cd={cd}
            setCd={setCd}
            settings={settings}
            plan={mergedPlan}
            sessions={sessions}
            getSession={getSession}
            getPrevSession={getPrevSession}
            onComplete={async (session) => {
              try {
                await saveSession(session)
              } catch (e) {
                console.error('Failed to save session:', e)
                showToast('Could not save — check your connection and try again.')
              }
            }}
          />
        ) : activeTab === 'progress' ? (
          <ProgressView
            sessions={sessions}
            hasMore={hasMore}
            onLoadMore={loadMoreSessions}
            settings={settings}
            bodyweight={bodyweight}
            onLogWeight={logWeight}
          />
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
