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

// 1) Navigation & Logout
initNav();
initLogout();

// 2) Redirect, falls schon eingeloggt
onAuthStateChanged(auth, user => {
  if (user && window.location.pathname.endsWith("login.html")) {
    window.location.href = "dashboard.html";
  }
});

// 3) Elemente ermitteln (können in beiden Dateien existieren oder nicht)
const loginForm    = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const showRegister = document.getElementById("show-register");
const showLogin    = document.getElementById("show-login");
const db           = getFirestore();

// 4) Toggle Login ↔ Register (auf login.html)
if (showRegister && loginForm && registerForm) {
  showRegister.addEventListener("click", e => {
    e.preventDefault();
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
  });
}
if (showLogin && loginForm && registerForm) {
  showLogin.addEventListener("click", e => {
    e.preventDefault();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  });
}

// 5) Registrierung (nur auf register.html)
if (registerForm) {
  registerForm.addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("reg-username").value.trim();
    const pw       = document.getElementById("reg-password").value;
    if (!username) return;
    // Dummy-Mail intern
    const email = `${username}@users.lauriver.app`;
    const cred  = await createUserWithEmailAndPassword(auth, email, pw);
    await updateProfile(cred.user, { displayName: username });
    await setDoc(doc(db, "users", cred.user.uid), {
      username,
      email,
      settings: { dark: false },
      created: new Date()
    });
    // kein Alert per Wunsch
    // nach Registrierung direkt zum Login
    window.location.href = "login.html";
  });
}

// 6) Login (nur auf login.html)
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const pw       = document.getElementById("login-password").value;
    const remember = document.getElementById("remember-me").checked;
    if (!username) return;
    // Nutzer‑Lookup Firestore
    const q     = query(collection(db, "users"), where("username", "==", username));
    const snaps = await getDocs(q);
    if (snaps.empty) return;
    const { email } = snaps.docs[0].data();
    await setPersistence(auth,
      remember ? browserLocalPersistence
               : browserSessionPersistence
    );
    await signInWithEmailAndPassword(auth, email, pw);
    // bei Erfolg geht der Auth‑State‑Listener in common.js weiter
  });
}
