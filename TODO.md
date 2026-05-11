# Workout Tracker — V2 Build Plan

## How to read this

Each phase must be fully complete before starting the next. Items within a phase can be built in any order unless marked with a dependency note. Existing session data in Firebase must be preserved at every step.

---

## Phase 1 — Data Foundation
> Everything else depends on this. No UI work until these are done.

- [ ] Add `feel?: 'easy' | 'medium' | 'hard'` to `SetData` in `src/types/index.ts`
- [ ] Add `CardioData` feel field: update existing `CardioData` type to include `feel?: 'easy' | 'medium' | 'hard'` and `duration: number`
- [ ] Add `UserSettings` type to `src/types/index.ts`
  ```ts
  goal: 'stronger' | 'muscle' | 'loseweight' | 'stayfit'
  startDay: number          // 0–6, Sunday = 0
  restDays: number[]
  equipment: Equipment[]    // from exercises.ts
  exclusions: string[]      // movement type keys
  mesocycleStart: string    // ISO date of first session
  timerAlert: 'sound' | 'silent'
  workoutDuration: number   // minutes
  ```
- [ ] Add `WeeklyPlan` type to `src/types/index.ts`
  ```ts
  weekStartDate: string     // ISO date
  settingsHash: string      // hash of goal+equipment+exclusions — invalidate if changed
  status: 'ok' | 'error'
  schedule: Record<string, DayPlan>  // date → day assignment
  ```
- [ ] Add `useSettings` hook (`src/hooks/useSettings.ts`) — reads/writes `users/{uid}/settings` in Firestore
- [ ] Add `usePlan` hook (`src/hooks/usePlan.ts`) — reads `users/{uid}/plans/{weekStartDate}` from Firestore

---

## Phase 2 — Onboarding
> Depends on: Phase 1 (needs UserSettings type and useSettings hook)

- [ ] Build onboarding flow — shown once on first launch (no `settings` doc in Firestore = new user)
  - **Step 1** — Pick your goal: Get Stronger / Build Muscle / Lose Weight / Stay Fit (with a one-line description of each)
  - **Step 2** — What equipment do you have? (multi-select, 8 options from `exercises.ts` Equipment type)
  - **Step 3** — Any exercises to avoid? (multi-select, 9 exclusion keys with plain-language labels)
  - **Step 4** — What day does your week start? (day picker, default Monday)
  - **Step 5** — Pick your rest days (multi-select days of the week, min 1)
  - **Step 6** — How long do you want your workouts to be? (picker: 15 / 20 / 30 / 45 / 60 / 75 / 90 min)
  - **Step 7** — Baseline week explainer: "Your first week is your starting point — fill in what you can do and rate each set. We'll take it from there."
- [ ] Write completed onboarding answers to `users/{uid}/settings` via `useSettings`
- [ ] Set `mesocycleStart` to today's date on onboarding completion

---

## Phase 3 — AI / Cloud Function
> Depends on: Phase 1 + Phase 2 (needs settings to exist before generating a plan)

- [ ] Set up Firebase Cloud Functions (`functions/` directory, TypeScript)
- [ ] Create AI provider abstraction in `functions/src/ai.ts`
  ```ts
  const AI_CONFIG = { provider: 'gemini', model: 'gemini-2.5-flash' }
  ```
  All model-specific code lives here — swapping providers = changing this file only.
- [ ] Build prompt assembler (`functions/src/promptAssembler.ts`)
  - Always include: `TRAINER.md`
  - PPL goals (stronger/muscle): also include `TRAINER_PPL.md`
  - Full Body goals (loseweight/stayfit): also include `TRAINER_FULLBODY.md`
  - If week contains cardio days: also include `TRAINER_CARDIO.md`
  - Append compressed session history (see below)
  - Append user settings context (goal, equipment, exclusions, duration, mesocycle week number)
- [ ] Build session history compressor (`functions/src/compressHistory.ts`)
  - Use `loadRecentSessions(28)` — already in `useSession.ts`
  - Compact format: `push 2026-04-07: db_chest_press 3x[30x10e,32x10m,32x8h]`
  - Include `feel` abbreviation: e — easy, m — medium, h — hard
  - Target: ~80 tokens per session, ~960 tokens for 4 weeks
- [ ] Define JSON output schema for weekly plan (Gemini `response_json_schema`)
  - Weekly schedule: which workout type per day
  - Per-exercise targets: sets, rep range, suggested weight
  - `durationConflict: boolean` — true if goal=stronger/muscle and duration < 30 min
