# Workout Tracker — Comprehensive Review & Upgrade Plan (V3)

> **Handoff doc.** Written for implementation by Sonnet/Opus. Companion visual spec:
> [`UPGRADE_MOCKUPS.html`](UPGRADE_MOCKUPS.html) — open it in a browser; every mockup is
> annotated with implementation notes. When this doc and the HTML disagree on visuals,
> the HTML wins.
>
> Reviewed from three angles: **engineer** (correctness, cost, offline), **UI/UX designer**
> (logging flow, identity, feedback), **personal trainer** (progression, programming quality).
> The headline strategic change: make the app work **fully without AI** via a deterministic
> progression engine — that's also what makes it unique.

---

## 0. The Big Idea — "AI-optional" deterministic training engine

**Today:** the app is dead in the water without Gemini. Plan generation failing = console.error
and a silently degraded experience. Every user, every week = an API call.

**Proposal:** build `src/engine/` — a pure-TypeScript progression engine that generates the
weekly plan client-side from data the app already has. The AI call becomes an optional garnish
(the friendly weekly "coach note"), not the backbone.

Why this is the highest-impact change in the doc:

- **Resilience** — plan exists instantly, offline, on error, at week 1. `schedule.ts` fallback becomes obsolete.
- **Cost** — Gemini calls drop to zero (or become optional flavor text).
- **Uniqueness** — every fitness app in 2026 bolts on an LLM. A tracker whose progression logic
  is transparent, deterministic, and explainable ("+5 lbs because you hit 3×10 and rated it easy")
  is genuinely differentiated. Show the *reason* for every target in the UI.
- **Testability** — pure functions over data. Unit-test the whole training brain.

> **🎓 Backend concept — why "pure functions" matter here:** the engine is
> `(settings, history, date) → plan`. No I/O, no clock reads inside, no Firestore. That means
> the same inputs always produce the same plan (deterministic), you can unit-test it with
> fixture data without emulators, and it runs identically on client or server. This is the same
> principle behind idempotent API handlers. **Suggested learning exercise:** write
> `progressExercise()` (rules below) yourself first, with 5–6 Vitest cases (progress / hold /
> deload / gap), before handing the rest to the agent.

### 0.1 Engine modules

```
src/engine/
  progression.ts   // per-exercise: next session's weight/rep targets from history
  planner.ts       // per-week: pick days + exercises from exercises.ts, honoring settings
  e1rm.ts          // estimated 1-rep-max math (Epley) for progress charts & PR detection
  index.ts         // planWeek(settings, sessions, weekStartDate) → WeeklyPlan
```

The engine emits the existing `WeeklyPlan` type so `usePlan`/`TodayView` need minimal changes.
Add `source: 'engine' | 'ai'` and per-exercise `reason?: string` to the plan types.

### 0.2 Progression rules (`progression.ts`) — double progression + feel

Feel ratings are already collected and are a proxy for reps-in-reserve. Use them:

For each exercise, look at the last completed session of that exercise:

| Condition (last session) | Next target |
|---|---|
| All sets ≥ top of rep range AND no set rated `hard` | **+5 lbs** lower body / **+2.5 lbs** upper body (isolation: +2.5 always). Bodyweight: +1–2 reps or progress variation |
| Hit rep range but some sets `hard` | Same weight, aim +1 rep per set |
| Any set below bottom of rep range | Same weight (consolidate) |
| Below range two sessions in a row, or any set rated `hard` with reps < bottom | **−10%**, round to nearest 2.5 |
| No history for this exercise | Blank target, placeholder "find your weight" (current week-1 behavior) |

Attach the human-readable `reason` ("You hit 3×12 and rated it easy — time to go up") — surfaced
in the UI (see mockup **Screen 1**).

Rep ranges & rest by goal (replaces scattered `GOAL_REST` in `TodayView.tsx:13`):

| Goal | Compound reps | Isolation reps | Sets | Rest |
|---|---|---|---|---|
| stronger | 4–6 | 8–10 | 4 / 3 | 240s |
| muscle | 8–12 | 10–15 | 3 | 90s |
| loseweight | 12–15 | 15–20 | 3 / 2 | 45s |
| stayfit | 8–12 | 12–15 | 3 / 2 | 60s |

### 0.3 Week planner (`planner.ts`)

- Build the day layout from `settings.restDays` + goal (PPL for stronger/muscle, full-body for
  loseweight/stayfit) instead of the hardcoded Mon/Wed/Fri in `schedule.ts` — **today the app
  ignores the user's chosen rest days unless the AI happens to honor them**.
- Select exercises from `exercises.ts` (it already has everything needed: `movement`,
  `equipment`, `style`, `day`, `compound`, `defaultSets`, `repRange`) filtered by
  equipment/exclusions. Keep A/B alternation (fix the variant bug — §2.5), seeded by week
  number so it's stable within a week.
