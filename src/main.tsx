import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// ── TYPESCRIPT CONCEPT: Non-null assertion (!) ────────────────────────────────
// getElementById returns "HTMLElement | null" because the element might not exist.
// The "!" tells TypeScript: "I know this won't be null at runtime — trust me."
// Use sparingly; prefer optional chaining (?.) when you're not sure.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
