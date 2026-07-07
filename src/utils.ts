function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function dateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function getWeekStartDate(startDay: number, from: Date = new Date()): string {
  const diff = (from.getDay() - startDay + 7) % 7
  const weekStart = new Date(from)
  weekStart.setDate(from.getDate() - diff)
  return dateStr(weekStart)
}

// Monday 2024-01-01 — a fixed, arbitrary reference point used only to count
// whole weeks elapsed. Never compared against "now" in absolute terms, so it's
// immune to timezone/DST drift the way "day of year" epochs (Jan 1 of the
// current year) are not — see UPGRADE.md §1.9 (A/B variant flip bug).
const WEEK_EPOCH = new Date(2024, 0, 1)

export function weeksSinceEpoch(d: Date): number {
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const days = Math.round((midnight.getTime() - WEEK_EPOCH.getTime()) / 86400000)
  return Math.floor(days / 7)
}

// Pulls a concrete starting number out of a target string ("8-12" -> "8",
// "30s" -> "30", "max" -> "") so the one-tap log button has something real
// to commit. Shared between the placeholder display and the commit action
// so they can never disagree about what "the target" actually is.
export function parseTargetReps(repRange: string): string {
  if (!repRange || repRange === 'max') return ''
  const sec = repRange.match(/^(\d+)s$/)
  if (sec) return sec[1]
  const range = repRange.match(/^(\d+)-(\d+)$/)
  if (range) return range[1]
  return ''
}

export function resolveSetTarget(
  current: { weight: string; reps: string },
  aiTarget: { weight: number | null; repRange: string } | undefined,
  prevSet: { weight: number | null; reps: number | null } | undefined,
  fallbackTarget: string,
): { weight: string; reps: string } {
  const weight = current.weight
    || (aiTarget?.weight != null ? String(aiTarget.weight) : '')
    || (prevSet?.weight != null ? String(prevSet.weight) : '')
  const reps = current.reps
    || (aiTarget ? parseTargetReps(aiTarget.repRange) : '')
    || (prevSet?.reps != null ? String(prevSet.reps) : '')
    || parseTargetReps(fallbackTarget)
  return { weight, reps }
}
