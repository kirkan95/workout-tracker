import { useState, useEffect } from 'react'
import { User, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'

// ── TYPESCRIPT CONCEPT: Return type annotation ────────────────────────────────
// The ": { user: User | null; ... }" after the function signature explicitly
// declares what this hook returns. TypeScript infers this automatically, but
// writing it out makes the contract visible to callers.
export function useAuth() {
  // ── TYPESCRIPT CONCEPT: Generic useState<T> ───────────────────────────────
  // useState<User | null> tells React (and TypeScript) that this state holds
  // either a Firebase User object or null. Without the generic, TS would infer
  // "null" only, and setting it to a User later would be a type error.
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe  // cleanup: unsubscribes when the component unmounts
  }, [])

  const signIn = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const signOutUser = async () => {
    await signOut(auth)
  }

  return { user, loading, signIn, signOutUser }
}
