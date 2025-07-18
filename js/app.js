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
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ¹ Firebase‑Config genau aus deiner Console übernehmen!
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

// Helfer
const $ = id => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} nicht gefunden`);
  return el;
};

// DOM‑References
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
const counterEl    = $("counter");
const rememberBox  = $("remember-me");

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

// Login <-> Register
$("show-register").addEventListener("click", e => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
});
$("show-login").addEventListener("click", e => {
  e.preventDefault();
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

// Registrierung (Username + Passwort)
registerForm.addEventListener("submit", async e => {
  e.preventDefault();
  const username = $("reg-username").value.trim();
  const pw       = $("reg-password").value;
  if (!username) return alert("Bitte Benutzernamen eingeben.");
  // interne Dummy‑E‑Mail:
  const email = `${username}@users.lauriver.app`;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pw);
    await updateProfile(cred.user, { displayName: username });
    await setDoc(doc(db, "users", cred.user.uid), {
      username,
      email,
      settings: { dark: false },
      created: new Date()
    });
    alert("Registrierung erfolgreich!");
  } catch (err) {
    console.error(err);
    alert("Fehler: " + err.message);
  }
});

// Login (Username -> E‑Mail -> Auth)
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const username = $("login-username").value.trim();
  const pw       = $("login-password").value;
  if (!username) return alert("Bitte Benutzernamen eingeben.");

  // Firestore‑Lookup auf E‑Mail
  const q = query(collection(db, "users"), where("username", "==", username));
  const snaps = await getDocs(q);
  if (snaps.empty) return alert("Benutzer nicht gefunden.");
  const { email } = snaps.docs[0].data();

  // Persistence
  await setPersistence(auth,
    rememberBox.checked
      ? browserLocalPersistence
      : browserSessionPersistence
  );

  try {
    await signInWithEmailAndPassword(auth, email, pw);
  } catch (err) {
    console.error(err);
    alert("Login-Fehler: " + err.message);
  }
});

// Logout
btnLogout.addEventListener("click", () => signOut(auth));

// Live Counter
let interval;
function startCounter() {
  const start = new Date("2025-01-25T18:00:00");
  function tick() {
    const diff = Date.now() - start.getTime();
    const days = Math.floor(diff / 86400000);
    const hms  = new Date(diff % 86400000).toISOString().substr(11,8);
    counterEl.textContent = `${days} Tage ${hms}`;
  }
  tick();
  interval = setInterval(tick, 1000);
}
function stopCounter() { clearInterval(interval); }

// Auth‑State
onAuthStateChanged(auth, user => {
  if (user) {
    authSection.classList.add("hidden");
    headerIcons.classList.remove("hidden");
    btnMenu.classList.remove("hidden");
    dashboard.classList.remove("hidden");
    startCounter();
  } else {
    authSection.classList.remove("hidden");
    headerIcons.classList.add("hidden");
    btnMenu.classList.add("hidden");
    [dashboard, calendar, packing, settings].forEach(s => s.classList.add("hidden"));
    stopCounter();
  }
});

// Einstellungen
btnSettings.addEventListener("click", async () => {
  [dashboard, calendar, packing].forEach(s => s.classList.add("hidden"));
  settings.classList.remove("hidden");
  const uid = auth.currentUser.uid;
  const snap = await getDoc(doc(db, "users", uid));
  const opts = snap.data()?.settings || {};
  toggleDark.checked = !!opts.dark;
  document.body.classList.toggle("dark", opts.dark);
});

// Zurück
btnBack.addEventListener("click", () => {
  settings.classList.add("hidden");
  dashboard.classList.remove("hidden");
});

// Dark‑Mode Toggle
toggleDark.addEventListener("change", async () => {
  const on = toggleDark.checked;
  document.body.classList.toggle("dark", on);
  const uid = auth.currentUser.uid;
  await setDoc(doc(db, "users", uid), { settings: { dark: on } }, { merge: true });
});
