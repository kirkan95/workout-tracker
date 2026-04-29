import styles from './SaunaBanner.module.css'

interface Props {
  onDismiss: () => void
}

export default function SaunaBanner({ onDismiss }: Props) {
  return (
    <div className={styles.banner}>
      <span>🔥 Remember: 15–20 min sauna</span>
      <button className={styles.close} onClick={onDismiss}>✕</button>
    </div>
  )
}
