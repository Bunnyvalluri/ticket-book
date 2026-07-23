import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDfxusLLSGP3tH-WRrOgP95xBQxNpUS6hU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ticket-eeb93.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ticket-eeb93",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ticket-eeb93.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "881473553605",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:881473553605:web:f6a4d52916cb5fefd55cac",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PSXEL073SR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
