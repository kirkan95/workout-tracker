function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function getWeekStartDate(startDay: number): string {
  const today = new Date()
  const diff = (today.getDay() - startDay + 7) % 7
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - diff)
  return `${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}-${pad(weekStart.getDate())}`
}
