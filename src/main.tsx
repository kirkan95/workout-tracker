import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const setVh = () => {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}
window.addEventListener('resize', setVh)
setVh()

// ── TYPESCRIPT CONCEPT: Non-null assertion (!) ────────────────────────────────
// getElementById returns "HTMLElement | null" because the element might not exist.
// The "!" tells TypeScript: "I know this won't be null at runtime — trust me."
// Use sparingly; prefer optional chaining (?.) when you're not sure.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
