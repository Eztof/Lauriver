// 1) Firebase‑SDK importieren
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, setPersistence,
  browserLocalPersistence, browserSessionPersistence,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, updateProfile, signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, doc,
  setDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp
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

// 3) Hilfsfunktionen
function emailFromUsername(u){ return `${u}@lauriver.app`; }
async function updateUsage(updates) {
  const u = auth.currentUser;
  if (!u) return;
  await setDoc(doc(db, "usage_logs", u.uid), {
    ...updates, lastUpdate: serverTimestamp()
  }, { merge: true });
}

// 4) UI‑Referenzen
const sections     = {
  login:    document.getElementById("login-section"),
  register: document.getElementById("register-section"),
  home:     document.getElementById("home-section"),
  calendar: document.getElementById("calendar-section"),
  packlist: document.getElementById("packlist-section"),
  timeline: document.getElementById("timeline-section")
};
const logoutBtn         = document.getElementById("logout-btn");
const categoryForm      = document.getElementById("timeline-category-form");
const categoryInput     = document.getElementById("timeline-category-input");
const calendarContainer = document.getElementById("timeline-calendar");
const modal             = document.getElementById("timeline-modal");
const modalDateSpan     = document.getElementById("modal-date");
const modalForm         = document.getElementById("modal-form");
const modalCheckboxes   = document.getElementById("modal-checkboxes");
const modalCancel       = document.getElementById("modal-cancel");
const timelineGrid      = document.getElementById("timeline-grid");

// State
let categories = [];
let entriesMap = {};   // { "YYYY-MM-DD": [catId, ...] }

// 5) View‑Switch
function showView(name) {
  Object.values(sections).forEach(s => s.classList.add("hidden"));
  sections[name].classList.remove("hidden");
  updateUsage({ [`lastView_${name}`]: serverTimestamp() });
}

// 6) Auth‑Listener & Firestore‑Listener starten
let catUnsub, entryUnsub;
onAuthStateChanged(auth, user => {
  if (user) {
    showView("home");
    updateUsage({ lastLogin: serverTimestamp(), displayName: user.displayName });

    // Kategorien
    if (catUnsub) catUnsub();
    catUnsub = onSnapshot(
      query(collection(db, "timeline_categories"), orderBy("createdAt")),
      snap => {
        categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    );

    // Einträge
    if (entryUnsub) entryUnsub();
    entryUnsub = onSnapshot(
      collection(db, "timeline_entries"),
      snap => {
        entriesMap = {};
        snap.docs.forEach(d => {
          entriesMap[d.id] = d.data().categories || [];
        });
        rebuildCalendar();
        renderTimeline();
      }
    );

  } else {
    if (catUnsub) catUnsub();
    if (entryUnsub) entryUnsub();
    showView("login");
  }
});

// 7) Login / Registrierung / Logout
document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  const u = document.getElementById("login-username").value.trim(),
        p = document.getElementById("login-password").value,
        rem = document.getElementById("remember-device").checked;
  setPersistence(auth, rem ? browserLocalPersistence : browserSessionPersistence)
    .then(() => signInWithEmailAndPassword(auth, emailFromUsername(u), p))
    .then(() => updateUsage({ lastLogin: serverTimestamp(), remember: rem }))
    .catch(err => alert("Einloggen fehlgeschlagen: " + err.message));
});
document.getElementById("register-form").addEventListener("submit", async e => {
  e.preventDefault();
  const u = document.getElementById("register-username").value.trim(),
        p1 = document.getElementById("register-password").value,
        p2 = document.getElementById("register-password-confirm").value;
  if (p1 !== p2) return alert("Passwörter stimmen nicht überein.");
  try {
    const cred = await createUserWithEmailAndPassword(auth, emailFromUsername(u), p1);
    await updateProfile(cred.user, { displayName: u });
    await setDoc(doc(db,"usage_logs",cred.user.uid), {
      createdAt: serverTimestamp(), lastLogin: serverTimestamp(), displayName: u
    });
  } catch(err) {
    alert("Registrierung fehlgeschlagen: " + err.message);
  }
});
document.getElementById("to-register").addEventListener("click", e => { e.preventDefault(); showView("register"); });
document.getElementById("to-login")  .addEventListener("click", e => { e.preventDefault(); showView("login"); });
logoutBtn.addEventListener("click", async () => {
  await updateUsage({ lastLogout: serverTimestamp() });
  signOut(auth);
});

