import styles from './RestTimer.module.css'

interface Props {
  seconds: number
  configured: number
  running: boolean
  onSkip: () => void
  onAdjust: (delta: number) => void
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export default function RestTimer({ seconds, configured, running, onSkip, onAdjust }: Props) {
  if (!running) return null
  const pct = configured > 0 ? Math.max(0, Math.min(100, (seconds / configured) * 100)) : 0

  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <div className={styles.fill} style={{ width: `${pct}%` }} />
      <span className={`${styles.time} num`}>{fmt(seconds)}</span>
      <span className={styles.lbl}>rest</span>
      <button className={styles.adjustBtn} onClick={() => onAdjust(15)}>+15s</button>
      <button className={styles.skipBtn} onClick={onSkip}>skip</button>
    </div>
  )
}
