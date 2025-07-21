// js/heart.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase‑Config unverändert
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

// UI‑Referenzen
const backBtn       = document.getElementById("back-btn");
const heartBtn      = document.getElementById("heart-btn");
const zoomContainer = document.getElementById("zoom-container");
const userListUl    = document.getElementById("user-list");

let scale = 1;
let currentUser = null;

// Back‑Button
backBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

// Zoom
zoomContainer.addEventListener("wheel", e => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  scale = Math.min(Math.max(0.5, scale), 3);
  zoomContainer.style.transform = `scale(${scale})`;
});

// Auth‑Listener
onAuthStateChanged(auth, async user => {
  if (!user) return void(window.location.href = "index.html");
  currentUser = user;
  await ensureUserDoc();      // einmalig
  subscribeToCounts();        // Zähler
  subscribeToHearts();        // Leinwand
});

// Live‑Zähler
function subscribeToCounts() {
  const q = query(collection(db, "heart_counts"), orderBy("count", "desc"));
  onSnapshot(q, snap => {
    userListUl.innerHTML = "";
    snap.docs.forEach(d => {
      const { displayName, count } = d.data();
      const li = document.createElement("li");
      li.textContent = `${displayName || d.id}: ${count || 0} ❤️`;
      userListUl.append(li);
    });
  });
}

// Live‑Leinwand
function subscribeToHearts() {
  const q = query(collection(db, "hearts"), orderBy("timestamp"));
  onSnapshot(q, snap => {
    zoomContainer.innerHTML = "";
    snap.docs.forEach(d => {
      const { x, y, size, hue } = d.data();
      const h = document.createElement("span");
      h.textContent = "❤️";
      h.style.position = "absolute";
      h.style.left     = `${x}px`;
      h.style.top      = `${y}px`;
      h.style.fontSize = `${size}px`;
      h.style.color    = `hsl(${hue},100%,50%)`;
      zoomContainer.append(h);
    });
  });
}

// Nutzer‑Doc nur initial anlegen oder displayName updaten
async function ensureUserDoc() {
  const ref = doc(db, "heart_counts", currentUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: currentUser.displayName,
      count: 0
    });
  } else if (snap.data().displayName !== currentUser.displayName) {
    await updateDoc(ref, { displayName: currentUser.displayName });
  }
}

// Herz‑Klick
heartBtn.addEventListener("click", async () => {
  const size = Math.random() * 40 + 20;
  const hue  = Math.random() * 30;
  const rect = zoomContainer.getBoundingClientRect();
  const x    = Math.random() * (rect.width/scale  - size);
  const y    = Math.random() * (rect.height/scale - size);

  // global speichern
  await addDoc(collection(db, "hearts"), {
    userId:    currentUser.uid,
    x, y, size, hue,
    timestamp: serverTimestamp()
  });

  // Counter inkrementieren
  const cref = doc(db, "heart_counts", currentUser.uid);
  await updateDoc(cref, {
    count: increment(1),
    lastClicked: serverTimestamp()
  });
});
