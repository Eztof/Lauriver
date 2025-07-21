// js/heart.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
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

// 1) Firebase‑Konfiguration
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

// 2) UI‑Referenzen
const backBtn       = document.getElementById("back-btn");
const heartBtn      = document.getElementById("heart-btn");
const zoomContainer = document.getElementById("zoom-container");
const userListUl    = document.getElementById("user-list");

let scale = 1;
let currentUser = null;

// 3) Zurück‑Button
backBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

// 4) Zoom‑Handling
zoomContainer.addEventListener("wheel", e => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  scale = Math.min(Math.max(0.5, scale), 3);
  zoomContainer.style.transform = `scale(${scale})`;
});

// 5) Auth‑Listener: nur hier initialisieren
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  await ensureUserDoc();    // nur einmal beim Login
  subscribeToCounts();      // Zähler‑Liste
  subscribeToHearts();      // Herzen‑Canvas
});

// 6) Nutzer‑Zähler live
function subscribeToCounts() {
  const countsQuery = query(collection(db, "heart_counts"), orderBy("count", "desc"));
  onSnapshot(countsQuery, snap => {
    userListUl.innerHTML = "";
    snap.docs.forEach(d => {
      const { displayName, count } = d.data();
      const li = document.createElement("li");
      li.textContent = `${displayName || d.id}: ${count || 0} ❤️`;
      userListUl.append(li);
    });
  });
}

// 7) Herz‑Canvas live
function subscribeToHearts() {
  const heartsQuery = query(collection(db, "hearts"), orderBy("timestamp"));
  onSnapshot(heartsQuery, snap => {
    zoomContainer.innerHTML = "";  // komplett neu rendern
    snap.docs.forEach(d => {
      const { x, y, size, hue } = d.data();
      const heart = document.createElement("span");
      heart.textContent = "❤️";
      heart.style.position = "absolute";
      heart.style.left     = `${x}px`;
      heart.style.top      = `${y}px`;
      heart.style.fontSize = `${size}px`;
      heart.style.color    = `hsl(${hue},100%,50%)`;
      zoomContainer.append(heart);
    });
  });
}

// 8) Stelle sicher, dass dein Zähler‑Dok existiert
async function ensureUserDoc() {
  const ref = doc(db, "heart_counts", currentUser.uid);
  await setDoc(ref, {
    displayName: currentUser.displayName,
    count: 0
  }, { merge: true });
}

// 9) Herz setzen: Speichere in beiden Collections
heartBtn.addEventListener("click", async () => {
  // 9.1) Zufallswerte
  const size = Math.random() * 40 + 20;   // 20–60 px
  const hue  = Math.random() * 30;        // Rot‑Töne
  const rect = zoomContainer.getBoundingClientRect();
  const x    = Math.random() * (rect.width/scale  - size);
  const y    = Math.random() * (rect.height/scale - size);

  // 9.2) Herz‑Objekt global speichern
  await addDoc(collection(db, "hearts"), {
    userId:    currentUser.uid,
    x, y, size, hue,
    timestamp: serverTimestamp()
  });

  // 9.3) Nutzer‑Zähler inkrementieren
  const countRef = doc(db, "heart_counts", currentUser.uid);
  await updateDoc(countRef, {
    count: increment(1),
    lastClicked: serverTimestamp()
  });
});
