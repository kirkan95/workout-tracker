import styles from './RestTimer.module.css'

interface Props {
  seconds: number
  configured: number
  running: boolean
  onStart: () => void
  onStop: () => void
  onAdjust: (delta: number) => void
  onSetAll: () => void
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export default function RestTimer({ seconds, configured, running, onStart, onStop, onAdjust, onSetAll }: Props) {
  return (
    <div className={`${styles.bar} ${running ? styles.active : ''}`}>
      <div className={styles.left}>
        <span className={styles.time}>{fmt(seconds)}</span>
        <button className={styles.adjustBtn} onClick={() => onAdjust(-10)}>−10s</button>
        <button className={styles.adjustBtn} onClick={() => onAdjust(+10)}>+10s</button>
      </div>
      <div className={styles.right}>
        <button className={styles.setAll} onClick={onSetAll}>
          {fmt(configured)} for all
        </button>
        <button className={styles.startStop} onClick={running ? onStop : onStart}>
          {running ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  )
}
