// packing.js
import { initNav, initAuthGuard, initLogout, auth } from "./common.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

initNav();
initAuthGuard();
initLogout();

const db = getFirestore();
const form = document.getElementById("packing-form");
const input = document.getElementById("new-item");
const ul = document.getElementById("packing-list");

onSnapshot(collection(db,"packing"), snap => {
  ul.innerHTML = "";
  snap.forEach(d => {
    const data = d.data();
    const li = document.createElement("li");
    li.className = "packing-item";
    const all  = data.participants||[];
    const done = data.checked||[];
    if(all.length && all.every(u=>done.includes(u))) li.classList.add("green");

    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = done.includes(auth.currentUser.uid);
    cb.onchange = async ()=>{
      const idx = done.indexOf(auth.currentUser.uid);
      if(cb.checked && idx===-1) done.push(auth.currentUser.uid);
      if(!cb.checked && idx!==-1) done.splice(idx,1);
      await updateDoc(doc(db,"packing",d.id),{checked:done});
    };
    li.append(cb);

    const span = document.createElement("span");
    span.textContent = data.description;
    li.append(span);

    const p = document.createElement("div");
    p.className = "participants";
    p.textContent = `Beteiligte: ${all.length}`;
    li.append(p);

    if(data.createdBy === auth.currentUser.uid){
      const btn = document.createElement("button");
      btn.textContent = "✖";
      btn.onclick = ()=> deleteDoc(doc(db,"packing",d.id));
      li.append(btn);
    }

    ul.append(li);
  });
});

form.addEventListener("submit", async e=>{
  e.preventDefault();
  const desc = input.value.trim(); if(!desc) return;
  await addDoc(collection(db,"packing"),{
    description: desc,
    createdBy: auth.currentUser.uid,
    participants:[auth.currentUser.uid],
    checked:[],
    createdAt:new Date()
  });
  input.value = "";
});
