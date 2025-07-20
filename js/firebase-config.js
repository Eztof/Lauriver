// Modular Firebase v9+ Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0WC5gDtcq4znUZxqvGn5j1BPodnsgg9E",
  authDomain: "lauriver-31a6f.firebaseapp.com",
  projectId: "lauriver-31a6f",
  storageBucket: "lauriver-31a6f.firebasestorage.app",
  messagingSenderId: "508140835438",
  appId: "1:508140835438:web:4326ed6b40c01037e64c7f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exports
export const auth      = getAuth(app);
export const firestore = getFirestore(app);
