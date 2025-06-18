// Firebase Configuration Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getDatabase, ref, push, onValue, remove, set, get, query, orderByChild, update
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

console.log('📦 Firebase imports loaded successfully');

// Firebase konfiguráció – cseréld ki a saját adataidra!
const firebaseConfig = {
  apiKey: "AIzaSyBLrDOTSC_bA1mxQpaIfyAz-Eyan26TVT0",
  authDomain: "leads-tracker-app-78b83.firebaseapp.com",
  databaseURL: "https://leads-tracker-app-78b83-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "leads-tracker-app-78b83",
  storageBucket: "leads-tracker-app-78b83.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "1:907489703312:web:c4138807d8a7aa96512f15"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

console.log('🔧 Firebase initialized successfully');

// Export the configured instances
export { db, auth, ref, push, onValue, remove, set, get, query, orderByChild, update, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut }; 