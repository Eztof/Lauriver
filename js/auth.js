// Imports from your config and Firebase SDK
import { auth, firestore } from "./firebase-config.js";
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Elements
const regSection   = document.getElementById('register-section');
const loginSection = document.getElementById('login-section');
const dashSection  = document.getElementById('dashboard');
const formRegister = document.getElementById('form-register');
const formLogin    = document.getElementById('form-login');

// Switch between forms
document.getElementById('show-register').addEventListener('click', e => {
  e.preventDefault();
  loginSection.classList.add('hidden');
  regSection.classList.remove('hidden');
});
document.getElementById('show-login').addEventListener('click', e => {
  e.preventDefault();
  regSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
});

// Helper: choose persistence
function applyPersistence(remember) {
  const mode = remember
    ? browserLocalPersistence
    : browserSessionPersistence;
  return setPersistence(auth, mode);
}

// Registration handler
formRegister.addEventListener('submit', async e => {
  e.preventDefault();
  const u   = formRegister['username'].value.trim();
  const p   = formRegister['password'].value;
  const rem = formRegister['reg-remember'].checked;

  if (!u || !p) return alert('Bitte Benutzername und Passwort eingeben.');

  try {
    await applyPersistence(rem);
    const cred = await createUserWithEmailAndPassword(auth, `${u}@lauriver.local`, p);
    await setupUserData(cred.user.uid, u);
  } catch (err) {
    alert(err.message);
  }
});

// Login handler
formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  const u   = formLogin['username'].value.trim();
  const p   = formLogin['password'].value;
  const rem = formLogin['login-remember'].checked;

  if (!u || !p) return alert('Bitte Benutzername und Passwort eingeben.');

  try {
    await applyPersistence(rem);
    await signInWithEmailAndPassword(auth, `${u}@lauriver.local`, p);
  } catch (err) {
    alert(err.message);
  }
});

// Create or update user document in Firestore
async function setupUserData(uid, username) {
  const now    = Date.now();
  const userDoc = doc(firestore, "users", uid);
  const snap   = await getDoc(userDoc);

  if (!snap.exists()) {
    await setDoc(userDoc, {
      username,
      createdAt: now,
      lastLogin: now,
      settings: {},
      usage: {}
    });
  } else {
    await updateDoc(userDoc, { lastLogin: now });
  }
}

// Auth state listener
onAuthStateChanged(auth, user => {
  if (user) {
    loginSection.classList.add('hidden');
    regSection.classList.add('hidden');
    dashSection.classList.remove('hidden');
    startCounter();
  } else {
    dashSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
  }
});

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
  signOut(auth);
});
