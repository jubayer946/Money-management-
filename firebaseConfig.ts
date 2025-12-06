import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Configuration from your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyD-48nBH2MinrPfHtfOz0CQKBsgo47IwG0",
  authDomain: "money-2-f27bb.firebaseapp.com",
  // Inferred database URL for Realtime Database based on project ID
  databaseURL: "https://money-2-f27bb-default-rtdb.firebaseio.com", 
  projectId: "money-2-f27bb",
  storageBucket: "money-2-f27bb.firebasestorage.app",
  messagingSenderId: "449712413248",
  appId: "1:449712413248:web:99cb15781c58c30d201da5"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);