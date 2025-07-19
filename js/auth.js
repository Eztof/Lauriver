import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc, setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const domain = "@lauriver.app";

// Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const usern = loginForm.username.value.trim();
    const pw    = loginForm.password.value;
    const remember = document.getElementById('remember').checked;

    console.log("[Auth] Login attempt for:", usern);
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);

    try {
      await signInWithEmailAndPassword(auth, usern + domain, pw);
      console.log("[Auth] Login successful");
      location.replace('index.html');
    } catch (err) {
      console.error("[Auth] Login error:", err);
      alert("Login fehlgeschlagen: " + err.message);
    }
  });
}

// Registrierung
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const usern = signupForm.username.value.trim();
    const pw    = signupForm.password.value;

    console.log("[Auth] Signup attempt for:", usern);
    try {
      const cred = await createUserWithEmailAndPassword(auth, usern + domain, pw);
      console.log("[Auth] Signup successful, uid:", cred.user.uid);
      // Profil in Firestore anlegen
      await setDoc(doc(db, "users", cred.user.uid), {
        username: usern,
        createdAt: Date.now(),
        settings: { darkMode: false }
      });
      console.log("[Firestore] User profile created");
      alert("Registrierung erfolgreich!");
      location.replace('login.html');
    } catch (err) {
      console.error("[Auth] Signup error:", err);
      alert("Registrierung fehlgeschlagen: " + err.message);
    }
  });
}

// Logout
const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    console.log("[Auth] Logged out");
    location.replace('login.html');
  });
}