- Fit to `workoutDuration`: estimate ~3 min per working set + rest; drop isolation exercises
  first when over budget. (This replaces `durationConflict`.)
- **Deload week:** every 4th mesocycle week → −40% sets, weights −10%, note explains why.
  `mesocycleStart` already exists in settings and is currently unused by anything client-side.
- **Return-from-break:** gap since last completed session > 14 days → all weights −20%
  (> 28 days → −30% and one fewer set per exercise), reason attached. Currently this rule
  lives only in the Gemini prompt as prose — make it code.

### 0.4 What happens to the Cloud Function

Keep it, demoted: generate only the per-day `note` (coach flavor) and optionally sanity-check
the engine's plan. Client merges notes into the engine plan when they arrive; app never waits
on it. If you keep AI targets at all, engine remains the fallback on `status: 'error'`
(delete the current silent-failure path).

---

## 1. P0 Bugs (fix before any features)

### 1.1 🔴 Timezone mismatch → wrong plan key + repeated regeneration (costs money)

`functions/src/index.ts:49-55` computes `weekStartDate` with server-local time (Cloud Functions
run in **UTC**) and `toISOString()`. The client (`src/utils.ts` `getWeekStartDate`) uses the
user's local time. Any US-timezone user opening the app in the evening (next day in UTC) can get
a different week-start date on the server than the client — the function writes the plan under a
key the client never reads, the client sees "no plan," calls the function again on every app
open, and every call burns Gemini tokens.

**Fix:** client passes its locally computed `weekStartDate` (and tz offset) in the callable's
payload; the function validates it's a real date within ±1 day of a plausible week start and
uses it verbatim. Never derive user-local dates on the server.

> **🎓 Backend concept:** servers have no idea what time it is *for the user*. Cloud Functions
> clocks are UTC. Anything date-bucketed per user ("today", "this week") must be computed on the
> client and sent up, or computed server-side from an explicit user timezone. This class of bug
> is invisible in dev (you and your emulator share a timezone) and appears only for real users
> at certain hours — worth remembering as a pattern, not a one-off.

### 1.2 🔴 `settingsHash` ignores duration / rest days / start day

`computeSettingsHash` (`functions/src/index.ts:57-64`) hashes only goal+equipment+exclusions,
but the prompt uses `workoutDuration`, `restDays`, `startDay`. Changing workout duration from
90 → 15 min in Settings returns the **cached** plan — the save button lies. Include every
plan-affecting field in the hash. (Moot for targets once the engine lands, but fix it while the
function still generates plans.)

### 1.3 🔴 Rest timer dies when the phone locks

`useRestTimer.ts` decrements state on `setInterval`. iOS suspends PWA JS timers when the screen
locks or the app backgrounds — which is exactly what people do between sets. Timer stalls,
no alert, resumes wrong on unlock.

**Fix:** store `endsAt = Date.now() + configured*1000` when started; interval (and a
`visibilitychange` listener) computes `remaining = Math.ceil((endsAt - Date.now())/1000)`.
On becoming visible past `endsAt`, show "rest done" state. The alert can't fire while
suspended — accept that; optionally schedule a Web Push notification later (iOS 16.4+ supports
it for installed PWAs).

### 1.4 🔴 Re-saving a workout erases previous `feel` ratings

`feelData` starts `{}` in `TodayView` and is never seeded from the saved session. "✓ Saved —
Tap to Update" rebuilds every set via `buildStrengthSession` with empty feel → overwrites
Firestore, ratings gone. Also `feelData` lives in `TodayView`, which **unmounts on every tab
switch** (`App.tsx:133` conditional render) — visit History mid-workout and your ratings are
gone from the form too.

