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
  doc, getDoc, setDoc, updateDoc,
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const loginSec    = document.getElementById('login-section');
const registerSec = document.getElementById('register-section');
const dashSec     = document.getElementById('dashboard');

const formLogin    = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const remLogin     = document.getElementById('login-remember');
const remRegister  = document.getElementById('reg-remember');

document.getElementById('show-register').addEventListener('click', e => {
  e.preventDefault();
  loginSec.classList.add('hidden');
  registerSec.classList.remove('hidden');
});
document.getElementById('show-login').addEventListener('click', e => {
  e.preventDefault();
  registerSec.classList.add('hidden');
  loginSec.classList.remove('hidden');
});

function applyPersistence(remember) {
  return setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}

async function setupUser(uid, username) {
  const ref = doc(firestore, 'users', uid);
  const snap = await getDoc(ref);
  const now = Date.now();
  if (!snap.exists()) {
    await setDoc(ref, { username, createdAt: now });
  } else {
    await updateDoc(ref, { lastLogin: now });
  }
}

formRegister.addEventListener('submit', async e => {
  e.preventDefault();
  const u = formRegister.username.value.trim();
  const p = formRegister.password.value;
  if (!u||!p) return alert('Bitte ausfüllen');
  try {
    await applyPersistence(remRegister.checked);
    const cred = await createUserWithEmailAndPassword(auth, `${u}@lauriver.local`, p);
    await setupUser(cred.user.uid, u);
  } catch (err) { alert(err.message); }
});

formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  const u = formLogin.username.value.trim();
  const p = formLogin.password.value;
  if (!u||!p) return alert('Bitte ausfüllen');
  try {
    await applyPersistence(remLogin.checked);
    await signInWithEmailAndPassword(auth, `${u}@lauriver.local`, p);
  } catch (err) { alert(err.message); }
});

onAuthStateChanged(auth, user => {
  if (user) {
    loginSec.classList.add('hidden');
    registerSec.classList.add('hidden');
    dashSec.classList.remove('hidden');
    startCounter();
  } else {
    dashSec.classList.add('hidden');
    loginSec.classList.remove('hidden');
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  signOut(auth);
});
