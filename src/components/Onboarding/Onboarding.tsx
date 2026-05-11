import { useState } from "react";
import { UserSettings } from "../../types";
import { Equipment } from "../../data/exercises";
import { todayStr } from "../../utils";
import styles from "./Onboarding.module.css";

const GOALS: { key: UserSettings["goal"]; label: string; sub: string }[] = [
  {
    key: "stronger",
    label: "Get Stronger",
    sub: "Low reps, heavy weight, long rest.",
  },
  {
    key: "muscle",
    label: "Build Muscle",
    sub: "Moderate weight, higher volume.",
  },
  {
    key: "loseweight",
    label: "Lose Weight",
    sub: "Short rests, full body circuits.",
  },
  { key: "stayfit", label: "Stay Fit", sub: "Consistent, balanced sessions." },
];

const EQUIPMENT: { key: Equipment; label: string }[] = [
  { key: "dumbbells", label: "Dumbbells" },
  { key: "pullupbar", label: "Pull-up bar" },
  { key: "dipstation", label: "Dip station" },
  { key: "resistancebands", label: "Resistance bands" },
  { key: "barbell", label: "Barbell" },
  { key: "bench", label: "Bench" },
  { key: "cables", label: "Cable machine" },
  { key: "kettlebell", label: "Kettlebell" },
];

const EXCLUSIONS: { key: string; label: string }[] = [
  { key: "squat", label: "Squats & lunges" },
  { key: "hinge", label: "Deadlifts & hinges" },
  { key: "overhead", label: "Overhead pressing" },
  { key: "push", label: "Push-ups & chest pressing" },
  { key: "pull", label: "Pull-ups & rows" },
  { key: "core", label: "Core & ab work" },
  { key: "carry", label: "Loaded carries" },
  { key: "highImpact", label: "Running & high impact" },
  { key: "singleLeg", label: "Single-leg exercises" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DURATIONS = [15, 20, 30, 45, 60, 75, 90];
const TOTAL_STEPS = 7;

interface Props {
  onComplete: (settings: UserSettings) => Promise<void>;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<UserSettings["goal"] | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [startDay, setStartDay] = useState(1);
  const [restDays, setRestDays] = useState<number[]>([0, 6]);
  const [workoutDuration, setWorkoutDuration] = useState(45);
  const [saving, setSaving] = useState(false);

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  const canProceed =
    step === 1 ? goal !== null : step === 5 ? restDays.length >= 1 : true;

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    setSaving(true);
    await onComplete({
      goal: goal!,
      equipment,
      exclusions,
      startDay,
      restDays,
      workoutDuration,
      mesocycleStart: todayStr(),
      timerAlert: "sound",
    });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div className={styles.content}>
          {step === 1 && (
            <>
              <h1 className={styles.title}>What's your goal?</h1>
              <p className={styles.sub}>We'll build your plan around this.</p>
              <div className={styles.cards}>
                {GOALS.map(({ key, label, sub }) => (
                  <button
                    key={key}
                    className={`${styles.goalCard} ${goal === key ? styles.selected : ""}`}
                    onClick={() => setGoal(key)}
                  >
                    <span className={styles.goalLabel}>{label}</span>
                    <span className={styles.goalSub}>{sub}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className={styles.title}>What equipment do you have?</h1>
              <p className={styles.sub}>Select everything available to you.</p>
              <div className={styles.chips}>
                {EQUIPMENT.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`${styles.chip} ${equipment.includes(key) ? styles.selected : ""}`}
                    onClick={() => setEquipment(toggle(equipment, key))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className={styles.title}>Anything to avoid?</h1>
              <p className={styles.sub}>
                Injury, preference — we'll skip these entirely.
              </p>
              <div className={styles.chips}>
                {EXCLUSIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`${styles.chip} ${exclusions.includes(key) ? styles.selected : ""}`}
                    onClick={() => setExclusions(toggle(exclusions, key))}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className={styles.hint}>
                Nothing to skip? Don't select anything.
              </p>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className={styles.title}>When does your week start?</h1>
              <p className={styles.sub}>
                Used to align your training schedule.
              </p>
              <div className={styles.dayRow}>
                {DAYS.map((day, i) => (
                  <button
                    key={i}
                    className={`${styles.dayBtn} ${startDay === i ? styles.selected : ""}`}
                    onClick={() => setStartDay(i)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 className={styles.title}>Which days are rest days?</h1>
              <p className={styles.sub}>Pick at least one.</p>
              <div className={styles.dayRow}>
                {DAYS.map((day, i) => (
                  <button
                    key={i}
                    className={`${styles.dayBtn} ${restDays.includes(i) ? styles.selected : ""}`}
                    onClick={() => {
                      if (restDays.includes(i) && restDays.length === 1) return;
                      setRestDays(toggle(restDays, i));
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h1 className={styles.title}>How long are your workouts?</h1>
              <p className={styles.sub}>
                We'll fit everything into this window.
              </p>
              <div className={styles.chips}>
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    className={`${styles.chip} ${workoutDuration === d ? styles.selected : ""}`}
                    onClick={() => setWorkoutDuration(d)}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <h1 className={styles.title}>
                Your first week is your baseline.
              </h1>
              <p className={styles.body}>
                Fill in what you can do and rate each set. We'll take it from
                there.
              </p>
            </>
          )}
        </div>

        <div className={styles.footer}>
          {step > 1 && (
            <button
              className={styles.backBtn}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
          )}
          <button
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={!canProceed || saving}
          >
            {step === TOTAL_STEPS
              ? saving
                ? "Saving…"
                : "Start Training"
              : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
