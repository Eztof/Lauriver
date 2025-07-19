import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0WC5gDtcq4znUZxqvGn5j1BPodnsgg9E",
  authDomain: "lauriver-31a6f.firebaseapp.com",
  databaseURL: "https://lauriver-31a6f-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "lauriver-31a6f",
  storageBucket: "lauriver-31a6f.appspot.com",
  messagingSenderId: "508140835438",
  appId: "1:508140835438:web:4326ed6b40c01037e64c7f"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const rtdb = getDatabase(app);

// Auth‑Status & Redirect‑Logik
onAuthStateChanged(auth, user => {
  const page = location.pathname.split("/").pop();
  const publicPages = ["login.html", "signup.html"];
  if (!user && !publicPages.includes(page)) {
    console.log("[Firebase] Kein Nutzer eingeloggt – leite zu login.html weiter");
    location.replace("login.html");
  }
  if (user && page === "signup.html") {
    console.log("[Firebase] Nutzer bereits eingeloggt – leite zu index.html weiter");
    location.replace("index.html");
  }
});
