// js/heart.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 1) Firebase‑Konfiguration (identisch mit app.js)
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

// 5) Auth‑Listener
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    subscribeToCounts();
  } else {
    window.location.href = "index.html";
  }
});

// 6) Live‑Liste aller Nutzer‑Herzen
function subscribeToCounts() {
  const countsQuery = query(collection(db, "heart_counts"), orderBy("count", "desc"));
  onSnapshot(countsQuery, snap => {
    userListUl.innerHTML = "";
    snap.docs.forEach(d => {
      const data = d.data();
      const li = document.createElement("li");
      li.textContent = `${data.displayName || d.id}: ${data.count || 0} ❤️`;
      userListUl.append(li);
    });
  });
}

// 7) Herz‑Dokument anlegen (falls neu)
async function ensureUserDoc() {
  const ref = doc(db, "heart_counts", currentUser.uid);
  await setDoc(ref, {
    displayName: currentUser.displayName,
    count: 0
  }, { merge: true });
}

// 8) Klick auf Herz‑Button
heartBtn.addEventListener("click", async () => {
  await ensureUserDoc();

  // Herz auf Leinwand
  const size = Math.random() * 40 + 20;          // 20–60 px
  const hue  = Math.random() * 30;               // Rot‑Töne
  const rect = zoomContainer.getBoundingClientRect();
  const x    = Math.random() * (rect.width/scale - size);
  const y    = Math.random() * (rect.height/scale - size);

  const heart = document.createElement("span");
  heart.textContent = "❤️";
  heart.style.position   = "absolute";
  heart.style.left       = `${x}px`;
  heart.style.top        = `${y}px`;
  heart.style.fontSize   = `${size}px`;
  heart.style.color      = `hsl(${hue},100%,50%)`;
  zoomContainer.append(heart);

  // Zähler in Firestore erhöhen
  const ref = doc(db, "heart_counts", currentUser.uid);
  await updateDoc(ref, {
    count: increment(1),
    lastClicked: serverTimestamp()
  });
});
