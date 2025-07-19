import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0WC5gDtcq4znUZxqvGn5j1BPodnsgg9E",
  authDomain: "lauriver-31a6f.firebaseapp.com",
  projectId: "lauriver-31a6f",
  storageBucket: "lauriver-31a6f.firebasestorage.app",
  messagingSenderId: "508140835438",
  appId: "1:508140835438:web:4326ed6b40c01037e64c7f"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Automatische Weiterleitung: nur schützen, wenn echte App‑Seiten
onAuthStateChanged(auth, user => {
  const path = location.pathname.split("/").pop();
  const publicPages = ["login.html", "signup.html"];
  const isPublic = publicPages.includes(path);
  if (!user && !isPublic) {
    // Nicht eingeloggt und nicht auf Public-Seite → Login
    location.replace("login.html");
  }
  if (user && path === "signup.html") {
    // Bereits eingeloggt, aber auf Signup → Startseite
    location.replace("index.html");
  }
});
