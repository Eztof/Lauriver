import { auth, db } from "./firebase.js";
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Dark‑Mode UI + Firestore‑Sync
const toggle = document.getElementById('dark-toggle');

async function loadSettings(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const s = snap.data().settings ?? {};
      const dark = s.darkMode === true;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      if (toggle) toggle.checked = dark;
      console.log("[Firestore] Settings loaded:", s);
    }
  } catch (e) {
    console.error("[Firestore] Error loading settings:", e);
  }
}

async function saveSettings(uid, darkMode) {
  try {
    await setDoc(doc(db, "users", uid), {
      settings: { darkMode }
    }, { merge: true });
    console.log("[Firestore] Settings saved: darkMode =", darkMode);
  } catch (e) {
    console.error("[Firestore] Error saving settings:", e);
  }
}

onAuthStateChanged(auth, user => {
  if (user && toggle) {
    loadSettings(user.uid);
  }
});

if (toggle) {
  toggle.addEventListener('change', () => {
    const dark = toggle.checked;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (auth.currentUser) {
      saveSettings(auth.currentUser.uid, dark);
    }
  });
}
