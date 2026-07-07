import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCDN0YqFlg59E2nAkeF2Blc3o30PLRGBok',
  authDomain: 'workout-tracker-3f231.firebaseapp.com',
  projectId: 'workout-tracker-3f231',
  storageBucket: 'workout-tracker-3f231.firebasestorage.app',
  messagingSenderId: '602634625114',
  appId: '1:602634625114:web:41b57f69e1210e0f4cf863',
}

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

// A gym app that only works with signal is a bad gym app — basements and
// crowded gyms are exactly where PWAs lose connectivity. Persistent local
// cache means reads serve instantly from disk and writes (saveSession,
// saveSettings) queue locally and sync automatically on reconnect, instead
// of just hanging or failing. Single-tab manager matches how this app is
// actually used (one installed PWA instance, not multiple open tabs).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
})