- [ ] Wire Gemini 2.5 Flash API call with `response_mime_type: 'application/json'`
- [ ] Add return-from-break detection: check date of last completed session, apply TRAINER.md rules before generating targets
- [ ] Cache plan in Firestore `users/{uid}/plans/{weekStartDate}`
  - Compute `settingsHash` from goal + equipment + exclusions — regenerate if hash changes
  - Write `status: 'error'` on AI call failure so client can show fallback gracefully
- [ ] Add token usage logging to Firestore `admin/tokenLog` (input tokens, output tokens, model, timestamp, userId hash)
- [ ] Expose single Cloud Function endpoint: `generateWeeklyPlan(uid)` — client calls this, function handles everything above

---

## Phase 4 — Today View Updates
> Depends on: Phase 1 (types). AI plan display depends on Phase 3.

- [ ] Add warm-up collapsible banner at top of each session (hardcoded per workout type, no AI needed)
  - Push: "Do 2 warm-up sets at 50% of your working weight on your first exercise."
  - Pull: "Do 2 warm-up sets at 50% of your first exercise, or 10 band pull-aparts."
  - Legs: "5 min light walk + 10 bodyweight squats before loading up."
  - Full Body: "5 min light movement, then 10 each: bodyweight squats, arm circles, leg swings."
  - Cardio: "Start at an easy pace for the first 3–5 minutes before hitting your target effort."
- [ ] Add Easy / Medium / Hard rating after each set in `ExerciseCard`
  - 3-button row below the set input, appears after weight/reps are filled
  - Saves to `SetData.feel`
- [ ] Add rest timer component (state lives in `TodayView`, not `ExerciseCard`)
  - Tap to start — pre-configured to goal's rest time (see defaults below)
  - ±10s buttons while timer is stopped or running
  - "Set all to this time" option applies to all exercise timers in the session
  - Sound alert via Web Audio API when timer hits zero (iOS PWA safe — no vibration API)
  - **Global singleton**: only one timer runs at a time — starting a new one stops the current
- [ ] Add cardio session effort rating (Easy / Medium / Hard) + duration input field
- [ ] Show AI-suggested weight/rep targets as placeholder text in set inputs (week 2+, when plan exists)
  - Week 1: blank placeholders, no targets shown
- [ ] Replace hardcoded `SCHED` with AI-generated plan from Firestore (`usePlan` hook)
  - Fallback to `schedule.ts` if no plan exists (week 1 or AI error)
  - Show "generating your plan…" state while Cloud Function runs for the first time

---

## Phase 5 — Settings Screen
> Depends on: Phase 1 + Phase 2. Can be built in parallel with Phase 4.

- [ ] Build settings screen accessible from bottom nav or header
  - Goal — with one-line description of each option
  - Equipment — multi-select
  - Exercises to avoid — multi-select exclusion list
  - Week start day
  - Rest days
  - Workout duration target
  - Timer alert: Sound / Silent
- [ ] On goal change: warn "Starting a new goal will reset your training block." Require confirmation.
- [ ] On any settings change: update `settingsHash` in the current week's plan document to trigger regeneration on next app open

---

## Reference

### Rest Timer Defaults by Goal

| Goal         | Rest Time |
|---|---|
| Get Stronger | 4 min |
| Build Muscle | 90 sec |
| Lose Weight  | 45 sec |
| Stay Fit     | 60 sec |

### Exclusion Keys (used in UserSettings.exclusions)

| Key | Plain label |
|---|---|
| `squat` | Squats & lunges |
| `hinge` | Deadlifts & hinges |
| `overhead` | Overhead pressing |
| `push` | Push-ups & chest pressing |
| `pull` | Pull-ups & rows |
| `core` | Core & ab work |
| `carry` | Loaded carries |
| `highImpact` | Running & high impact |
| `singleLeg` | Single-leg exercises |

### Equipment Options (UserSettings.equipment)

`dumbbells` · `pullupbar` · `dipstation` · `resistancebands` · `barbell` · `bench` · `cables` · `kettlebell`

---

## Hard Rules (do not break these)

- Existing Firebase session data must be preserved at every step — never drop or rename existing Firestore fields
- `schedule.ts` stays as the fallback at all times (week 1, AI error, offline)
- `exercises.ts` is client-side only — descriptions and full metadata never sent to AI
- All user-facing text: plain language, no scientific jargon
- No free-text fields sent to the AI prompt — all user input that reaches the AI must be structured (arrays, numbers, known string keys)
