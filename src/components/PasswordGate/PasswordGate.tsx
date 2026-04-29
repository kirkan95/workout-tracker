import { useState } from 'react'
import styles from './PasswordGate.module.css'

// ── TYPESCRIPT CONCEPT: Props interfaces ──────────────────────────────────────
// Every React component in TypeScript defines its accepted props as an interface.
// This replaces prop-types and gives you autocomplete + compile-time errors.
interface Props {
  onUnlock: () => void  // a function that takes no arguments and returns nothing
}

const PASSWORD = 'Linked9-Declared-Curfew'

export default function PasswordGate({ onUnlock }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const check = () => {
    if (value === PASSWORD) {
      onUnlock()
    } else {
      setError('Incorrect password.')
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.icon}>💪</div>
        <h1 className={styles.title}>Workout Tracker</h1>
        <p className={styles.sub}>Enter the password to continue.</p>
        <input
          className={styles.input}
          type="password"
          placeholder="Password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
        />
        <button className={styles.btn} onClick={check}>Continue</button>
        <p className={styles.error}>{error}</p>
      </div>
    </div>
  )
}
