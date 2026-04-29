import { DaySchedule } from '../../../types'
import styles from './RestView.module.css'

interface Props {
  day: DaySchedule
}

export default function RestView({ day }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>😴</div>
      <div className={styles.title}>{day.name}</div>
      <div className={styles.sub}>{day.sub}</div>
    </div>
  )
}
