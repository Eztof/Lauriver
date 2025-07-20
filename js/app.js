// 1) Firebase‑SDK importieren (Auth + Firestore)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, setPersistence,
  browserLocalPersistence, browserSessionPersistence,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, updateProfile, signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, doc,
  setDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot,
  serverTimestamp, Timestamp
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
function randomColor(){
  return "#"+Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,"0");
}
async function updateUsage(updates){
  const u = auth.currentUser; if(!u) return;
  await setDoc(doc(db,"usage_logs",u.uid),{...updates,lastUpdate:serverTimestamp()},{merge:true});
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
// (Kalender- und Packliste-Refs wie gehabt, siehe vorherige Version…)

// Timeline‑Refs
const catInput       = document.getElementById("tl-category-input");
const catAddBtn      = document.getElementById("tl-add-category");
const monthLabel     = document.getElementById("month-label");
const prevMonthBtn   = document.getElementById("prev-month");
const nextMonthBtn   = document.getElementById("next-month");
const calBody        = document.querySelector("#calendar-table tbody");
const dialog         = document.getElementById("tl-dialog");
const dlgDateLabel   = document.getElementById("tl-dialog-date");
const dlgList        = document.getElementById("tl-dialog-list");
const dlgClose       = document.getElementById("tl-dialog-close");
const strandsDiv     = document.getElementById("tl-strands");

// State Timeline
let today = new Date();
let viewYear = today.getFullYear(), viewMonth = today.getMonth();
let tlCategories = [], tlEntries = [];

// --- View‑Switch ---
function showView(name){
  Object.values(sections).forEach(s=>s.classList.add("hidden"));
  sections[name].classList.remove("hidden");
  updateUsage({[`lastView_${name}`]:serverTimestamp()});
}

// --- Auth‑Listener & Realtime Listener ---
let tlCatUnsub, tlEntryUnsub;
onAuthStateChanged(auth,user=>{
  if(user){
    showView("home");
    updateUsage({lastLogin:serverTimestamp(),displayName:user.displayName});
    // Timeline: Kategorien
    if(tlCatUnsub) tlCatUnsub();
    tlCatUnsub = onSnapshot(
      query(collection(db,"timeline_categories"),orderBy("createdAt")),
      snap=>{
        tlCategories = snap.docs.map(d=>({id:d.id,...d.data()}));
        renderCategories();
      }
    );
    // Timeline: Einträge
    if(tlEntryUnsub) tlEntryUnsub();
    tlEntryUnsub = onSnapshot(
      query(collection(db,"timeline_entries"),orderBy("date")),
      snap=>{
        tlEntries = snap.docs.map(d=>({id:d.id,...d.data()}));
        renderCalendar();
        renderStrands();
      }
    );
  } else {
    tlCatUnsub && tlCatUnsub();
    tlEntryUnsub && tlEntryUnsub();
    showView("login");
  }
});

// --- Login/Register/Logout (wie zuvor) ---
// … code unverändert …

// --- Timeline: Kategorie hinzufügen ---
catAddBtn.addEventListener("click",async()=>{
  const name = catInput.value.trim(); if(!name) return;
  await addDoc(collection(db,"timeline_categories"),{
    name, color: randomColor(),
    createdAt:serverTimestamp(),
    createdBy:auth.currentUser.uid
  });
  catInput.value="";
});

// --- Timeline: Monats-Nav ---
prevMonthBtn.addEventListener("click",()=>{
  viewMonth--; if(viewMonth<0){viewMonth=11;viewYear--;}
  renderCalendar();
});
nextMonthBtn.addEventListener("click",()=>{
  viewMonth++; if(viewMonth>11){viewMonth=0;viewYear++;}
  renderCalendar();
});

// --- Render Kategorien (Dialog-Checkliste) ---
function renderCategories(){
  dlgList.innerHTML="";
  tlCategories.forEach(cat=>{
    const id = `chk-${cat.id}`;
    const wrap = document.createElement("label");
    wrap.innerHTML = `<input type="checkbox" id="${id}"/> ${cat.name}`;
    dlgList.append(wrap);
  });
}

// --- Render Monats-Kalender ---
function renderCalendar(){
  monthLabel.textContent = 
    new Date(viewYear,viewMonth).toLocaleString("de-DE",{month:"long",year:"numeric"});
  calBody.innerHTML="";
  // erster Tag Mo-index
  const first = new Date(viewYear,viewMonth,1);
  const startOffset = (first.getDay()+6)%7;
  // Tage im Monat
  const daysInMonth = new Date(viewYear,viewMonth+1,0).getDate();
  let row = document.createElement("tr");
  // Anfangs‑Leerräume
  for(let i=0;i<startOffset;i++){
    const td = document.createElement("td");
    td.classList.add("inactive");
    row.append(td);
  }
  for(let d=1;d<=daysInMonth;d++){
    if(row.children.length===7){
      calBody.append(row);
      row=document.createElement("tr");
    }
    const td = document.createElement("td");
    td.textContent = d;
    td.dataset.date = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    td.addEventListener("click",onCalendarDateClick);
    row.append(td);
  }
  // restliche Zellen
  while(row.children.length<7){
    const td=document.createElement("td"); td.classList.add("inactive"); row.append(td);
  }
  calBody.append(row);
}

// --- Klick auf Kalender-Datum ---
function onCalendarDateClick(e){
  const date = e.currentTarget.dataset.date;
  dlgDateLabel.textContent = date;
  // markiere Auswahl
  renderCategories();
  // setze Checkboxen nach Firestore‑Einträgen
  const entry = tlEntries.find(x=>x.date.toDate().toISOString().slice(0,10)===date);
  tlCategories.forEach(cat=>{
    const cb = document.getElementById(`chk-${cat.id}`);
    cb.checked = entry?.categoryIds?.includes(cat.id)||false;
  });
  dialog.classList.remove("hidden");
  // Speichern beim Ändern
  dlgList.querySelectorAll("input[type=checkbox]").forEach(cb=>{
    cb.onchange = async ()=>{
      // ermittle alle checked
      const sel = Array.from(dlgList.querySelectorAll("input"))
        .filter(i=>i.checked)
        .map(i=> i.id.replace("chk-",""));
      const docId = date; // nutze Datum als ID
      const ref = doc(db,"timeline_entries",docId);
      if(sel.length){
        await setDoc(ref,{
          date: Timestamp.fromDate(new Date(date)),
          categoryIds: sel,
          updatedAt: serverTimestamp(),
          createdBy: auth.currentUser.uid
        },{merge:true});
      } else {
        // lösche falls keine Auswahl
        deleteDoc(ref);
      }
    };
  });
}

// dialog schließen
dlgClose.addEventListener("click",()=>dialog.classList.add("hidden"));

// --- Render Wochen-Stränge ---
function renderStrands(){
  strandsDiv.innerHTML="";
  if(!tlEntries.length) return;
  // gruppiere nach ISO-Woche-Jahr
  const byWeek = {};
  tlEntries.forEach(ent=>{
    const d = ent.date.toDate();
    // ISO week
    const temp = new Date(d.getFullYear(),d.getMonth(),d.getDate()+4-(d.getDay()||7));
    const weekNo = Math.ceil((((temp - new Date(temp.getFullYear(),0,1)) / 86400000)+1)/7);
    const key = `${temp.getFullYear()}-W${weekNo}`;
    byWeek[key] = byWeek[key]||{year:temp.getFullYear(),week:weekNo,entries:{}};
    byWeek[key].entries[d.toISOString().slice(0,10)] = ent.categoryIds;
  });
  Object.values(byWeek).forEach(week=>{
    const div = document.createElement("div");
    div.className = "week-strand";
    // finde Montag dieser Woche
    const mon = new Date(week.year,0,1 + (week.week-1)*7);
    while(mon.getDay() !== 1) mon.setDate(mon.getDate()-1);
    for(let i=0;i<7;i++){
      const day = new Date(mon); day.setDate(mon.getDate()+i);
      const iso = day.toISOString().slice(0,10);
      const seg = document.createElement("div");
      seg.className = "day-segment";
      const cats = week.entries[iso]||[];
      if(cats.length){
        // falls mehrere, mische Farben – hier: nehme erste
        const col = tlCategories.find(c=>c.id===cats[0])?.color;
        seg.style.background = col||"#888";
      }
      div.append(seg);
    }
    strandsDiv.append(div);
  });
}

// initial render
renderCalendar();
