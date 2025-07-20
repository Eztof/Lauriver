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

// 3) Hilfsfunktionen
function emailFromUsername(u) {
  return `${u}@lauriver.app`;
}
function randomColor() {
  return `hsl(${Math.random()*360}, 70%, 60%)`;
}
async function updateUsage(updates) {
  const u = auth.currentUser;
  if (!u) return;
  await setDoc(doc(db, "usage_logs", u.uid), { ...updates, lastUpdate: serverTimestamp() }, { merge: true });
}

// 4) UI‑Referenzen
const sections = {
  login:    document.getElementById("login-section"),
  register: document.getElementById("register-section"),
  home:     document.getElementById("home-section"),
  calendar: document.getElementById("calendar-section"),
  packlist: document.getElementById("packlist-section")
};
const logoutBtn       = document.getElementById("logout-btn");
const navCalendarBtn  = document.getElementById("nav-calendar");
const navPacklistBtn  = document.getElementById("nav-packlist");

const categoryForm    = document.getElementById("category-form");
const categoryInput   = document.getElementById("category-input");
const calendarDiv     = document.getElementById("calendar");
const dateSelDiv      = document.getElementById("date-selection");
const selectedDateH3  = document.getElementById("selected-date");
const dateForm        = document.getElementById("date-form");
const timelineDiv     = document.getElementById("timeline");

const categoryFormPack  = document.getElementById("category-form-pack");
const categoryInputPack = document.getElementById("category-input-pack");
const packForm          = document.getElementById("packlist-form");
const packInput         = document.getElementById("packlist-input");
const categorySelect    = document.getElementById("category-select");
const packListUl        = document.getElementById("packlist-items");

// 5) State
let categories = [];
let items      = [];
let selections = [];
let selectedDate = null;

let catUnsub, packUnsub, selUnsub;

// 6) View‑Switch
function showView(name) {
  Object.values(sections).forEach(s => s.classList.add("hidden"));
  sections[name].classList.remove("hidden");
  updateUsage({ [`lastView_${name}`]: serverTimestamp() });
}

// 7) Auth‑Listener & Live‑Listener starten
onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById("main-header").classList.remove("hidden");
    showView("home");
    updateUsage({ lastLogin: serverTimestamp(), displayName: user.displayName });

    // --- Kategorien ---
    if (catUnsub) catUnsub();
    catUnsub = onSnapshot(
      query(collection(db, "packlist_categories"), orderBy("createdAt")),
      snap => {
        categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        rebuildCategoryUI();
        renderCalendar();
        renderTimeline();
        if (selectedDate) loadDateSelection(selectedDate);
      }
    );

    // --- Packliste ---
    if (packUnsub) packUnsub();
    packUnsub = onSnapshot(
      query(collection(db, "packlist_items"), orderBy("createdAt")),
      snap => {
        items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderPacklist();
      }
    );

    // --- Datumsauswahl (calendar selections) ---
    if (selUnsub) selUnsub();
    selUnsub = onSnapshot(
      collection(db, "calendar_selections"),
      snap => {
        selections = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderTimeline();
        if (selectedDate) loadDateSelection(selectedDate);
      }
    );

    // Erst‑Render
    renderCalendar();
    renderTimeline();

  } else {
    if (catUnsub) catUnsub();
    if (packUnsub) packUnsub();
    if (selUnsub) selUnsub();
    document.getElementById("main-header").classList.add("hidden");
    showView("login");
  }
});

// 8) Login
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

// 9) Registrierung
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

// 10) Links Login ↔ Registrierung
document.getElementById("to-register").addEventListener("click", e => {
  e.preventDefault();
  showView("register");
});
document.getElementById("to-login").addEventListener("click", e => {
  e.preventDefault();
  showView("login");
});

// 11) Logout
logoutBtn.addEventListener("click", async () => {
  await updateUsage({ lastLogout: serverTimestamp() });
  signOut(auth);
});

// 12) Navigation Startseite
navCalendarBtn.addEventListener("click", () => showView("calendar"));
navPacklistBtn.addEventListener("click", () => showView("packlist"));
document.querySelectorAll(".back-btn").forEach(btn =>
  btn.addEventListener("click", () => showView("home"))
);

// 13) Kategorien erstellen (global)
categoryForm.addEventListener("submit", async e => {
  e.preventDefault();
  const name = categoryInput.value.trim();
  if (!name) return;
  await addDoc(collection(db, "packlist_categories"), {
    name,
    color: randomColor(),
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid
  });
  categoryInput.value = "";
});
categoryFormPack.addEventListener("submit", async e => {
  e.preventDefault();
  const name = categoryInputPack.value.trim();
  if (!name) return;
  await addDoc(collection(db, "packlist_categories"), {
    name,
    color: randomColor(),
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid
  });
  categoryInputPack.value = "";
});

// 14) Packliste: Neues Item
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

// 15) Datumsauswahl: speichern
function saveDateSelection() {
  const checked = Array.from(dateForm.querySelectorAll('input[name="date-category"]:checked'))
    .map(cb => cb.value);
  const ref = doc(db, "calendar_selections", selectedDate);
  if (checked.length) {
    setDoc(ref, { categories: checked, updatedAt: serverTimestamp() }, { merge: true });
  } else {
    deleteDoc(ref);
  }
}

