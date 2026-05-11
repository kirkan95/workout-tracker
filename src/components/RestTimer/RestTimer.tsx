import styles from './RestTimer.module.css'

interface Props {
  seconds: number
  running: boolean
  onStop: () => void
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export default function RestTimer({ seconds, running, onStop }: Props) {
  if (!running) return null
  return (
    <div className={styles.pill}>
      <span className={styles.time}>{fmt(seconds)}</span>
      <button className={styles.stopBtn} onClick={onStop} aria-label="Stop timer">⏹</button>
    </div>
  )
}
