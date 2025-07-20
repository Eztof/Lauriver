// js/auth.js
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
  updateDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Elemente
const regSection   = document.getElementById('register-section');
const loginSection = document.getElementById('login-section');
const dashSection  = document.getElementById('dashboard');
const formRegister = document.getElementById('form-register');
const formLogin    = document.getElementById('form-login');
const btnLogout    = document.getElementById('btn-logout');

// Checkbox-Elemente
const remReg   = document.getElementById('reg-remember');
const remLogin = document.getElementById('login-remember');

// Hilfsfunktionen
async function logUsage(uid, eventName, details = {}) {
  try {
    const usageCol = collection(firestore, "users", uid, "usage");
    await addDoc(usageCol, {
      event: eventName,
      details,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Usage logging failed:", err);
  }
}

function applyPersistence(remember) {
  const mode = remember
    ? browserLocalPersistence
    : browserSessionPersistence;
  return setPersistence(auth, mode);
}

async function setupUserData(uid, username) {
  const now = Date.now();
  const userDoc = doc(firestore, "users", uid);
  const snap    = await getDoc(userDoc);

  if (!snap.exists()) {
    await setDoc(userDoc, {
      username,
      createdAt: now,
      lastLogin: now,
      settings: {}
    });
    await logUsage(uid, "registration");
  } else {
    await updateDoc(userDoc, { lastLogin: now });
  }
}

// Form-Switch
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

// Registrierung
formRegister.addEventListener('submit', async e => {
  e.preventDefault();
  const username = formRegister['username'].value.trim();
  const password = formRegister['password'].value;
  if (!username || !password) {
    return alert('Bitte Benutzername und Passwort eingeben.');
  }

  try {
    await applyPersistence(remReg.checked);
    const cred = await createUserWithEmailAndPassword(
      auth,
      `${username}@lauriver.local`,
      password
    );
    await setupUserData(cred.user.uid, username);
  } catch (err) {
    alert(err.message);
  }
});

// Login
formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  const username = formLogin['username'].value.trim();
  const password = formLogin['password'].value;
  if (!username || !password) {
    return alert('Bitte Benutzername und Passwort eingeben.');
  }

  try {
    await applyPersistence(remLogin.checked);
    const cred = await signInWithEmailAndPassword(
      auth,
      `${username}@lauriver.local`,
      password
    );
    await logUsage(cred.user.uid, "login");
  } catch (err) {
    alert(err.message);
  }
});

// Auth-State Listener
onAuthStateChanged(auth, user => {
  if (user) {
    loginSection.classList.add('hidden');
    regSection.classList.add('hidden');
    dashSection.classList.remove('hidden');
    // startCounter ist global definiert in countdown.js
    if (typeof startCounter === 'function') {
      startCounter();
    }
  } else {
    dashSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
  }
});

// Logout
btnLogout.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return;
  await logUsage(user.uid, "logout");
  await signOut(auth);
});
