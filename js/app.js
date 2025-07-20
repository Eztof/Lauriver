// 1) Firebase‑SDK importieren
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 2) Firebase‑Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyA0WC5gDtcq4znUZxqvGn5j1BPodnsgg9E",
  authDomain: "lauriver-31a6f.firebaseapp.com",
  databaseURL: "https://lauriver-31a6f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lauriver-31a6f",
  storageBucket: "lauriver-31a6f.firebasestorage.app",
  messagingSenderId: "508140835438",
  appId: "1:508140835438:web:4326ed6b40c01037e64c7f"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// 3) Helpers
function emailFromUsername(username) {
  return `${username}@lauriver.app`;
}
async function updateUsage(updates) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, "usage_logs", user.uid);
  await setDoc(ref, { ...updates, lastUpdate: serverTimestamp() }, { merge: true });
}

// 4) UI‑Refs
const sections = {
  login:      document.getElementById("login-section"),
  register:   document.getElementById("register-section"),
  home:       document.getElementById("home-section"),
  calendar:   document.getElementById("calendar-section"),
  packlist:   document.getElementById("packlist-section"),
  timeline:   document.getElementById("timeline-section")
};
const logoutBtn  = document.getElementById("logout-btn");
const packForm   = document.getElementById("packlist-form");
const packInput  = document.getElementById("packlist-input");
const packListUl = document.getElementById("packlist-items");

// 5) View‑Switch
function showView(name) {
  Object.values(sections).forEach(s => s.classList.add("hidden"));
  sections[name].classList.remove("hidden");
  updateUsage({ [`lastView_${name}`]: serverTimestamp() });
}

// 6) Auth‑Listener
let packUnsub = null;
onAuthStateChanged(auth, user => {
  if (user) {
    showView("home");
    updateUsage({ lastLogin: serverTimestamp(), displayName: user.displayName });
    // Packliste‑Listener starten
    if (packUnsub) packUnsub();
    const colRef = collection(db, "packlist_items");
    const q = query(colRef, orderBy("createdAt"));
    packUnsub = onSnapshot(q, snap => {
      packListUl.innerHTML = "";
      snap.forEach(docSnap => {
        const data = docSnap.data();
        const li = document.createElement("li");
        // Checkbox
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = data.done;
        cb.addEventListener("change", () =>
          updateDoc(doc(db, "packlist_items", docSnap.id), { done: cb.checked, updatedAt: serverTimestamp() })
        );
        // Text
        const span = document.createElement("span");
        span.textContent = data.text;
        span.contentEditable = true;
        span.classList.add("packlist-text");
        if (data.done) span.classList.add("completed");
        span.addEventListener("blur", () => {
          const txt = span.textContent.trim();
          if (txt && txt !== data.text) {
            updateDoc(doc(db, "packlist_items", docSnap.id), { text: txt, updatedAt: serverTimestamp() });
          } else {
            span.textContent = data.text;
          }
        });
        // Delete
        const del = document.createElement("button");
        del.textContent = "🗑";
        del.addEventListener("click", () =>
          deleteDoc(doc(db, "packlist_items", docSnap.id))
        );
        // Zusammenbauen
        li.append(cb, span, del);
        packListUl.append(li);
      });
    });
  } else {
    if (packUnsub) packUnsub();
    showView("login");
  }
});

// 7) Login
document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  const u = document.getElementById("login-username").value.trim();
  const p = document.getElementById("login-password").value;
  const remember = document.getElementById("remember-device").checked;
  setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    .then(() => signInWithEmailAndPassword(auth, emailFromUsername(u), p))
    .then(() => updateUsage({ lastLogin: serverTimestamp(), remember }))
    .catch(err => alert("Fehler beim Einloggen: " + err.message));
});

// 8) Registration
document.getElementById("register-form").addEventListener("submit", e => {
  e.preventDefault();
  const u  = document.getElementById("register-username").value.trim();
  const p1 = document.getElementById("register-password").value;
  const p2 = document.getElementById("register-password-confirm").value;
  if (p1 !== p2) return alert("Passwörter stimmen nicht überein.");
  createUserWithEmailAndPassword(auth, emailFromUsername(u), p1)
    .then(async cred => {
      await updateProfile(cred.user, { displayName: u });
      await setDoc(doc(db, "usage_logs", cred.user.uid), {
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        displayName: u
      });
    })
    .catch(err => alert("Fehler bei der Registrierung: " + err.message));
});

// 9) Switch Links
document.getElementById("to-register").addEventListener("click", e => { e.preventDefault(); showView("register"); });
document.getElementById("to-login").addEventListener("click", e => { e.preventDefault(); showView("login"); });

// 10) Logout
logoutBtn.addEventListener("click", async () => {
  await updateUsage({ lastLogout: serverTimestamp() });
  signOut(auth);
});

// 11) Navigation Startseite
document.getElementById("nav-calendar").addEventListener("click", () => showView("calendar"));
document.getElementById("nav-packlist").addEventListener("click", () => showView("packlist"));
document.getElementById("nav-timeline").addEventListener("click", () => showView("timeline"));
document.querySelectorAll(".back-btn").forEach(btn =>
  btn.addEventListener("click", () => showView("home"))
);

// 12) Neues Packlist‑Item anlegen
packForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = packInput.value.trim();
  if (!text) return;
  addDoc(collection(db, "packlist_items"), {
    text,
    done: false,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid
  });
  packInput.value = "";
});
