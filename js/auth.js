// Imports aus firebase-config.js und SDKs
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
import { startCounter } from "./countdown.js";  // falls countdown modular exportiert wird

// Elemente referenzieren
const regSection   = document.getElementById('register-section');
const loginSection = document.getElementById('login-section');
const dashSection  = document.getElementById('dashboard');
const formRegister = document.getElementById('form-register');
const formLogin    = document.getElementById('form-login');
const btnLogout    = document.getElementById('btn-logout');

// --- Hilfsfunktionen ---

/**
 * Schreibe ein Nutzungs-Event in Firestore:
 * users/{uid}/usage/{auto-id}
 */
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

/**
 * Wähle Persistence (Session vs. Local) je nach 'remember'-Checkbox
 */
function applyPersistence(remember) {
  const mode = remember
    ? browserLocalPersistence
    : browserSessionPersistence;
  return setPersistence(auth, mode);
}

/**
 * Lege den User-Stammdatensatz an oder aktualisiere lastLogin
 */
async function setupUserData(uid, username) {
  const now = Date.now();
  const userDoc = doc(firestore, "users", uid);
  const snap    = await getDoc(userDoc);

  if (!snap.exists()) {
    // Neu anlegen
    await setDoc(userDoc, {
      username,
      createdAt: now,
      lastLogin: now,
      settings: {}
    });
    // Erstes Event: registration
    await logUsage(uid, "registration");
  } else {
    // Nur letztes Login updaten
    await updateDoc(userDoc, { lastLogin: now });
  }
}

// --- Event-Handler ---

// Umschalten Login/Register
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

// Login
formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  const u   = formLogin['username'].value.trim();
  const p   = formLogin['password'].value;
  const rem = formLogin['login-remember'].checked;
  if (!u || !p) return alert('Bitte Benutzername und Passwort eingeben.');

  try {
    await applyPersistence(rem);
    const cred = await signInWithEmailAndPassword(auth, `${u}@lauriver.local`, p);
    // Logge das Login-Event
    await logUsage(cred.user.uid, "login");
  } catch (err) {
    alert(err.message);
  }
});

// Auth-State Listener
onAuthStateChanged(auth, user => {
  if (user) {
    // Eingeloggt
    loginSection.classList.add('hidden');
    regSection.classList.add('hidden');
    dashSection.classList.remove('hidden');
    startCounter(); 
  } else {
    // Ausgeloggt
    dashSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
  }
});

// Logout
btnLogout.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return;
  // Logge das Logout-Event
  await logUsage(user.uid, "logout");
  await signOut(auth);
});
