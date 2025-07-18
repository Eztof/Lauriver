// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, setPersistence,
  browserLocalPersistence, browserSessionPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, query, where, getDocs, collection } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { initNav, initLogout, auth } from "./common.js";

// Firebase already initialized in common.js
const db = getFirestore();

// Guard
initNav();
initLogout();
onAuthStateChanged(auth, user => {
  if (user) location.href = "dashboard.html";
});

// DOM
const loginForm    = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

// Toggle
document.getElementById("show-register").onclick = e => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
};
document.getElementById("show-login").onclick = e => {
  e.preventDefault();
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
};

// Register
registerForm.addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("reg-username").value.trim();
  const pw       = document.getElementById("reg-password").value;
  if (!username) return;
  const email = `${username}@users.lauriver.app`;
  const cred  = await createUserWithEmailAndPassword(auth, email, pw);
  await updateProfile(cred.user, { displayName: username });
  await setDoc(doc(db, "users", cred.user.uid), {
    username, email, settings:{dark:false}, created: new Date()
  });
  // no alert per Wunsch
});

// Login
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const pw       = document.getElementById("login-password").value;
  const remember = document.getElementById("remember-me").checked;
  if (!username) return;
  const q     = query(collection(db,"users"), where("username","==",username));
  const snaps = await getDocs(q);
  if (snaps.empty) return;
  const { email } = snaps.docs[0].data();
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  await signInWithEmailAndPassword(auth, email, pw);
});
