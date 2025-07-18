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

// 1) Gemeinsame Navigation & Logout init
initNav();
initLogout();

// 2) Firebase‑Config initialisiert in common.js
const db = getFirestore();

// 3) Wenn bereits eingeloggt und auf login.html → weiter zu Dashboard
onAuthStateChanged(auth, user => {
  const path = window.location.pathname;
  if (user && path.endsWith("login.html")) {
    window.location.href = "dashboard.html";
  }
});

// 4) Login-Form-Handler (falls vorhanden)
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const pw       = document.getElementById("login-password").value;
    const remember = document.getElementById("remember-me").checked;
    if (!username) return;

    // Nutzername → E‑Mail Lookup in Firestore
    const q     = query(collection(db, "users"), where("username", "==", username));
    const snaps = await getDocs(q);
    if (snaps.empty) {
      alert("Benutzername nicht gefunden.");
      return;
    }
    const { email } = snaps.docs[0].data();

    // Persistence setzen
    await setPersistence(auth,
      remember
        ? browserLocalPersistence
        : browserSessionPersistence
    );

    // Login
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      // Weiterleitung übernimmt common.js → onAuthStateChanged
    } catch (err) {
      console.error(err);
      alert("Anmeldefehler: " + err.message);
    }
  });
}

// 5) Register-Form-Handler (falls vorhanden)
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("reg-username").value.trim();
    const pw       = document.getElementById("reg-password").value;
    if (!username) return;

    // Dummy‑E‑Mail intern für Firebase Auth
    const email = `${username}@users.lauriver.app`;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      // displayName setzen
      await updateProfile(cred.user, { displayName: username });
      // User‑Doc in Firestore anlegen
      await setDoc(doc(db, "users", cred.user.uid), {
        username,
        email,
        settings: { dark: false },
        created: new Date()
      });
      // Nach Registrierung → Login
      window.location.href = "login.html";
    } catch (err) {
      console.error(err);
      alert("Registrierungsfehler: " + err.message);
    }
  });
}
