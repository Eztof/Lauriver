// common.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase‑Config aus der Console
const firebaseConfig = {
  apiKey:    "AIzaSyA0WC5gDtcq4znUZxqvGn5j1BPodnsgg9E",
  authDomain:"lauriver-31a6f.firebaseapp.com",
  projectId: "lauriver-31a6f",
  storageBucket:"lauriver-31a6f.appspot.com",
  messagingSenderId:"508140835438",
  appId:     "1:508140835438:web:4326ed6b40c01037e64c7f"
};

initializeApp(firebaseConfig);
export const auth = getAuth();

// Drawer Toggle
export function initNav() {
  const btn  = document.getElementById("btn-menu");
  const nav  = document.getElementById("drawer");
  if (btn && nav) btn.addEventListener("click", ()=> nav.classList.toggle("hidden"));
}

// Auth Guard with redirect
export function initAuthGuard(redirect="login.html") {
  onAuthStateChanged(auth, user => {
    if (!user) location.href = redirect;
  });
}

// Logout button
export function initLogout() {
  const btn = document.getElementById("btn-logout");
  if (btn) btn.addEventListener("click", ()=> signOut(auth));
}
