import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfjKXQW5beVrKuing5CHw4umqo9y71B7E",
  authDomain: "noteapp-adamikoo.firebaseapp.com",
  projectId: "noteapp-adamikoo",
  storageBucket: "noteapp-adamikoo.firebasestorage.app",
  messagingSenderId: "428446575562",
  appId: "1:428446575562:web:f5aebfc87497a22e01fd33",
  measurementId: "G-G8CWS1PHYE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export auth and db
export const auth = getAuth(app);
export const db = getFirestore(app);