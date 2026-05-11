import { useState } from 'react'
import { UserSettings } from '../../types'
import { Equipment } from '../../data/exercises'
import styles from './SettingsView.module.css'

const GOALS: { key: UserSettings['goal']; label: string; sub: string }[] = [
  { key: 'stronger',  label: 'Get Stronger',  sub: 'Low reps, heavy weight, long rest.' },
  { key: 'muscle',    label: 'Build Muscle',   sub: 'Moderate weight, higher volume.' },
  { key: 'loseweight',label: 'Lose Weight',    sub: 'Short rests, full body circuits.' },
  { key: 'stayfit',   label: 'Stay Fit',       sub: 'Consistent, balanced sessions.' },
]

const EQUIPMENT: { key: Equipment; label: string }[] = [
  { key: 'dumbbells',      label: 'Dumbbells' },
  { key: 'pullupbar',      label: 'Pull-up bar' },
  { key: 'dipstation',     label: 'Dip station' },
  { key: 'resistancebands',label: 'Resistance bands' },
  { key: 'barbell',        label: 'Barbell' },
  { key: 'bench',          label: 'Bench' },
  { key: 'cables',         label: 'Cable machine' },
  { key: 'kettlebell',     label: 'Kettlebell' },
]

const EXCLUSIONS: { key: string; label: string }[] = [
  { key: 'squat',      label: 'Squats & lunges' },
  { key: 'hinge',      label: 'Deadlifts & hinges' },
  { key: 'overhead',   label: 'Overhead pressing' },
  { key: 'push',       label: 'Push-ups & chest pressing' },
  { key: 'pull',       label: 'Pull-ups & rows' },
  { key: 'core',       label: 'Core & ab work' },
  { key: 'carry',      label: 'Loaded carries' },
  { key: 'highImpact', label: 'Running & high impact' },
  { key: 'singleLeg',  label: 'Single-leg exercises' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DURATIONS = [15, 20, 30, 45, 60, 75, 90]

interface Props {
  settings: UserSettings
  saving: boolean
  onSave: (settings: UserSettings) => Promise<void>
}

export default function SettingsView({ settings, saving, onSave }: Props) {
  const [goal, setGoal]                   = useState(settings.goal)
  const [equipment, setEquipment]         = useState<Equipment[]>(settings.equipment)
  const [exclusions, setExclusions]       = useState<string[]>(settings.exclusions)
  const [startDay, setStartDay]           = useState(settings.startDay)
  const [restDays, setRestDays]           = useState<number[]>(settings.restDays)
  const [workoutDuration, setDuration]    = useState(settings.workoutDuration)
  const [timerAlert, setTimerAlert]       = useState(settings.timerAlert)
  const [confirmGoal, setConfirmGoal]     = useState<UserSettings['goal'] | null>(null)

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
  }

  const handleGoalClick = (key: UserSettings['goal']) => {
    if (key === goal) return
    if (key !== settings.goal) {
      setConfirmGoal(key)
    } else {
      setGoal(key)
    }
  }

  const confirmGoalChange = () => {
    if (confirmGoal) setGoal(confirmGoal)
    setConfirmGoal(null)
  }

  const handleSave = async () => {
    await onSave({
      ...settings,
      goal,
      equipment,
      exclusions,
      startDay,
      restDays,
      workoutDuration,
      timerAlert,
    })
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Settings</h1>

      <section className={styles.section}>
        <div className={styles.sectionLabel}>Goal</div>
        <div className={styles.cards}>
          {GOALS.map(({ key, label, sub }) => (
            <button
              key={key}
              className={`${styles.goalCard} ${goal === key ? styles.selected : ''}`}
              onClick={() => handleGoalClick(key)}
            >
              <span className={styles.goalLabel}>{label}</span>
              <span className={styles.goalSub}>{sub}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLabel}>Equipment</div>
        <div className={styles.chips}>
          {EQUIPMENT.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.chip} ${equipment.includes(key) ? styles.selected : ''}`}
              onClick={() => setEquipment(toggle(equipment, key))}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLabel}>Exercises to avoid</div>
        <div className={styles.chips}>
          {EXCLUSIONS.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.chip} ${exclusions.includes(key) ? styles.selected : ''}`}
              onClick={() => setExclusions(toggle(exclusions, key))}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.hint}>Nothing to skip? Leave all unselected.</div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLabel}>Week starts on</div>
        <div className={styles.dayRow}>
          {DAYS.map((day, i) => (
            <button
              key={i}
              className={`${styles.dayBtn} ${startDay === i ? styles.selected : ''}`}
              onClick={() => setStartDay(i)}
            >
              {day}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLabel}>Rest days</div>
        <div className={styles.dayRow}>
          {DAYS.map((day, i) => (
            <button
              key={i}
              className={`${styles.dayBtn} ${restDays.includes(i) ? styles.selected : ''}`}
              onClick={() => {
                if (restDays.includes(i) && restDays.length === 1) return
                setRestDays(toggle(restDays, i))
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLabel}>Workout duration</div>
        <div className={styles.chips}>
          {DURATIONS.map((d) => (
            <button
              key={d}
              className={`${styles.chip} ${workoutDuration === d ? styles.selected : ''}`}
              onClick={() => setDuration(d)}
            >
              {d} min
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLabel}>Rest timer alert</div>
        <div className={styles.chips}>
          <button
            className={`${styles.chip} ${timerAlert === 'sound' ? styles.selected : ''}`}
            onClick={() => setTimerAlert('sound')}
          >
            Sound
          </button>
          <button
            className={`${styles.chip} ${timerAlert === 'silent' ? styles.selected : ''}`}
            onClick={() => setTimerAlert('silent')}
          >
            Silent
          </button>
        </div>
      </section>

      <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>

      {confirmGoal && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <div className={styles.dialogTitle}>Change goal?</div>
            <p className={styles.dialogBody}>
              Starting a new goal will reset your training block. Your session history is kept.
            </p>
            <div className={styles.dialogBtns}>
              <button className={styles.dialogCancel} onClick={() => setConfirmGoal(null)}>
                Cancel
              </button>
              <button className={styles.dialogConfirm} onClick={confirmGoalChange}>
                Change Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
