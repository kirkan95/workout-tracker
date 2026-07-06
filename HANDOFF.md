# Handoff

## Project Goal
AI-powered personal trainer PWA (React + Vite + TypeScript + Firebase). Gemini generates a weekly workout plan; users log workouts daily.

## Stack
- Frontend: React + Vite + TypeScript, Firebase Auth/Firestore
- Backend: Firebase Cloud Functions (Node/TS)
- AI: Gemini 2.5 Flash via `@google/generative-ai`
- Deploy: GitHub Actions (`.github/workflows/deploy.yml`) → GitHub Pages, on push to `main`

## Current State
All V2 features complete, build green. This session fixed a PWA update bug, confirmed working on-device by user. No known open bugs.

## This Session's Change: PWA not updating on phone

**Symptom:** pushed changes appeared on localhost/GH Pages but not on the installed iOS PWA.

**Root cause:** the earlier `skipWaiting`/`clientsClaim` fix (commit `6304104`) only made a *new* service worker activate immediately — it never reloaded the already-open page, so old JS kept running in memory. The auto-injected `registerSW.js` (`vite-plugin-pwa` default) was just `navigator.serviceWorker.register(...)` with no update-detection or reload logic.

**Fix** (commit `863309d`):
- `vite.config.ts` — added `injectRegister: false` to stop the bare auto-injected script
- `src/vite-env.d.ts` — added `/// <reference types="vite-plugin-pwa/client" />` for the virtual module types
- `src/main.tsx:1-15` — manually registers SW via `virtual:pwa-register`: polls `registration.update()` hourly (iOS PWAs otherwise only check on relaunch), and calls `updateSW(true)` in `onNeedRefresh` to force-reload the instant a new SW takes over

**Note for next agent:** if a similar "changes not showing up on phone" report recurs, this is likely NOT the same bug (this fix is confirmed working) — check GH Pages Action run succeeded first (`.github/workflows/deploy.yml`), then check for HTTP cache-control delay on `sw.js`/assets from GH Pages CDN (~10 min) before assuming the reload logic itself is broken again.

## Architecture Notes
- Plan generation: `functions/src/index.ts` → `generateWeeklyPlan` (onCall) → `assemblePrompt` → `callAI` → `transformAIResponse` → Firestore
- Prompt built from `functions/trainer/TRAINER.md` + role-specific trainer files + session history + user settings
- Plan cached by week; regenerated when settings hash (goal+equipment+exclusions) changes
- `exercises.ts` is client-side only — never sent to AI
- Weekly A/B exercise rotation: `src/data/schedule.ts`, `getSchedule(d?: Date)` picks variant by week number

## Next Steps
- Deploy updated Cloud Functions: `firebase deploy --only functions` (still carrying un-deployed changes from a prior session: day notes in Gemini schema + prompt)
- Consider: surface all 7 days' AI notes in a "week overview" screen (currently only today's note shown in TodayView)
- Consider: `src/data/tips.ts` (`TIPS`) is unused since a prior session's fix — can be deleted
- No outstanding bugs or blocked items