**Fix:** hoist `feelData` to `App` alongside `fd` (or better: merge weight/reps/feel into one
form-state object — they're the same lifecycle), and seed it from `existing` in the same effect
that seeds `fd` (`App.tsx:86-111`).

### 1.5 🔴 Plan/schedule mismatch renders broken days

`TodayView.tsx:49-61`: `dayType` comes from the AI plan, but `day` (name, exercises) always
comes from hardcoded `getSchedule()`. If the plan says strength on a day `schedule.ts` calls
cardio, you get a strength view with **no exercises**; AI-planned exercises not in the current
A/B variant are silently dropped. This whole seam disappears when the engine becomes the single
source of the day's exercise list — prioritize that over patching.

### 1.6 🟠 Unbounded session reads

`loadAllSessions` fetches **every session ever, every launch**. A year of use ≈ 300+ doc reads
per open (cost + startup latency, forever growing). Fix: `limit(90)`; History paginates with
`startAfter` on scroll. Compute all-time stats from the loaded window or a small aggregate doc.

> **🎓 Backend concept — reads are the currency of Firestore:** you're billed and throttled per
> document read, so "load the whole collection" is an anti-pattern that feels free at N=20 and
> hurts at N=500. Cursor pagination (`orderBy` + `startAfter`) is the standard fix. An
> **aggregate doc** (one document holding `{totalWorkouts, prCount, streak}` updated on each
> save) is the standard trick to keep "all-time stats" O(1) instead of O(all sessions).

### 1.7 🟠 No Firestore offline persistence

It's a gym app packaged as a PWA — basements with no signal are the primary venue. One line:

```ts
initializeFirestore(app, { localCache: persistentLocalCache() })
```

Reads serve from cache instantly; writes queue and sync on reconnect. Pairs with 1.6 (cache
makes limited reads cheap too). Add a small "saved locally, will sync" state to the complete
button instead of hanging `await` forever while offline.

### 1.8 🟠 Failures are invisible

Plan generation failure → `console.error` only (`App.tsx:57-58`). `saveSession` unhandled
rejection leaves the button on "Saving…". Add a minimal toast/banner component (one, global)
with retry for plan generation. With the engine as fallback, plan errors stop being user-facing
at all.

### 1.9 🟡 Smaller correctness items

- **A/B variant flips at New Year** (`schedule.ts:58-62`, week-of-year % 2 restarts Jan 1 —
  two identical weeks back to back). Use days-since-fixed-epoch: `Math.floor(d/(7*86400000)) % 2`
  on a Monday-aligned epoch.
- **Midnight rollover:** `TodayView` computes `dow`/`today` at render; an app left open past
  midnight logs to the wrong day. Re-derive on `visibilitychange`.
- **Dead code:** `src/data/tips.ts` (confirmed unused — HANDOFF.md agrees), static `SCHED`
  export snapshots one variant at module load (WeekBar uses it only for rest-day check, but
  it's a trap).
- **`PasswordGate`** is a localStorage flag — fine as a tripwire, but it gates nothing real
  (Firestore rules + Auth are the actual security). Leave it, just don't extend it.
- **Deploy drift:** HANDOFF.md says functions changes are still undeployed
  (`firebase deploy --only functions`). Either deploy or note it — the repo currently doesn't
  match production.

---

## 2. Personal Trainer's Review

The programming is sensible (PPL split, A/B variation, warm-up guidance, goal-based rest). What's
missing is everything that makes training *directed*:

### 2.1 "Beat last time" is the whole game — make it explicit

Previous numbers exist only as gray placeholder text. A trainee should see, per set: what they
did last time, what today's target is, and *why* (engine `reason`). Green flash + subtle
celebration when a set beats last time. See mockup **Screen 1**.

### 2.2 PR detection & e1RM tracking

Compute Epley e1RM per exercise per session: `weight × (1 + reps/30)`. New best → "PR" moment in
the post-workout summary (mockup **Screen 2**) and a badge in History. This costs ~20 lines and
is the single most motivating feature in any lifting app.

### 2.3 Exercise swap (deterministic, zero AI)

"Bench is taken / shoulder hurts today." Swap button on each card → alternatives from
`exercises.ts` with same `movement` + overlapping `muscles`, filtered by user's equipment and
exclusions. The metadata already supports this perfectly. Log under the swapped exercise's id.
Mockup **Screen 1** (swap sheet).

### 2.4 Warm-up sets with actual numbers

The banner says "50% of your working weight" — the app *knows* the working weight. Render it:
"Warm-up: 15 lbs × 8, 25 lbs × 3, then working sets at 35 lbs." Two lines of math.

### 2.5 Deloads & mesocycle awareness

`mesocycleStart` is collected and never used client-side. Engine (§0.3) adds deload every 4th
week + return-from-break. Show "Week 3 of 4 — deload next week" in the Today header.

### 2.6 Cardio is underserved

Only run/elliptical, duration + 3-point feel. Add: walk, bike, row (one enum, trivial);
**distance** field → pace computed and trended in History; progressive target from history
(+10%/week duration, capped, deload week applies). Fixed "2-mile run or 30 min elliptical"
copy becomes the engine's cardio target.

### 2.7 Adherence & bodyweight

- **Streak / consistency:** "3 weeks at 3-for-3" on the Today header and week summary — for a
  personal app, consistency > volume. Data already exists.
- **Bodyweight log:** a weekly one-field prompt (esp. for `loseweight` goal) + trend line in
  History. New tiny Firestore subcollection `users/{uid}/bodyweight/{date}`.

---

## 3. UI/UX Designer's Review

Current state: clean, competent, iOS-native-feeling — and anonymous. It reads as a settings app,
not a training app. Full visual spec in [`UPGRADE_MOCKUPS.html`](UPGRADE_MOCKUPS.html).

### 3.1 Logging flow — cut taps to near zero (Screen 1)

Today: tap weight → type → tap reps → type → maybe rate → find ⏱ → tap. Per set, ~8–10 touches
with a numeric keyboard between you and your workout.

Redesign the set row as a **one-tap confirm**:

- Row shows target pre-filled (from engine/previous): `35 lbs × 10`. One tap on the big **✓**
  logs exactly that, marks the row done, **auto-starts the rest timer**.
- Tap the numbers only when you deviated — steppers (±2.5 lbs / ±1 rep) beside the fields,
  keyboard as last resort.
- Feel becomes three always-visible dots on the logged row (color-filled when picked), not a
  hidden row that appears after fill.
- Set rows advance visually: done rows compress, next set highlighted.

Happy path per set: **one tap**.

### 3.2 Session progress & completion (Screens 1–2)

- Sticky compact header while in a workout: progress ring, "7 of 12 sets", elapsed time,
  running total volume.
- "Complete Workout" enables/highlights when all sets logged (still tappable early —
  confirm "3 sets empty — finish anyway?").
- **Post-workout summary sheet** (Screen 2): duration, total volume, sets, PRs, feel breakdown,
  next-session preview, streak. This is the dopamine payoff and it costs one component — data
  is all in the session object.

### 3.3 Visual identity — pick a side (design tokens in mockup)

Go **dark-first "gym mode"** with one loud accent (spec uses `#C8FF3D` volt on near-black;
light mode stays supported via existing CSS-variable architecture — it's already set up for
this, only the values change):

- **Oversized tabular numerals** for anything you read mid-set (weights, timer, reps):
  `font-variant-numeric: tabular-nums`, 24–40px. Readable at arm's length on a bench.
- **Workout-type color coding**, used *everywhere* (WeekBar dots, day header, history rows,
  charts): push `#FF6B6B` · pull `#4D96FF` · legs `#6BCB77` · cardio `#FFB84D` · rest gray.
  Instantly answers "what day is it" from a glance at the dots.
- Rest timer as a **full-width bottom bar** with a draining progress fill, huge countdown,
  +15s / skip buttons (replaces the floating pill; Screen 1).

### 3.4 History → Progress (Screen 3)

Rename the tab **Progress**. A reverse-chronological accordion answers "what did I do," never
"am I improving":

- **Per-exercise trend**: pick an exercise → e1RM/top-set sparkline (pure SVG polyline, ~40
  lines, no chart library — mockup includes the exact markup pattern).
- **Calendar heatmap** of the last 12 weeks, cells tinted by workout-type color.
- Stat tiles: streak, workouts this month, total volume, PR count.
- Existing detail accordion stays, below the new content, with type-colored left borders.

### 3.5 Week bar upgrades (Screen 1)

- Dots take workout-type colors; completed = filled + ✓, today = ringed, missed past workout
  day = hollow red-tint.
- **Tap a day → bottom sheet preview** of that day's plan (exercises + targets from the plan —
  also resolves HANDOFF.md's "surface all 7 days' AI notes" idea).

### 3.6 Small but felt

- `type="number"` spinners off; `inputMode="decimal"` already right. Select-all on focus.
- 44px minimum touch targets (feel buttons and ⋮ are currently below).
- `aria-pressed` on all toggle buttons; timer announces via `aria-live="polite"`.
- Haptics via `navigator.vibrate` where available (no-op on iOS, fine).
- Empty states with the day's plan preview instead of "no workouts logged yet" alone.
- Reduced-motion media query around the celebration animation.

---

## 4. Suggested Implementation Order

| Phase | Items | Notes |
|---|---|---|
| **1 — Correctness** | 1.1 timezone, 1.2 hash, 1.3 timer, 1.4 feel-wipe, 1.9 variant/midnight | Small diffs, do first, each independently shippable |
| **2 — Engine** | §0 `src/engine/` + unit tests; wire as plan source; demote Cloud Function to notes-only | The strategic core. **User writes `progressExercise` first as a learning exercise** |
| **3 — Logging UX** | §3.1 set rows, §3.2 progress header + summary sheet, §3.3 tokens + timer bar | Follow `UPGRADE_MOCKUPS.html` Screens 1–2 |
| **4 — Progress tab** | §3.4 sparklines/heatmap/tiles, §2.2 PRs, 1.6 pagination | Screen 3 |
| **5 — Trainer extras** | §2.3 swap, §2.4 warm-up numbers, §2.6 cardio, §2.7 streak + bodyweight, §3.5 week-bar sheet | Independent, any order |
| **∞ — Hygiene** | 1.7 offline, 1.8 toasts, delete `tips.ts`, deploy functions | 1.7/1.8 can ride along with any phase |

**Hard rules carried over from TODO.md (still binding):** never drop/rename existing Firestore
fields; plain language in all user-facing text; no free-text user input into AI prompts;
`exercises.ts` metadata never sent to the AI.
