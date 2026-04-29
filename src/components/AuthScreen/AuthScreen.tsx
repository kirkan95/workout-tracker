import styles from './AuthScreen.module.css'

interface Props {
  onSignIn: () => void
}

export default function AuthScreen({ onSignIn }: Props) {
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.icon}>💪</div>
        <h1 className={styles.title}>Workout Tracker</h1>
        <p className={styles.sub}>
          Sign in to sync your workouts<br />across all your devices.
        </p>
        <button className={styles.googleBtn} onClick={onSignIn}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.5 33 29.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.7 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 7 29.2 4.5 24 4.5 16.3 4.5 9.6 8.8 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5.1l-6.2-5.2C29.4 35.3 26.8 36 24 36c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.1 5.5l6.2 5.2C42.6 35.5 44 30 44 24c0-1.3-.1-2.7-.4-4z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  )
}
