import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSession } from './hooks/useSession'
import PasswordGate from './components/PasswordGate/PasswordGate'
import AuthScreen from './components/AuthScreen/AuthScreen'
import Loading from './components/Loading/Loading'
import WeekBar from './components/WeekBar/WeekBar'
import BottomNav from './components/BottomNav/BottomNav'
import TodayView from './components/TodayView/TodayView'
import HistoryView from './components/HistoryView/HistoryView'
import SaunaBanner from './components/SaunaBanner/SaunaBanner'
import { SCHED } from './data/schedule'
import { todayStr } from './utils'
import { FormData, CardioData } from './types'

const PW_KEY = 'wt_unlocked'

// ── TYPESCRIPT CONCEPT: Discriminated union for tab state ─────────────────────
// Instead of using a plain string, we restrict activeTab to only two values.
// TypeScript will error if you try to set it to anything else.
type Tab = 'today' | 'history'

export default function App() {
  // ── TYPESCRIPT CONCEPT: Initializer function in useState ──────────────────
  // The () => ... form runs only once on mount. Without it, localStorage.getItem
  // would run on every render (harmless here, but a good habit for expensive reads).
  const [unlocked, setUnlocked] = useState(() => !!localStorage.getItem(PW_KEY))
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [showSauna, setShowSauna] = useState(false)
  const [fd, setFd] = useState<FormData>({})
  const [cd, setCd] = useState<CardioData>({ type: 'run', duration: '', notes: '' })

  const { user, loading: authLoading, signIn, signOutUser } = useAuth()
  const { sessions, sessionsLoaded, loadAllSessions, saveSession, getSession, getPrevSession } = useSession(user)

  useEffect(() => {
    if (user) loadAllSessions()
  }, [user, loadAllSessions])

  // Initialize form inputs from today's cached session once sessions are loaded
  useEffect(() => {
    if (!sessionsLoaded) return
    const dow = new Date().getDay()
    const day = SCHED[dow]
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
    setCd({ type: 'run', duration: '', notes: '' })
  }

  if (!unlocked) return <PasswordGate onUnlock={handleUnlock} />
  if (authLoading || (user && !sessionsLoaded)) return <Loading />
  if (!user) return <AuthScreen onSignIn={signIn} />

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
            getSession={getSession}
            getPrevSession={getPrevSession}
            onComplete={async (session) => {
              await saveSession(session)
              setShowSauna(true)
            }}
          />
        ) : (
          <HistoryView sessions={sessions} />
        )}
      </main>
      {showSauna && <SaunaBanner onDismiss={() => setShowSauna(false)} />}
      <BottomNav activeTab={activeTab} onSwitch={setActiveTab} />
    </div>
  )
}
