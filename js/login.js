// js/login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { initNav, initLogout, auth } from "./common.js";

// 1) Navigation & Logout initialisieren
initNav();
initLogout();

// 2) Firebase wurde in common.js initialisiert
const db = getFirestore();

// 3) Redirect, falls schon eingeloggt und wir auf login.html sind
onAuthStateChanged(auth, user => {
  const path = window.location.pathname;
  if (user && path.endsWith("login.html")) {
    window.location.href = "dashboard.html";
  }
});

// 4) DOM‑Elemente (existieren je nach Seite)
const loginForm    = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const showRegister = document.getElementById("show-register");
const showLogin    = document.getElementById("show-login");

// 5) Login ↔ Register Toggle (nur auf login.html, wo beide Forms vorhanden sind)
if (loginForm && registerForm && showRegister && showLogin) {
  // Klick auf "Registrieren" zeigt das Registrierungsformular
  showRegister.addEventListener("click", e => {
    e.preventDefault();
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
  });
  // Klick auf "Anmelden" im Registrierungsformular
  showLogin.addEventListener("click", e => {
    e.preventDefault();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  });
}

// 6) Registrierung (nur auf register.html)
if (registerForm) {
  registerForm.addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("reg-username").value.trim();
    const pw       = document.getElementById("reg-password").value;
    if (!username) return;
    // Dummy‑E‑Mail für Firebase Auth
    const email = `${username}@users.lauriver.app`;
    const cred  = await createUserWithEmailAndPassword(auth, email, pw);
    await updateProfile(cred.user, { displayName: username });
    await setDoc(doc(db, "users", cred.user.uid), {
      username,
      email,
      settings: { dark: false },
      created: new Date()
    });
    // Nach Registrierung zurück zum Login
    window.location.href = "login.html";
  });
}

// 7) Login (nur auf login.html)
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const pw       = document.getElementById("login-password").value;
    const remember = document.getElementById("remember-me").checked;
    if (!username) return;
    // Firestore‑Lookup nach E‑Mail
    const q     = query(collection(db, "users"), where("username", "==", username));
    const snaps = await getDocs(q);
    if (snaps.empty) return;
    const { email } = snaps.docs[0].data();
    await setPersistence(auth,
      remember
        ? browserLocalPersistence
        : browserSessionPersistence
    );
    await signInWithEmailAndPassword(auth, email, pw);
    // onAuthStateChanged (common.js) kümmert sich um Weiterleitung
  });
}
