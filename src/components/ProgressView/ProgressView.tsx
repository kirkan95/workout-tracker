import { useMemo, useState } from 'react'
import { BodyweightEntry, UserSettings, WorkoutSession } from '../../types'
import { EXERCISES } from '../../data/exercises'
import { computeStreak, computeDayStreak, exerciseTrend, findPRs, sessionVolume } from '../../engine'
import { dateStr, getWeekStartDate, todayStr } from '../../utils'
import styles from './ProgressView.module.css'

const EXERCISE_MAP = new Map(EXERCISES.map((e) => [e.id, e]))

const WORKOUT_NAMES: Record<string, string> = {
  push: 'Push Day', pull: 'Pull Day', legs: 'Legs + Core', fullbody: 'Full Body', cardio: 'Cardio', rest: 'Rest Day',
}

const TYPE_COLOR_CLASS: Record<string, string> = {
  push: 'push', pull: 'pull', legs: 'legs', fullbody: 'fullbody', cardio: 'cardio',
}

const BORDER_CLASS: Record<string, string> = {
  push: 'borderPush', pull: 'borderPull', legs: 'borderLegs', fullbody: 'borderFullbody', cardio: 'borderCardio',
}

const FEEL_COLORS: Record<string, string> = {
  easy: styles.feelEasy, medium: styles.feelMedium, hard: styles.feelHard,
}

const PAGE_SIZE = 20

function formatPace(duration: number, distance: number): string | null {
  if (!duration || !distance) return null
  const paceMin = duration / distance
  const m = Math.floor(paceMin)
  const s = Math.round((paceMin - m) * 60)
  return `${m}:${String(s).padStart(2, '0')} /mi`
}

interface Props {
  sessions: WorkoutSession[]
  hasMore: boolean
  onLoadMore: () => Promise<void>
  settings: UserSettings
  bodyweight: BodyweightEntry[]
  onLogWeight: (weight: number) => Promise<void>
}

