# Handoff

## Project Goal
AI-powered personal trainer PWA (React + Vite + TypeScript + Firebase). Gemini generates a weekly workout plan; users log workouts daily.

## Stack
- Frontend: React + Vite + TypeScript, Firebase Auth/Firestore
- Backend: Firebase Cloud Functions (Node/TS)
- AI: Gemini 2.5 Flash via `@google/generative-ai`

## Current State
All V2 features complete. This session resolved all open TODO items. Build is green (`npx tsc --noEmit` + `npx vite build` both clean).

## This Session's Changes

### 1. Fix save crash (undefined feel → Firestore rejection)
`src/components/TodayView/TodayView.tsx:66-79` — `buildStrengthSession`: `feel` is now spread conditionally (`...(feel ? { feel } : {})`) so undefined never reaches Firestore.

### 2. Timer three-dots button visibility
`src/components/TodayView/StrengthView/ExerciseCard/ExerciseCard.module.css:147-168` — `menuBtn` now has a real border + background instead of `opacity: 0.5`.

### 3. Timer button active state
- `ExerciseCard.module.css` — added `.timerBtnRunning` (accent border/bg)
- `ExerciseCard.tsx:21,34` — added `timerRunning: boolean` prop; applies `.timerBtnRunning` to timer button when running
- `StrengthView.tsx:60` — passes `timerRunning={timerRunning}` to each ExerciseCard

### 4. iOS PWA timer sound
`src/hooks/useRestTimer.ts:1-20` — replaced per-call `new AudioContext()` with a module-level singleton + `unlockCtx()` called inside `start()` (user gesture context), so iOS keeps the context running when the timer fires.

### 5. 100dvh PWA bug
`src/main.tsx:6-11` — added `visualViewport.resize` listener and `orientationchange` + 200ms setTimeout so iOS updates `--app-height` after rotation.

### 6. Descriptions for every exercise
`ExerciseCard.tsx:34-37` — replaced broken `TIPS[ex.id]` lookup (keys didn't match exercise IDs) with direct lookup from `EXERCISES` array (imported from `exercises.ts`). Every exercise now has a working `?` button showing the library description.

### 7. Primary/secondary muscles display
`ExerciseCard.tsx:38-39` — `primaryMuscle = libEx?.muscles[0]`, `secondaryMuscles = libEx?.muscles.slice(1)`. Displayed below exercise name in `.muscles` style (`ExerciseCard.module.css:26`).

### 8. Weight placeholder fix
`ExerciseCard.tsx:68` — fallback changed from `'—'` to `''` when no AI target or prev session (empty string is cleaner for number inputs).

### 9. Feel badges in history
`src/components/HistoryView/HistoryView.tsx` — completely rewritten:
- Iterates `ses.exercises` directly (not `day.exercises` from schedule) so history always shows what was actually logged
- Exercise names looked up from `EXERCISE_MAP` (built from EXERCISES array) — works regardless of schedule rotation
- Each set row shows Easy/Medium/Hard badge if `set.feel` was recorded
- Cardio sessions show feel badge too

### 10. Hardest/skipped day stats
`HistoryView.tsx:35-62` — stats card appears after ≥3 sessions: total strength workouts, toughest day (highest % hard-rated sets, requires ≥5 feel data points), most skipped (lowest session count among workout types).

### 11. Weekly exercise rotation (A/B variants)
`src/data/schedule.ts` — fully rewritten:
- `PUSH_A/B`, `PULL_A/B`, `LEGS_A/B` define two variants
- `getSchedule(d?: Date)` picks variant based on `weekNum % 2`
- Variant B: Push = flyes/arnold/overhead-tricep-ext/diamond-pushups; Pull = chinups/single-arm-row/bicep-curls/russian-twists/rear-delt-flyes; Legs = sumo-squat/glute-bridges/db-lunges/dead-bug
- `SCHED` kept as a re-export (`getSchedule()`) for backward compat
- `TodayView.tsx:2,53` — uses `getSchedule()` 
- `App.tsx:17,88-89` — uses `getSchedule(now)` for form initialization

## Architecture Notes
- Plan generation: `functions/src/index.ts` → `generateWeeklyPlan` (onCall) → `assemblePrompt` → `callAI` → `transformAIResponse` → Firestore
- Prompt built from `functions/trainer/TRAINER.md` + role-specific trainer files + session history + user settings
- Plan cached by week; regenerated when settings hash (goal+equipment+exclusions) changes
- `exercises.ts` is client-side only — never sent to AI

## Next Steps
- Deploy updated Cloud Functions: `firebase deploy --only functions` (has un-deployed changes from previous session: day notes in Gemini schema + prompt)
- Consider: surface all 7 days' AI notes in a "week overview" screen (currently only today's note shown in TodayView)
- Consider: `TIPS` data file (`src/data/tips.ts`) is now unused — can be deleted
- No outstanding bugs or blocked items
