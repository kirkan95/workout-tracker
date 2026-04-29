import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCDN0YqFlg59E2nAkeF2Blc3o30PLRGBok',
  authDomain: 'workout-tracker-3f231.firebaseapp.com',
  projectId: 'workout-tracker-3f231',
  storageBucket: 'workout-tracker-3f231.firebasestorage.app',
  messagingSenderId: '602634625114',
  appId: '1:602634625114:web:41b57f69e1210e0f4cf863',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
