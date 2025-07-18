// Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
// Auth
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
// Firestore
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase‑Config aus der Console
const firebaseConfig = {
  apiKey:    "AIzaSyA0WC5gDtcq4znUZxqvGn5j1BPodnsgg9E",
  authDomain:"lauriver-31a6f.firebaseapp.com",
  projectId: "lauriver-31a6f",
  storageBucket:"lauriver-31a6f.appspot.com",
  messagingSenderId:"508140835438",
  appId:     "1:508140835438:web:4326ed6b40c01037e64c7f"
};

// Init
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Helper
const $ = id => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} nicht gefunden`);
  return el;
};

// DOM‑Refs
const loginForm    = $("login-form");
const registerForm = $("register-form");
const authSection  = $("auth-container");
const dashboard    = $("dashboard");
const calendar     = $("calendar");
const packing      = $("packing");
const settings     = $("settings");
const headerIcons  = $("header-icons");
const btnMenu      = $("btn-menu");
const drawer       = $("drawer");
const btnSettings  = $("btn-settings");
const btnLogout    = $("btn-logout");
const btnBack      = $("btn-back");
const toggleDark   = $("toggle-dark");
const rememberBox  = $("remember-me");
const packingForm  = $("packing-form");
const newItemInput = $("new-item");
const listEl       = $("packing-list");

// Drawer‑Navigation
drawer.querySelectorAll("a[data-show]").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    [dashboard, calendar, packing, settings].forEach(s => s.classList.add("hidden"));
    drawer.classList.add("hidden");
    $(e.currentTarget.dataset.show).classList.remove("hidden");
  });
});
btnMenu.addEventListener("click", () => drawer.classList.toggle("hidden"));

// Login ⇄ Register Toggle
$("show-register").onclick = e => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
};
$("show-login").onclick = e => {
  e.preventDefault();
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
};

// Registrierung (Username + Passwort)
registerForm.addEventListener("submit", async e => {
  e.preventDefault();
  const username = $("reg-username").value.trim();
  const pw       = $("reg-password").value;
  if (!username) return;
  const email = `${username}@users.lauriver.app`;
  const cred  = await createUserWithEmailAndPassword(auth, email, pw);
  await updateProfile(cred.user, { displayName: username });
  await setDoc(doc(db, "users", cred.user.uid), {
    username,
    email,
    settings: { dark: false },
    created: new Date()
  });
});

// Login: Username → Lookup → Auth
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const username = $("login-username").value.trim();
  const pw       = $("login-password").value;
  if (!username) return;
  const q    = query(collection(db, "users"), where("username", "==", username));
  const snaps= await getDocs(q);
  if (snaps.empty) return;
  const { email } = snaps.docs[0].data();
  await setPersistence(auth, rememberBox.checked
    ? browserLocalPersistence
    : browserSessionPersistence
  );
  await signInWithEmailAndPassword(auth, email, pw);
});

// Logout
btnLogout.addEventListener("click", () => signOut(auth));

// Auth‑State
onAuthStateChanged(auth, user => {
  if (user) {
    authSection.classList.add("hidden");
    headerIcons.classList.remove("hidden");
    btnMenu.classList.remove("hidden");
    dashboard.classList.remove("hidden");
    initPacking();
  } else {
    authSection.classList.remove("hidden");
    headerIcons.classList.add("hidden");
    btnMenu.classList.add("hidden");
    [dashboard, calendar, packing, settings].forEach(s => s.classList.add("hidden"));
  }
});

// Packliste: Realtime‑Listener & Interaktionen
function initPacking() {
  onSnapshot(collection(db, "packing"), snap => {
    listEl.innerHTML = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement("li");
      li.className = "packing-item";

      const all  = data.participants || [];
      const done = data.checked || [];
      if (all.length && all.every(u => done.includes(u))) {
        li.classList.add("green");
      }

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = done.includes(auth.currentUser.uid);
      cb.onchange = async () => {
        const idx = done.indexOf(auth.currentUser.uid);
        if (cb.checked && idx === -1) done.push(auth.currentUser.uid);
        if (!cb.checked && idx !== -1) done.splice(idx, 1);
        await updateDoc(doc(db, "packing", docSnap.id), { checked: done });
      };
      li.append(cb);

      const span = document.createElement("span");
      span.textContent = data.description;
      li.append(span);

      const p = document.createElement("div");
      p.className = "participants";
      p.textContent = `Beteiligte: ${all.length}`;
      li.append(p);

      if (data.createdBy === auth.currentUser.uid) {
        const del = document.createElement("button");
        del.textContent = "✖";
        del.onclick = () => deleteDoc(doc(db, "packing", docSnap.id));
        li.append(del);
      }

      listEl.append(li);
    });
  });
}

// Neues Packing-Item
packingForm.addEventListener("submit", async e => {
  e.preventDefault();
  const desc = newItemInput.value.trim();
  if (!desc) return;
  await addDoc(collection(db, "packing"), {
    description: desc,
    createdBy: auth.currentUser.uid,
    participants: [auth.currentUser.uid],
    checked: [],
    createdAt: new Date()
  });
  newItemInput.value = "";
});

// Einstellungen öffnen
btnSettings.addEventListener("click", async () => {
  [dashboard, calendar, packing].forEach(s => s.classList.add("hidden"));
  settings.classList.remove("hidden");
  const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
  const opts = snap.data()?.settings || {};
  toggleDark.checked = !!opts.dark;
  document.body.classList.toggle("dark", opts.dark);
});

// Zurück aus Einstellungen
btnBack.addEventListener("click", () => {
  settings.classList.add("hidden");
  dashboard.classList.remove("hidden");
});

// Dark‑Mode Toggle
toggleDark.addEventListener("change", async () => {
  const on = toggleDark.checked;
  document.body.classList.toggle("dark", on);
  await setDoc(doc(db, "users", auth.currentUser.uid), { settings: { dark: on } }, { merge: true });
});
