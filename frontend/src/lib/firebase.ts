import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCdN1zEjrQyg37RkLRyC9k602dCv6OWJLc",
  authDomain: "sports-card-a1d20.firebaseapp.com",
  projectId: "sports-card-a1d20",
  storageBucket: "sports-card-a1d20.firebasestorage.app",
  messagingSenderId: "41212439209",
  appId: "1:41212439209:web:14b0f561c31e4a45ad57b8",
  measurementId: "G-SGQ0EKYRHJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
