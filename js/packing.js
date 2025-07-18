import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  query, where, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
// Config
initializeApp({ /* ... */ });
const auth = getAuth();
const db   = getFirestore();

// Auth‐Guard
onAuthStateChanged(auth,user=>{
  if(!user) location.href="login.html";
});
document.getElementById("btn-logout").onclick = ()=> signOut(auth);

// Elemente
const form = document.getElementById("packing-form");
const input= document.getElementById("new-item");
const ul   = document.getElementById("packing-list");

// Realtime‑Updates
onSnapshot(collection(db,"packing"),snap=>{
  ul.innerHTML="";
  snap.forEach(docSnap=>{
    const data = docSnap.data();
    const li = document.createElement("li");
    li.className="packing-item";
    const all  = data.participants||[];
    const done = data.checked||[];
    if(all.length && all.every(u=>done.includes(u))) li.classList.add("green");
    const cb = document.createElement("input");
    cb.type="checkbox"; cb.checked = done.includes(auth.currentUser.uid);
    cb.onchange=async()=>{
      const idx = done.indexOf(auth.currentUser.uid);
      if(cb.checked && idx===-1) done.push(auth.currentUser.uid);
      if(!cb.checked && idx!==-1) done.splice(idx,1);
      await updateDoc(doc(db,"packing",docSnap.id),{checked:done});
    };
    li.append(cb);
    li.append(Object.assign(document.createElement("span"),{textContent:data.description}));
    const p = Object.assign(document.createElement("div"),{className:"participants",
      textContent:`Beteiligte: ${all.length}`});
    li.append(p);
    if(data.createdBy===auth.currentUser.uid){
      const btn = Object.assign(document.createElement("button"),{textContent:"✖"});
      btn.onclick=()=>deleteDoc(doc(db,"packing",docSnap.id));
      li.append(btn);
    }
    ul.append(li);
  });
});

// Neues Item
form.onsubmit=async e=>{
  e.preventDefault();
  const desc = input.value.trim(); if(!desc)return;
  await addDoc(collection(db,"packing"),{
    description: desc,
    createdBy: auth.currentUser.uid,
    participants:[auth.currentUser.uid],
    checked:[],
    createdAt:new Date()
  });
  input.value="";
};
