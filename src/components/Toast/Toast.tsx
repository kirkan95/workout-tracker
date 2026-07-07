import { useEffect, useState } from 'react'
import { setToastListener } from '../../lib/toast'
import styles from './Toast.module.css'

interface ToastItem { id: number; message: string }

export default function Toast() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    setToastListener((message) => {
      const id = Date.now() + Math.random()
      setItems((prev) => [...prev, { id, message }])
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4000)
    })
    return () => setToastListener(null)
  }, [])

  if (!items.length) return null

  return (
    <div className={styles.stack} role="status" aria-live="polite">
      {items.map((i) => <div key={i.id} className={styles.toast}>{i.message}</div>)}
    </div>
  )
}
