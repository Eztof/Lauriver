// js/app.js
// 1) Firebase‑SDK importieren (Auth + Firestore)
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
  serverTimestamp,
  Timestamp
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

// 3) Hilfs‑Funktionen
function emailFromUsername(u) {
  return `${u}@lauriver.app`;
}
async function updateUsage(updates) {
  const u = auth.currentUser;
  if (!u) return;
  await setDoc(doc(db, "usage_logs", u.uid), { ...updates, lastUpdate: serverTimestamp() }, { merge: true });
}

// 4) UI‑Referenzen
const sections     = {
  login:      document.getElementById("login-section"),
  register:   document.getElementById("register-section"),
  home:       document.getElementById("home-section"),
  calendar:   document.getElementById("calendar-section"),
  packlist:   document.getElementById("packlist-section"),
  timeline:   document.getElementById("timeline-section")
};
const logoutBtn      = document.getElementById("logout-btn");
const eventForm      = document.getElementById("event-form");
const eventTitle     = document.getElementById("event-title");
const eventDate      = document.getElementById("event-date");
const eventTime      = document.getElementById("event-time");
const eventListUl    = document.getElementById("event-list");
const categoryForm   = document.getElementById("category-form");
const categoryInput  = document.getElementById("category-input");
const categorySelect = document.getElementById("category-select");
const packForm       = document.getElementById("packlist-form");
const packInput      = document.getElementById("packlist-input");
const packListUl     = document.getElementById("packlist-items");

// 5) View‑Wechsel
function showView(name) {
  Object.values(sections).forEach(s => s.classList.add("hidden"));
  sections[name].classList.remove("hidden");
  updateUsage({ [`lastView_${name}`]: serverTimestamp() });
}

// 6) Auth‑Listener & Real‑Time‑Listener starten
let catUnsub, packUnsub, evtUnsub;
let categories = [], items = [], events = [];

onAuthStateChanged(auth, user => {
  if (user) {
    showView("home");
    updateUsage({ lastLogin: serverTimestamp(), displayName: user.displayName });

    // — Kategorien
    if (catUnsub) catUnsub();
    catUnsub = onSnapshot(
      query(collection(db, "packlist_categories"), orderBy("createdAt")),
      snap => {
        categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        rebuildCategorySelect();
        renderPacklist();
      }
    );

    // — Packliste
    if (packUnsub) packUnsub();
    packUnsub = onSnapshot(
      query(collection(db, "packlist_items"), orderBy("createdAt")),
      snap => {
        items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderPacklist();
      }
    );

    // — Kalender
    if (evtUnsub) evtUnsub();
    evtUnsub = onSnapshot(
      query(collection(db, "calendar_events"), orderBy("datetime")),
      snap => {
        events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderCalendar();
      }
    );

  } else {
    if (catUnsub) catUnsub();
    if (packUnsub) packUnsub();
    if (evtUnsub) evtUnsub();
    showView("login");
  }
});

// 7) Login
document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  const u   = document.getElementById("login-username").value.trim();
  const p   = document.getElementById("login-password").value;
  const rem = document.getElementById("remember-device").checked;
  setPersistence(auth, rem ? browserLocalPersistence : browserSessionPersistence)
    .then(() => signInWithEmailAndPassword(auth, emailFromUsername(u), p))
    .then(() => updateUsage({ lastLogin: serverTimestamp(), remember: rem }))
    .catch(err => alert("Fehler beim Einloggen: " + err.message));
});

// 8) Registrierung
document.getElementById("register-form").addEventListener("submit", async e => {
  e.preventDefault();
  const u  = document.getElementById("register-username").value.trim();
  const p1 = document.getElementById("register-password").value;
  const p2 = document.getElementById("register-password-confirm").value;
  if (p1 !== p2) return alert("Passwörter stimmen nicht überein.");
  try {
    const cred = await createUserWithEmailAndPassword(auth, emailFromUsername(u), p1);
    await updateProfile(cred.user, { displayName: u });
    await setDoc(doc(db, "usage_logs", cred.user.uid), {
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      displayName: u
    });
  } catch (err) {
    alert("Registrierung fehlgeschlagen: " + err.message);
  }
});

// 9) Links Login ↔ Registrierung
document.getElementById("to-register").addEventListener("click", e => { e.preventDefault(); showView("register"); });
document.getElementById("to-login")  .addEventListener("click", e => { e.preventDefault(); showView("login"); });

// 10) Logout
logoutBtn.addEventListener("click", async () => {
  await updateUsage({ lastLogout: serverTimestamp() });
  signOut(auth);
});

