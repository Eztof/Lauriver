// Firebase‑Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, setPersistence,
  browserLocalPersistence, browserSessionPersistence,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore, collection, query, where, getDocs,
  doc, setDoc, getDoc, addDoc, onSnapshot, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 1️⃣ Konfiguriere hier deine Firebase‑Daten
const firebaseConfig = {
  apiKey: "AIzaSyA0WC5gDtcq4znUZxqvGn5j1BPodnsgg9E",
  authDomain: "lauriver-31a6f.firebaseapp.com",
  projectId: "lauriver-31a6f",
  storageBucket: "lauriver-31a6f.appspot.com",
  messagingSenderId: "508140835438",
  appId: "1:508140835438:web:4326ed6b40c01037e64c7f"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Helper
const $ = id => document.getElementById(id);

// DOM Refs
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

// Navigation Drawer
drawer.querySelectorAll("a[data-show]").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    [dashboard, calendar, packing, settings].forEach(s => s.classList.add("hidden"));
    drawer.classList.add("hidden");
    $(e.currentTarget.dataset.show).classList.remove("hidden");
  });
});
btnMenu.addEventListener("click", () => drawer.classList.toggle("hidden"));

// Toggle Login/Register
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

// Registrierung ohne Alert
registerForm.addEventListener("submit", async e => {
  e.preventDefault();
  const username = $("reg-username").value.trim();
  const pw = $("reg-password").value;
  if (!username) return;
  const email = `${username}@users.lauriver.app`;
  const cred = await createUserWithEmailAndPassword(auth, email, pw);
  await updateProfile(cred.user, { displayName: username });
  await setDoc(doc(db, "users", cred.user.uid), {
    username, email, settings: { dark: false }, created: new Date()
  });
});

// Login per Username → Lookup → Auth
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const username = $("login-username").value.trim();
  const pw = $("login-password").value;
  if (!username) return;
  // Firestore-Lookup
  const q = query(collection(db, "users"), where("username", "==", username));
  const snaps = await getDocs(q);
  if (snaps.empty) return;
  const { email } = snaps.docs[0].data();
  await setPersistence(auth, rememberBox.checked
    ? browserLocalPersistence
    : browserSessionPersistence);
  await signInWithEmailAndPassword(auth, email, pw);
});

// Logout
btnLogout.addEventListener("click", () => signOut(auth));

// Live Counter (noch sichtbar, aber obendrein leer)
let intv;
onAuthStateChanged(auth, user => {
  if (user) {
    authSection.classList.add("hidden");
    headerIcons.classList.remove("hidden");
    btnMenu.classList.remove("hidden");
    dashboard.classList.remove("hidden");
    startCounter();
    initPacking();
  } else {
    authSection.classList.remove("hidden");
    headerIcons.classList.add("hidden");
    btnMenu.classList.add("hidden");
    [dashboard, calendar, packing, settings].forEach(s => s.classList.add("hidden"));
    stopCounter();
  }
});

// Counter füllen (wird nicht angezeigt)
function startCounter(){
  const start = new Date("2025-01-25T18:00:00");
  function tick(){
    const diff=Date.now()-start.getTime();
    const days=Math.floor(diff/86400000);
    const hms=new Date(diff%86400000).toISOString().substr(11,8);
    // $("#counter").textContent = `${days} Tage ${hms}`;  // jetzt unsichtbar
  }
  tick(); intv=setInterval(tick,1000);
}
function stopCounter(){ clearInterval(intv); }

// Packliste Konzept & Implementation
async function initPacking(){
  // Realtime Listener auf Collection "packing"
  onSnapshot(collection(db, "packing"), snap=>{
    listEl.innerHTML = "";
    snap.forEach(docSnap=>{
      const data = docSnap.data();
      const li = document.createElement("li");
      li.className = "packing-item";
      // Prüfen ob alle beteiligten abgehakt
      const all = data.participants || [];
      const done = data.checked || [];
      if (all.length && all.every(u=> done.includes(u))) {
        li.classList.add("green");
      }
      // Checkbox
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = done.includes(auth.currentUser.uid);
      cb.onchange = async ()=>{
        const idx = done.indexOf(auth.currentUser.uid);
        if (cb.checked && idx===-1) done.push(auth.currentUser.uid);
        if (!cb.checked && idx!==-1) done.splice(idx,1);
        await updateDoc(doc(db,"packing",docSnap.id), { checked: done });
      };
      li.append(cb);
      // Text
      const span = document.createElement("span");
      span.textContent = data.description;
      li.append(span);
      // Participants
      const p = document.createElement("div");
      p.className = "participants";
      p.textContent = `Beteiligte: ${ (data.participants||[]).length || 0 }`;
      li.append(p);
      // Delete/Edit für owner
      if (data.createdBy === auth.currentUser.uid) {
        const del = document.createElement("button");
        del.textContent = "✖";
        del.onclick = ()=> deleteDoc(doc(db,"packing",docSnap.id));
        li.append(del);
      }
      listEl.append(li);
    });
  });
}
// Hinzufügen neuer Einträge
packingForm.addEventListener("submit", async e=>{
  e.preventDefault();
  const desc = newItemInput.value.trim();
  if (!desc) return;
  await addDoc(collection(db,"packing"), {
    description: desc,
    createdBy: auth.currentUser.uid,
    participants: [ auth.currentUser.uid ],
    checked: [],
    createdAt: new Date()
  });
  newItemInput.value = "";
});

// Einstellungen öffnen
btnSettings.addEventListener("click", async ()=>{
  [dashboard, calendar, packing].forEach(s=> s.classList.add("hidden"));
  settings.classList.remove("hidden");
  const snap = await getDoc(doc(db,"users", auth.currentUser.uid));
  const opts = snap.data()?.settings || {};
  toggleDark.checked = !!opts.dark;
  document.body.classList.toggle("dark",opts.dark);
});

// Zurück aus Einstellungen
btnBack.addEventListener("click", ()=>{
  settings.classList.add("hidden");
  dashboard.classList.remove("hidden");
});

// Dark‑Mode Toggle
toggleDark.addEventListener("change", async ()=>{
  const on = toggleDark.checked;
  document.body.classList.toggle("dark", on);
  await setDoc(doc(db,"users",auth.currentUser.uid), { settings:{dark:on} }, { merge:true });
});
