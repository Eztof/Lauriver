// 1) Firebase‑SDK importieren
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// 2) Deine Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyA0WC5gDtcq4znUZxqvGn5j1BPodnsgg9E",
  authDomain: "lauriver-31a6f.firebaseapp.com",
  databaseURL: "https://lauriver-31a6f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lauriver-31a6f",
  storageBucket: "lauriver-31a6f.firebasestorage.app",
  messagingSenderId: "508140835438",
  appId: "1:508140835438:web:4326ed6b40c01037e64c7f"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 3) Helper: aus Benutzername eine (künstliche) E‑Mail machen
function emailFromUsername(username) {
  return `${username}@lauriver.app`;
}

// 4) Alle View‑Abschnitte & Buttons holen
const sections = {
  login:      document.getElementById("login-section"),
  register:   document.getElementById("register-section"),
  home:       document.getElementById("home-section"),
  calendar:   document.getElementById("calendar-section"),
  packlist:   document.getElementById("packlist-section"),
  timeline:   document.getElementById("timeline-section")
};
const header      = document.getElementById("main-header");
const logoutBtn   = document.getElementById("logout-btn");

// 5) View‑Wechsel
function showView(name) {
  Object.values(sections).forEach(s => s.classList.add("hidden"));
  sections[name].classList.remove("hidden");
}

// 6) Auth‑Status überwachen
onAuthStateChanged(auth, user => {
  if (user) {
    header.classList.remove("hidden");
    showView("home");
  } else {
    header.classList.add("hidden");
    showView("login");
  }
});

// 7) Login‑Form
document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  const u = document.getElementById("login-username").value.trim();
  const p = document.getElementById("login-password").value;
  const remember = document.getElementById("remember-device").checked;
  const persistence = remember ? browserLocalPersistence : browserSessionPersistence;

  setPersistence(auth, persistence)
    .then(() => signInWithEmailAndPassword(auth, emailFromUsername(u), p))
    .catch(err => alert("Fehler beim Einloggen: " + err.message));
});

// 8) Registrieren‑Form
document.getElementById("register-form").addEventListener("submit", e => {
  e.preventDefault();
  const u  = document.getElementById("register-username").value.trim();
  const p1 = document.getElementById("register-password").value;
  const p2 = document.getElementById("register-password-confirm").value;
  if (p1 !== p2) {
    alert("Die Passwörter stimmen nicht überein.");
    return;
  }

  createUserWithEmailAndPassword(auth, emailFromUsername(u), p1)
    .then(userCred =>
      updateProfile(userCred.user, { displayName: u })
    )
    .catch(err => alert("Fehler bei der Registrierung: " + err.message));
});

// 9) Links zwischen Login/Registrierung
document.getElementById("to-register").addEventListener("click", e => {
  e.preventDefault();
  showView("register");
});
document.getElementById("to-login").addEventListener("click", e => {
  e.preventDefault();
  showView("login");
});

// 10) Logout‑Button
logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// 11) Navigation Startseite → Platzhalter
document.getElementById("nav-calendar").addEventListener("click", () => showView("calendar"));
document.getElementById("nav-packlist").addEventListener("click", () => showView("packlist"));
document.getElementById("nav-timeline").addEventListener("click", () => showView("timeline"));

// 12) Zurück‑Buttons in den Untermenüs
document.querySelectorAll(".back-btn").forEach(btn =>
  btn.addEventListener("click", () => showView("home"))
);
