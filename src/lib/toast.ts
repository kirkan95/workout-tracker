// Minimal pub-sub so any component can surface an error without prop-drilling
// a callback down through the tree or standing up a context provider just
// for this. One listener at a time is all a single-screen PWA needs.
type Listener = (message: string) => void

let listener: Listener | null = null

export function showToast(message: string) {
  listener?.(message)
}

export function setToastListener(fn: Listener | null) {
  listener = fn
}
