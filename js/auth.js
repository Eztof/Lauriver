import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const domain = "@lauriver.app"; // künstliche Domain für Username‑Mapping

// Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = loginForm.username.value.trim();
    const pw = loginForm.password.value;
    const remember = document.getElementById('remember').checked;

    // Persistence setzen
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence
    );

    // Anmelden mit username@lauriver.app
    const email = username + domain;
    await signInWithEmailAndPassword(auth, email, pw);
    location.replace('index.html');
  });
}

// Registrierung
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = signupForm.username.value.trim();
    const pw = signupForm.password.value;

    // Erstelle Nutzer mit Email = username@lauriver.app
    const email = username + domain;
    const cred = await createUserWithEmailAndPassword(auth, email, pw);

    // Speichere zusätzlich das echte Profil in Firestore
    await setDoc(
      doc(db, "users", cred.user.uid),
      { username: username, createdAt: Date.now() }
    );

    alert('Registrierung erfolgreich! Bitte einloggen.');
    location.replace('login.html');
  });
}

// Logout (unverändert)
const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    location.replace('login.html');
  });
}
