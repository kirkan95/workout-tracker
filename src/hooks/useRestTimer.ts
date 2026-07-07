import { useState, useEffect, useRef, useCallback } from 'react'

let sharedCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (!sharedCtx) {
    try { sharedCtx = new AudioContext() } catch { return null }
  }
  return sharedCtx
}

function unlockCtx() {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()
}

function playAlert() {
  try {
    const ctx = getCtx()
    if (!ctx || ctx.state === 'suspended') return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)
  } catch {}
}

// ── TYPESCRIPT CONCEPT: why timestamp math instead of a decrementing counter ──
// iOS suspends JS timers (setInterval) when the screen locks or the PWA is
// backgrounded — exactly when someone is resting between sets. A counter that
// decrements once per tick just stops. Instead we store the wall-clock time
// the rest period ENDS (`endsAt`) and always compute `remaining` as the
// difference from `Date.now()`. Whether the interval ticked every second or
// got frozen for two minutes, the math is correct the instant it runs again —
// see UPGRADE.md §1.3.
export function useRestTimer(defaultSeconds: number, silent: boolean) {
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(defaultSeconds)
  const [configured, setConfigured] = useState(defaultSeconds)
  const configuredRef = useRef(defaultSeconds)
  const endsAtRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(() => {
    if (endsAtRef.current == null) return
    const remaining = Math.ceil((endsAtRef.current - Date.now()) / 1000)
    if (remaining <= 0) {
      setRunning(false)
      setSeconds(configuredRef.current)
      endsAtRef.current = null
      if (!silent) playAlert()
    } else {
      setSeconds(remaining)
    }
  }, [silent])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      return
    }
    intervalRef.current = setInterval(tick, 1000)
    const onVisible = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [running, tick])

  const start = () => {
    if (!silent) unlockCtx()
    endsAtRef.current = Date.now() + configuredRef.current * 1000
    setSeconds(configuredRef.current)
    setRunning(true)
  }

  const stop = () => {
    setRunning(false)
    endsAtRef.current = null
  }

  const adjust = (delta: number) => {
    const next = Math.max(5, configuredRef.current + delta)
    configuredRef.current = next
    setConfigured(next)
    if (running && endsAtRef.current != null) {
      endsAtRef.current += delta * 1000
      setSeconds(Math.max(1, Math.ceil((endsAtRef.current - Date.now()) / 1000)))
    } else {
      setSeconds(next)
    }
  }

  const setAll = (secs: number) => {
    configuredRef.current = secs
    setConfigured(secs)
    if (!running) setSeconds(secs)
  }

  return { running, seconds, configured, start, stop, adjust, setAll }
}
