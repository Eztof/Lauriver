// 1) Firebase-SDK importieren (Auth + Firestore)
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
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
const db = getFirestore(app);  // Firestore-Instanz

// 3) Helper: aus Benutzername eine (künstliche) E-Mail machen
function emailFromUsername(username) {
  return `${username}@lauriver.app`;
}

// 4) Firestore: Nutzungsdaten speichern
async function logUsage(eventType, details = {}) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await addDoc(collection(db, "usage_logs"), {
      uid: user.uid,
      event: eventType,
      details,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Fehler beim Speichern der Nutzungsdaten:", err);
  }
}

// 5) Alle View-Abschnitte & Buttons holen
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

// 6) View-Wechsel
function showView(name) {
  Object.values(sections).forEach(s => s.classList.add("hidden"));
  sections[name].classList.remove("hidden");
  // Nutzungsdaten: Seitenwechsel
  logUsage("view_change", { view: name });
}

// 7) Auth-Status überwachen
onAuthStateChanged(auth, user => {
  if (user) {
    header.classList.remove("hidden");
    showView("home");
    logUsage("auto_login");  // wenn z.B. Persistenz greift
  } else {
    header.classList.add("hidden");
    showView("login");
  }
});

// 8) Login-Form
document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  const u = document.getElementById("login-username").value.trim();
  const p = document.getElementById("login-password").value;
  const remember = document.getElementById("remember-device").checked;
  const persistence = remember ? browserLocalPersistence : browserSessionPersistence;

  setPersistence(auth, persistence)
    .then(() => signInWithEmailAndPassword(auth, emailFromUsername(u), p))
    .then(() => {
      logUsage("login", { method: "password", remember });
    })
    .catch(err => alert("Fehler beim Einloggen: " + err.message));
});

// 9) Registrieren-Form
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
        .then(() => {
          logUsage("register", { username: u });
        })
    )
    .catch(err => alert("Fehler bei der Registrierung: " + err.message));
});

// 10) Links zwischen Login/Registrierung
document.getElementById("to-register").addEventListener("click", e => {
  e.preventDefault();
  showView("register");
});
document.getElementById("to-login").addEventListener("click", e => {
  e.preventDefault();
  showView("login");
});

// 11) Logout-Button
logoutBtn.addEventListener("click", () => {
  logUsage("logout").then(() => {
    signOut(auth);
  });
});

// 12) Navigation Startseite → Platzhalter
document.getElementById("nav-calendar").addEventListener("click", () => showView("calendar"));
document.getElementById("nav-packlist").addEventListener("click", () => showView("packlist"));
document.getElementById("nav-timeline").addEventListener("click", () => showView("timeline"));

// 13) Zurück-Buttons in den Untermenüs
document.querySelectorAll(".back-btn").forEach(btn =>
  btn.addEventListener("click", () => showView("home"))
);
