import { auth, db } from "./firebase.js";
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Dark‑Mode UI + Firestore‑Sync
const toggle = document.getElementById('dark-toggle');

async function loadSettings(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const s = snap.data().settings;
    const theme = s.darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (toggle) toggle.checked = s.darkMode;
    console.log("[Firestore] Settings loaded:", s);
  }
}

async function saveSettings(uid, darkMode) {
  await setDoc(doc(db, "users", uid), {
    settings: { darkMode }
  }, { merge: true });
  console.log("[Firestore] Settings saved: darkMode =", darkMode);
}

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
onAuthStateChanged(auth, user => {
  if (user && toggle) loadSettings(user.uid);
});

if (toggle) {
  toggle.addEventListener('change', () => {
    const dark = toggle.checked;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    auth.currentUser && saveSettings(auth.currentUser.uid, dark);
  });
}
