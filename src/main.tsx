import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'

const updateSW = registerSW({
  onRegisteredSW(_url, registration) {
    // iOS PWAs only recheck the SW on relaunch by default — poll hourly so
    // updates land while the app stays open too.
    registration && setInterval(() => registration.update(), 60 * 60 * 1000)
  },
  onNeedRefresh() {
    updateSW(true)
  },
})

const setVh = () => {
  const h = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${h}px`)
}
window.addEventListener('resize', setVh)
window.addEventListener('orientationchange', () => setTimeout(setVh, 200))
window.visualViewport?.addEventListener('resize', setVh)
// iOS reports a stale viewport height at module-eval time (before the browser
// chrome/safe areas settle), so the app rendered short until a resize — e.g.
// rotating the device — corrected it. Re-measure once things have painted and
// on the load/pageshow lifecycle so the first render is already full-height.
setVh()
requestAnimationFrame(setVh)
window.addEventListener('load', setVh)
window.addEventListener('pageshow', setVh)
setTimeout(setVh, 300)

// ── TYPESCRIPT CONCEPT: Non-null assertion (!) ────────────────────────────────
// getElementById returns "HTMLElement | null" because the element might not exist.
// The "!" tells TypeScript: "I know this won't be null at runtime — trust me."
// Use sparingly; prefer optional chaining (?.) when you're not sure.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