// 8) Kategorien anlegen
categoryForm.addEventListener("submit", async e => {
  e.preventDefault();
  const name = categoryInput.value.trim();
  if (!name) return;
  const color = '#' + Math.random().toString(16).slice(2,8);
  await addDoc(collection(db, "timeline_categories"), {
    name, color, createdAt: serverTimestamp()
  });
  categoryInput.value = "";
});

// 9) Kalender aufbauen
function rebuildCalendar() {
  calendarContainer.innerHTML = '';
  const today = new Date();
  const year = today.getFullYear(), month = today.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - ((firstOfMonth.getDay() + 6) % 7));
  const lastOfMonth = new Date(year, month + 1, 0);
  const end = new Date(lastOfMonth);
  end.setDate(lastOfMonth.getDate() + (6 - ((lastOfMonth.getDay() + 6) % 7)));

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0,10);
    const div = document.createElement("div");
    div.className = "calendar-day";
    if (d.getMonth() !== month) div.classList.add("other-month");
    if (entriesMap[iso] && entriesMap[iso].length) div.classList.add("has-entry");
    div.innerHTML = `<span class="date-num">${d.getDate()}</span>`;
    div.dataset.date = iso;
    div.addEventListener("click", () => openModal(iso));
    calendarContainer.append(div);
  }
}

// 10) Modal-Logik
function openModal(date) {
  modalDateSpan.textContent = date;
  modalCheckboxes.innerHTML = '';
  categories.forEach(cat => {
    const id = `chk-${cat.id}`;
    const lbl = document.createElement("label");
    lbl.innerHTML = `
      <input type="checkbox" id="${id}" data-cat-id="${cat.id}"
        ${entriesMap[date]?.includes(cat.id) ? 'checked' : ''}>
      <span style="background:${cat.color};width:12px;height:12px;display:inline-block;margin-right:4px;"></span>
      ${cat.name}
    `;
    modalCheckboxes.append(lbl);
  });
  modal.classList.remove("hidden");
}
modalCancel.addEventListener("click", () => modal.classList.add("hidden"));
modalForm.addEventListener("submit", async e => {
  e.preventDefault();
  const date = modalDateSpan.textContent;
  const checked = Array.from(modalCheckboxes.querySelectorAll("input[type=checkbox]:checked"))
    .map(cb => cb.dataset.catId);
  const ref = doc(db, "timeline_entries", date);
  if (checked.length) {
    await setDoc(ref, { categories: checked, updatedAt: serverTimestamp() });
  } else {
    await deleteDoc(ref);
  }
  modal.classList.add("hidden");
});

// 11) Timeline rendern
function renderTimeline() {
  timelineGrid.innerHTML = '';
  const dates = Object.keys(entriesMap)
    .filter(d => entriesMap[d].length)
    .map(d => new Date(d));
  if (!dates.length) return;
  const weeks = new Set();
  dates.forEach(d => {
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    weeks.add(monday.toISOString().slice(0,10));
  });

  Array.from(weeks).sort().forEach(weekStartISO => {
    const weekStart = new Date(weekStartISO);
    const row = document.createElement("div");
    row.className = "week-row";
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const iso = day.toISOString().slice(0,10);
      const cell = document.createElement("div");
      cell.className = "day-cell";
      const cats = entriesMap[iso] || [];
      if (!cats.length) {
        const bar = document.createElement("div");
        bar.className = "timeline-bar grey";
        cell.append(bar);
      } else {
        const h = 100 / cats.length;
        cats.forEach(catId => {
          const cat = categories.find(c=>c.id===catId);
          const bar = document.createElement("div");
          bar.className = "timeline-bar";
          bar.style.background = cat?.color || "#000";
          bar.style.height = `${h}%`;
          cell.append(bar);
        });
      }
      row.append(cell);
    }
    timelineGrid.append(row);
  });
}

// 12) Links zwischen Views
document.getElementById("nav-timeline")
  .addEventListener("click", () => showView("timeline"));
document.querySelectorAll(".back-btn")
  .forEach(b => b.addEventListener("click", () => showView("home")));