export default function ProgressView({ sessions, hasMore, onLoadMore, settings, bodyweight, onLogWeight }: Props) {
  const [openDate, setOpenDate] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)

  const completed = useMemo(() => sessions.filter((s) => s.completed), [sessions])

  // ── Stats tiles ────────────────────────────────────────────────────────
  const dayStreak = useMemo(() => computeDayStreak(sessions, settings), [sessions, settings])
  const weekStreak = useMemo(() => computeStreak(sessions, settings), [sessions, settings])
  const thisMonth = todayStr().slice(0, 7)
  const workoutsThisMonth = completed.filter((s) => s.date.startsWith(thisMonth)).length
  const totalVolume = useMemo(
    () => completed.reduce((sum, s) => sum + (s.type === 'strength' ? sessionVolume(s) : 0), 0),
    [completed],
  )
  const prCount = useMemo(() => {
    const chrono = [...completed].sort((a, b) => a.date.localeCompare(b.date))
    let n = 0
    chrono.forEach((s, i) => { n += findPRs(s, chrono.slice(0, i)).length })
    return n
  }, [completed])

  // ── Exercise trend chart ──────────────────────────────────────────────
  const exerciseOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    completed.forEach((s) => {
      Object.keys(s.exercises ?? {}).forEach((id) => { counts[id] = (counts[id] ?? 0) + 1 })
    })
    return Object.entries(counts)
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => ({ id, name: EXERCISE_MAP.get(id)?.name ?? id }))
  }, [completed])

  const activeExerciseId = selectedExercise ?? exerciseOptions[0]?.id ?? null
  const trend = activeExerciseId ? exerciseTrend(activeExerciseId, sessions, 12) : []
  const trendDelta = trend.length >= 2
    ? Math.round(((trend[trend.length - 1].e1rm - trend[0].e1rm) / trend[0].e1rm) * 100)
    : null

  // ── 12-week heatmap ────────────────────────────────────────────────────
  const heatmap = useMemo(() => {
    const weekStart0 = new Date(getWeekStartDate(settings.startDay) + 'T00:00:00')
    const cells: { date: string; type: string | null }[] = []
    for (let w = 11; w >= 0; w--) {
      for (let d = 0; d < 7; d++) {
        const day = new Date(weekStart0)
        day.setDate(day.getDate() - w * 7 + d)
        const ds = dateStr(day)
        const s = sessions.find((ses) => ses.date === ds && ses.completed)
        cells.push({ date: ds, type: s ? (s.type === 'cardio' ? 'cardio' : s.workoutId) : null })
      }
    }
    return cells
  }, [sessions, settings.startDay])

  if (!sessions.length) {
    return (
      <>
        <div className="pg-title">Progress</div>
        <div className={styles.empty}>
          <div className={styles.emptyIco}>📈</div>
          <p>No workouts logged yet.<br />Complete today's session<br />to get started.</p>
        </div>
      </>
    )
  }

  const visibleSessions = sessions.slice(0, visibleCount)

  return (
    <>
      <div className="pg-title">Progress</div>

      <div className={styles.statGrid}>
        <div className={styles.sTile}><span className="num">🔥 {dayStreak}</span><label>day streak</label></div>
        <div className={styles.sTile}><span className="num">{weekStreak}</span><label>wk streak</label></div>
        <div className={styles.sTile}><span className="num">{workoutsThisMonth}</span><label>this month</label></div>
        <div className={styles.sTile}><span className="num">{totalVolume >= 1000 ? `${Math.round(totalVolume / 1000)}k` : totalVolume}</span><label>lbs lifted</label></div>
        <div className={styles.sTile}><span className="num" style={{ color: 'var(--accent)' }}>{prCount}</span><label>PRs</label></div>
      </div>

      <BodyweightCard entries={bodyweight} onLog={onLogWeight} />

      {exerciseOptions.length > 0 && (
        <div className={styles.chartCard}>
          <div className={styles.chartHead}>
            <select value={activeExerciseId ?? ''} onChange={(e) => setSelectedExercise(e.target.value)}>
              {exerciseOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
            </select>
            {trendDelta != null && (
              <span className={styles.delta} style={{ color: trendDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {trendDelta >= 0 ? '▲' : '▼'} {Math.abs(trendDelta)}% / {trend.length} sessions
              </span>
            )}
          </div>
          {trend.length >= 2 ? (
            <TrendChart points={trend.map((p) => ({ date: p.date, value: p.e1rm }))} valueLabel={(v) => `e1RM ${v}`} />
          ) : (
            <p className={styles.chartEmpty}>Log this exercise a couple more times to see a trend.</p>
          )}
        </div>
      )}

      <div className={styles.chartCard}>
        <div className={styles.chartHeadPlain}>Last 12 weeks</div>
        <div className={styles.heat}>
          {heatmap.map((c) => (
            <div
              key={c.date}
              className={`${styles.hc} ${c.type ? styles[TYPE_COLOR_CLASS[c.type] ?? ''] ?? '' : ''}`}
              title={c.date}
            />
          ))}
        </div>
      </div>

      {visibleSessions.map((ses) => {
        const d = new Date(ses.date + 'T12:00:00')
        const lbl = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        const open = openDate === ses.date
        const dayName = ses.workoutId ? (WORKOUT_NAMES[ses.workoutId] ?? 'Workout') : 'Workout'
        const borderKey = ses.type === 'cardio' ? 'cardio' : ses.workoutId
        const borderClass = borderKey ? styles[BORDER_CLASS[borderKey]] ?? '' : ''

        const priorSessions = sessions.filter((s) => s.date < ses.date)
        const prs = ses.completed ? findPRs(ses, priorSessions) : []

        let detail: React.ReactNode = null
        let summaryLine = ''

        if (ses.type === 'strength' && ses.exercises) {
          const totalSets = Object.values(ses.exercises).reduce((n, log) => n + log.sets.filter((s) => s.weight != null || s.reps != null).length, 0)
          summaryLine = `${totalSets} sets · ${sessionVolume(ses).toLocaleString()} lbs`

          detail = Object.entries(ses.exercises).map(([exId, logged]) => {
            if (!logged?.sets?.length) return null
            const libEx = EXERCISE_MAP.get(exId)
            const exName = libEx?.name ?? exId
            const isTime = libEx ? libEx.repRange === 'time' : false

            const rows = logged.sets
              .map((set, i) => {
                const parts: string[] = []
                if (set.weight != null && set.weight !== 0) parts.push(`${set.weight} lbs`)
                if (set.reps   != null && set.reps   !== 0) parts.push(`${set.reps} ${isTime ? 'sec' : 'reps'}`)
                if (!parts.length) return null
                return (
                  <div key={i} className={styles.hSet}>
                    <span className={styles.hSetLbl}>Set {i + 1}</span>
                    <span className={styles.hSetData}>{parts.join(' × ')}</span>
                    {set.feel && <span className={`${styles.feelBadge} ${FEEL_COLORS[set.feel] ?? ''}`}>{set.feel}</span>}
                  </div>
                )
              })
              .filter(Boolean)

            if (!rows.length) return null
            return (
              <div key={exId} className={styles.hEx}>
                <div className={styles.hExName}>{exName}</div>
                {rows}
              </div>
            )
          })
        } else if (ses.type === 'cardio' && ses.cardio) {
          const c = ses.cardio
          const pace = formatPace(c.duration, c.distance ?? 0)
          summaryLine = [c.duration ? `${c.duration} min` : null, pace].filter(Boolean).join(' · ')
          detail = (
            <div className={styles.hEx}>
              <div className={styles.hSet}><span className={styles.hSetLbl}>Type</span><span className={styles.capitalize}>{c.type}</span></div>
              {c.duration  ? <div className={styles.hSet}><span className={styles.hSetLbl}>Time</span><span>{c.duration} min</span></div> : null}
              {c.distance  ? <div className={styles.hSet}><span className={styles.hSetLbl}>Distance</span><span>{c.distance} mi</span></div> : null}
              {pace        ? <div className={styles.hSet}><span className={styles.hSetLbl}>Pace</span><span>{pace}</span></div> : null}
              {c.notes     ? <div className={styles.hSet}><span className={styles.hSetLbl}>Notes</span><span>{c.notes}</span></div> : null}
              {c.feel      ? <div className={styles.hSet}><span className={styles.hSetLbl}>Feel</span><span className={`${styles.feelBadge} ${FEEL_COLORS[c.feel] ?? ''}`}>{c.feel}</span></div> : null}
            </div>
          )
        }

        return (
          <div
            key={ses.date}
            className={`${styles.hItem} ${open ? styles.open : ''} ${borderClass}`}
            onClick={() => setOpenDate(open ? null : ses.date)}
          >
            <div className={styles.hHead}>
              <div>
                <div className={styles.hDate}>{lbl}</div>
                <div className={styles.hType}>{dayName}{summaryLine ? ` · ${summaryLine}` : ''}</div>
              </div>
              <div className={styles.hHeadRight}>
                {prs.length > 0 && <span className={styles.prBadge}>PR</span>}
                <span className={styles.hChevron}>›</span>
              </div>
            </div>
            {open && (
              <div className={styles.hBody}>
                {detail ?? <p className={styles.noDetail}>No details recorded.</p>}
              </div>
            )}
          </div>
        )
      })}

      {(visibleCount < sessions.length || hasMore) && (
        <button
          className={styles.loadMore}
          disabled={loadingMore}
          onClick={async () => {
            if (visibleCount < sessions.length) {
              setVisibleCount((c) => c + PAGE_SIZE)
              return
            }
            setLoadingMore(true)
            await onLoadMore()
            setVisibleCount((c) => c + PAGE_SIZE)
            setLoadingMore(false)
          }}
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </>
  )
}

function TrendChart({ points, valueLabel }: { points: { date: string; value: number }[]; valueLabel: (v: number) => string }) {
  const width = 340
  const height = 90
  const pad = 12
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const coords = points.map((p, i) => {
    const x = points.length > 1 ? (i / (points.length - 1)) * width : width / 2
    const y = height - pad - ((p.value - min) / range) * (height - pad * 2)
    return `${x},${y}`
  })

  const last = coords[coords.length - 1].split(',').map(Number)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%' }}>
      <polyline points={coords.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="var(--accent)" />
      <text x={width - 4} y="12" textAnchor="end" fill="var(--text2)" fontSize="11" fontWeight="700">
        {valueLabel(points[points.length - 1].value)}
      </text>
    </svg>
  )
}

function BodyweightCard({ entries, onLog }: { entries: BodyweightEntry[]; onLog: (weight: number) => Promise<void> }) {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const today = todayStr()
  const todayEntry = entries.find((e) => e.date === today)
  const trend = entries.slice(0, 10).reverse().map((e) => ({ date: e.date, value: e.weight }))

  const handleSave = async () => {
    const w = parseFloat(value)
    if (!w) return
    setSaving(true)
    await onLog(w)
    setSaving(false)
    setValue('')
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeadPlain}>Body weight</div>
      <div className={styles.bwRow}>
        <input
          className={styles.bwInput}
          type="number"
          inputMode="decimal"
          placeholder={todayEntry ? String(todayEntry.weight) : 'lbs'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className={styles.bwSave} onClick={handleSave} disabled={saving || !value}>
          {saving ? 'Saving…' : todayEntry ? 'Update' : 'Log today'}
        </button>
      </div>
      {trend.length >= 2 && <TrendChart points={trend} valueLabel={(v) => `${v} lbs`} />}
    </div>
  )
}