// 11) Navigation
document.getElementById("nav-calendar").addEventListener("click", () => showView("calendar"));
document.getElementById("nav-packlist").addEventListener("click", () => showView("packlist"));
document.getElementById("nav-timeline").addEventListener("click", () => showView("timeline"));
// Neuer Listener für externen Link
document.getElementById("nav-kennzeichen").addEventListener("click", () => {
  window.open("https://eztof.github.io/Kennzeichen-ZYO/", "_blank");
});
document.getElementById("nav-heart").addEventListener("click", () => {
  window.location.href = "heart.html";
});
document.querySelectorAll(".back-btn").forEach(btn =>
  btn.addEventListener("click", () => showView("home"))
);

// 12) Kategorie erstellen
categoryForm.addEventListener("submit", async e => {
  e.preventDefault();
  const name = categoryInput.value.trim();
  if (!name) return;
  await addDoc(collection(db, "packlist_categories"), {
    name,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid
  });
  categoryInput.value = "";
});

// 13) Packliste: Neues Item
packForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = packInput.value.trim();
  const cat  = categorySelect.value || null;
  if (!text) return;
  addDoc(collection(db, "packlist_items"), {
    text,
    done: false,
    categoryId: cat,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid
  });
  packInput.value = "";
});

// 14) **Kalender: Neues Event**
eventForm.addEventListener("submit", async e => {
  e.preventDefault();
  const title = eventTitle.value.trim();
  const d     = eventDate.value;
  const t     = eventTime.value;
  if (!title || !d || !t) return;
  const dt = Timestamp.fromDate(new Date(`${d}T${t}`));
  await addDoc(collection(db, "calendar_events"), {
    title,
    datetime: dt,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid
  });
  eventTitle.value = "";
  eventDate.value = "";
  eventTime.value = "";
});

// 15) Renderer Packliste
function rebuildCategorySelect() {
  categorySelect.innerHTML = `<option value="">– Keine Kategorie –</option>` +
    categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}
function renderPacklist() {
  packListUl.innerHTML = "";
  categories.concat([{ id: null, name: "Ohne Kategorie" }]).forEach(cat => {
    const hdr = document.createElement("li");
    hdr.textContent = cat.name;
    hdr.classList.add("category-header");
    packListUl.append(hdr);
    items.filter(i => (i.categoryId || null) === cat.id).forEach(i => {
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.checked = i.done;
      cb.addEventListener("change", () =>
        updateDoc(doc(db, "packlist_items", i.id), { done: cb.checked, updatedAt: serverTimestamp() })
      );
      const span = document.createElement("span");
      span.textContent = i.text;
      span.contentEditable = true;
      span.classList.add("packlist-text");
      if (i.done) span.classList.add("completed");
      span.addEventListener("blur", () => {
        const t = span.textContent.trim();
        if (t && t !== i.text) {
          updateDoc(doc(db, "packlist_items", i.id), { text: t, updatedAt: serverTimestamp() });
        } else {
          span.textContent = i.text;
        }
      });
      const del = document.createElement("button");
      del.textContent = "🗑";
      del.addEventListener("click", () =>
        deleteDoc(doc(db, "packlist_items", i.id))
      );
      li.append(cb, span, del);
      packListUl.append(li);
    });
  });
}

// 16) **Renderer Kalender**
function renderCalendar() {
  eventListUl.innerHTML = "";
  let lastDate = null;
  events.forEach(ev => {
    const d = ev.datetime.toDate();
    const dateStr = d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    if (dateStr !== lastDate) {
      const hdr = document.createElement("li");
      hdr.textContent = dateStr;
      hdr.classList.add("category-header");
      eventListUl.append(hdr);
      lastDate = dateStr;
    }
    const li = document.createElement("li");
    const spanTime = document.createElement("span");
    spanTime.textContent = timeStr;
    spanTime.classList.add("event-datetime");
    const spanTitle = document.createElement("span");
    spanTitle.textContent = ev.title;
    spanTitle.contentEditable = true;
    spanTitle.classList.add("event-title");
    spanTitle.addEventListener("blur", () => {
      const nt = spanTitle.textContent.trim();
      if (nt && nt !== ev.title) {
        updateDoc(doc(db, "calendar_events", ev.id), { title: nt, updatedAt: serverTimestamp() });
      } else {
        spanTitle.textContent = ev.title;
      }
    });
    const del = document.createElement("button");
    del.textContent = "🗑";
    del.addEventListener("click", () =>
      deleteDoc(doc(db, "calendar_events", ev.id))
    );
    li.append(spanTime, spanTitle, del);
    eventListUl.append(li);
  });
}
