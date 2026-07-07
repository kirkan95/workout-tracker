import { useState } from 'react'
import { round25 } from '../../engine/progression'
import styles from './WarmupBanner.module.css'

const GENERIC_MESSAGES: Record<string, string> = {
  push:     'Do 2 warm-up sets at 50% of your working weight on your first exercise.',
  pull:     'Do 2 warm-up sets at 50% of your first exercise, or 10 band pull-aparts.',
  legs:     '5 min light walk + 10 bodyweight squats before loading up.',
  fullbody: '5 min light movement, then 10 each: bodyweight squats, arm circles, leg swings.',
  cardio:   'Start at an easy pace for the first 3–5 minutes before hitting your target effort.',
}

function resolveType(workoutId: string): string | null {
  const id = workoutId.toLowerCase()
  if (id.includes('push'))     return 'push'
  if (id.includes('pull'))     return 'pull'
  if (id.includes('leg'))      return 'legs'
  if (id.includes('full'))     return 'fullbody'
  if (id.includes('cardio'))   return 'cardio'
  return null
}

interface Props {
  workoutId: string
  workingWeight?: number | null  // the first exercise's target weight — lets the banner give real numbers
}

export default function WarmupBanner({ workoutId, workingWeight }: Props) {
  const [open, setOpen] = useState(true)
  const key = resolveType(workoutId)
  if (!key) return null

  let msg = GENERIC_MESSAGES[key]
  if (workingWeight != null && workingWeight > 0) {
    const w1 = round25(workingWeight * 0.4)
    const w2 = round25(workingWeight * 0.7)
    msg = `Warm up: ${w1} lbs × 8, ${w2} lbs × 3, then your working sets at ${workingWeight} lbs.`
  }

  return (
    <div className={`${styles.banner} ${open ? '' : styles.collapsed}`}>
      <button className={styles.toggle} onClick={() => setOpen((o) => !o)}>
        <span className={styles.label}>Warm-up</span>
        <span className={styles.chevron}>{open ? '▾' : '▸'}</span>
      </button>
      {open && <p className={styles.msg}>{msg}</p>}
    </div>
  )
}