// 16) Hilfs‑Renderer: Kategorien & Datumsauswahl‑Form
function rebuildCategoryUI() {
  // Packliste‑Dropdown
  categorySelect.innerHTML = `<option value="">– Keine Kategorie –</option>` +
    categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");

  // Datumsauswahl‑Form
  dateForm.innerHTML = "";
  categories.forEach(c => {
    const label = document.createElement("label");
    label.style.color = c.color;
    label.innerHTML = `<input type="checkbox" name="date-category" value="${c.id}"> ${c.name}`;
    dateForm.append(label);
  });
  dateForm.querySelectorAll('input[name="date-category"]').forEach(cb =>
    cb.addEventListener("change", saveDateSelection)
  );
}

// 17) Render Calendar
function renderCalendar() {
  calendarDiv.innerHTML = "";
  // Wochentags-Header
  ["Mo","Di","Mi","Do","Fr","Sa","So"].forEach(d=>{
    const hdr = document.createElement("div");
    hdr.textContent = d;
    hdr.classList.add("calendar-header");
    calendarDiv.append(hdr);
  });
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const first = new Date(year, month, 1);
  const last  = new Date(year, month+1, 0).getDate();
  let startDay = first.getDay(); // 0=So,1=Mo...
  startDay = startDay === 0 ? 6 : startDay-1;
  // leere Felder
  for(let i=0;i<startDay;i++){
    const empty = document.createElement("div");
    empty.classList.add("calendar-day","calendar-empty");
    calendarDiv.append(empty);
  }
  // Tage
  for(let d=1; d<=last; d++){
    const cell = document.createElement("div");
    cell.textContent = d;
    cell.classList.add("calendar-day");
    const ds = new Date(year,month,d).toISOString().slice(0,10);
    cell.dataset.date = ds;
    cell.addEventListener("click",()=>handleDateClick(ds));
    calendarDiv.append(cell);
  }
}

// 18) Handle Date Click
function handleDateClick(dateStr) {
  selectedDate = dateStr;
  selectedDateH3.textContent = new Date(dateStr).toLocaleDateString("de-DE", {
    day:"2-digit",month:"2-digit",year:"numeric"
  });
  dateSelDiv.classList.remove("hidden");
  loadDateSelection(dateStr);
  updateUsage({ lastDateViewed: dateStr });
}

// 19) Load Date Selection
function loadDateSelection(dateStr) {
  const doc = selections.find(s => s.id === dateStr);
  const checked = doc ? doc.categories : [];
  dateForm.querySelectorAll('input[name="date-category"]').forEach(cb => {
    cb.checked = checked.includes(cb.value);
  });
}

// 20) Render Timeline
function renderTimeline() {
  timelineDiv.innerHTML = "";
  // Gruppen nach Woche (Mo–So)
  const weeks = {};
  selections.forEach(s => {
    const d = new Date(s.id);
    // nur selektionen mit ≥1 Kategorie
    if (!s.categories?.length) return;
    let wday = d.getDay(); // 0=So
    let monday = new Date(d);
    const diff = (wday === 0 ? -6 : 1 - wday);
    monday.setDate(d.getDate() + diff);
    const key = monday.toISOString().slice(0,10);
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(s);
  });
  // sortierte Wochenschlüssel
  Object.keys(weeks).sort().forEach(weekKey => {
    const monday = new Date(weekKey);
    const container = document.createElement("div");
    container.classList.add("week-container");
    for(let i=0;i<7;i++){
      const day = new Date(monday);
      day.setDate(monday.getDate()+i);
      const ds = day.toISOString().slice(0,10);
      const seg = document.createElement("div");
      seg.classList.add("day-segment");
      // finde selection
      const sel = weeks[weekKey].find(x=>x.id===ds);
      if (sel) {
        const cid = sel.categories[0];
        const cat = categories.find(c=>c.id===cid);
        if (cat) seg.style.backgroundColor = cat.color;
      }
      container.append(seg);
    }
    timelineDiv.append(container);
  });
}

// 21) Render Packliste
function renderPacklist() {
  packListUl.innerHTML = "";
  categories.concat([{id:null,name:"Ohne Kategorie",color:"#888"}]).forEach(cat=>{
    const hdr = document.createElement("li");
    hdr.textContent = cat.name;
    hdr.classList.add("category-header");
    packListUl.append(hdr);
    items.filter(i=>(i.categoryId||null)===cat.id).forEach(i=>{
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.checked = i.done;
      cb.addEventListener("change",()=>{
        updateDoc(doc(db,"packlist_items",i.id),{done:cb.checked,updatedAt:serverTimestamp()});
      });
      const span = document.createElement("span");
      span.textContent = i.text;
      span.contentEditable = true;
      span.classList.add("packlist-text");
      if(i.done) span.classList.add("completed");
      span.addEventListener("blur",()=>{
        const t = span.textContent.trim();
        if(t && t!==i.text){
          updateDoc(doc(db,"packlist_items",i.id),{text:t,updatedAt:serverTimestamp()});
        } else {
          span.textContent = i.text;
        }
      });
      const del = document.createElement("button");
      del.textContent = "🗑";
      del.addEventListener("click",()=>{
        deleteDoc(doc(db,"packlist_items",i.id));
      });
      li.append(cb,span,del);
      packListUl.append(li);
    });
  });
}
