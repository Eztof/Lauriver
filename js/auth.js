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

// LOGIN
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const username = loginForm.username.value.trim();
    const password = loginForm.password.value;
    const remember = document.getElementById("remember").checked;
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    console.log("[Auth] Login attempt for:", username);
    try {
      await signInWithEmailAndPassword(auth, username + domain, password);
      console.log("[Auth] Login successful");
      location.replace("index.html");
    } catch (err) {
      console.error("[Auth] Login error code:", err.code);
      console.error("[Auth] Login error message:", err.message);
      alert(`Login fehlgeschlagen (${err.code}):\n${err.message}`);
    }
  });
}

// SIGNUP
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async e => {
    e.preventDefault();
    const username = signupForm.username.value.trim();
    const password = signupForm.password.value;
    console.log("[Auth] Signup attempt for:", username);
    try {
      const cred = await createUserWithEmailAndPassword(auth, username + domain, password);
      console.log("[Auth] Signup successful, uid:", cred.user.uid);
      await setDoc(doc(db, "users", cred.user.uid), {
        username,
        createdAt: Date.now(),
        settings: { darkMode: false }
      });
      console.log("[Firestore] User profile created");
      alert("Registrierung erfolgreich!");
      location.replace("login.html");
    } catch (err) {
      console.error("[Auth] Signup error code:", err.code);
      console.error("[Auth] Signup error message:", err.message);
      alert(`Registrierung fehlgeschlagen (${err.code}):\n${err.message}`);
    }
  });
}

// LOGOUT
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    console.log("[Auth] Logged out");
    location.replace("login.html");
  });
}
