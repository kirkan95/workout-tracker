import { useState, useEffect, useRef } from 'react'

function playAlert() {
  try {
    const ctx = new AudioContext()
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

export function useRestTimer(defaultSeconds: number, silent: boolean) {
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(defaultSeconds)
  const [configured, setConfigured] = useState(defaultSeconds)
  const configuredRef = useRef(defaultSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      return
    }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false)
          if (!silent) playAlert()
          return configuredRef.current
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
  }, [running, silent])

  const start = () => {
    setSeconds(configuredRef.current)
    setRunning(true)
  }

  const stop = () => setRunning(false)

  const adjust = (delta: number) => {
    const next = Math.max(10, configuredRef.current + delta)
    configuredRef.current = next
    setConfigured(next)
    setSeconds((s) => Math.max(1, s + delta))
  }

  const setAll = (secs: number) => {
    configuredRef.current = secs
    setConfigured(secs)
    if (!running) setSeconds(secs)
  }

  return { running, seconds, configured, start, stop, adjust, setAll }
}
