import { auth, firestore } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  collection, doc, addDoc, onSnapshot,
  updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// DOM
const overview   = document.getElementById('overview');
const detail     = document.getElementById('detail');
const listsEl    = document.getElementById('lists');
const itemsEl    = document.getElementById('items');
const formNewList = document.getElementById('form-new-list');
const inputNewList = document.getElementById('input-new-list');
const formNewItem = document.getElementById('form-new-item');
const inputNewItem = document.getElementById('input-new-item');
const inputNewQty = document.getElementById('input-new-qty');
const btnBackDetail = document.getElementById('btn-back-detail');
const btnBackOverview = document.getElementById('btn-back-overview');
const btnDeleteList = document.getElementById('btn-delete-list');
const titleDetail = document.getElementById('title-detail');

let currentListId;

// Auth & Redirect
onAuthStateChanged(auth, user => {
  if (!user) return window.location.href = 'index.html';
  bindListOverview();
});

// Übersicht binden
function bindListOverview() {
  const col = collection(firestore, 'lists');
  onSnapshot(col, snap => {
    listsEl.innerHTML = '';
    snap.forEach(docSnap => {
      const { title } = docSnap.data();
      const li = document.createElement('li');
      li.textContent = title;
      li.addEventListener('click', () => openDetail(docSnap.id, title));
      listsEl.append(li);
    });
  });
}

// Neue Liste anlegen
formNewList.addEventListener('submit', async e => {
  e.preventDefault();
  const title = inputNewList.value.trim();
  if (!title) return;
  await addDoc(collection(firestore, 'lists'), {
    title,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });
  inputNewList.value = '';
});

// Detail öffnen
function openDetail(id, title) {
  currentListId = id;
  titleDetail.textContent = title;
  overview.classList.add('hidden');
  detail.classList.remove('hidden');
  btnBackOverview.classList.remove('hidden');
  bindItems();
}

// Items binden
function bindItems() {
  const col = collection(firestore, 'lists', currentListId, 'items');
  onSnapshot(col, snap => {
    itemsEl.innerHTML = '';
    snap.forEach(docSnap => {
      const { text, quantity, done } = docSnap.data();
      const li = document.createElement('li');
      li.classList.toggle('done', done);
      const label = document.createElement('label');
      label.innerHTML = `
        <input type="checkbox" ${done ? 'checked' : ''}>
        <span>${text} (${quantity})</span>
      `;
      // Toggle
      label.querySelector('input').addEventListener('change', async () => {
        await updateDoc(doc(col, docSnap.id), { done: !done });
      });
      // Kontextmenü zum Bearbeiten/Löschen
      li.append(label);
      li.addEventListener('contextmenu', e => {
        e.preventDefault();
        editOrDeleteItem(docSnap.id, text, quantity);
      });
      itemsEl.append(li);
    });
  });
}

// Neues Item
formNewItem.addEventListener('submit', async e => {
  e.preventDefault();
  const text = inputNewItem.value.trim();
  const qty  = parseInt(inputNewQty.value, 10) || 1;
  if (!text) return;
  await addDoc(collection(firestore, 'lists', currentListId, 'items'), {
    text, quantity: qty, done: false,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });
  inputNewItem.value = '';
  inputNewQty.value = '1';
});

// Bearbeiten oder Löschen
async function editOrDeleteItem(itemId, oldText, oldQty) {
  const newText = prompt('Eintrag bearbeiten:', oldText);
  if (newText === null) return; // abbrechen
  const newQty = parseInt(prompt('Anzahl:', oldQty), 10) || oldQty;
  if (newText.trim() === '') {
    // löschen, wenn leer
    await deleteDoc(doc(firestore, 'lists', currentListId, 'items', itemId));
  } else {
    // updaten
    await updateDoc(doc(firestore, 'lists', currentListId, 'items', itemId), {
      text: newText, quantity: newQty
    });
  }
}

// Zurück‑Buttons
btnBackDetail.addEventListener('click', () => {
  detail.classList.add('hidden');
  overview.classList.remove('hidden');
});
btnBackOverview.addEventListener('click', () => {
  detail.classList.add('hidden');
  overview.classList.remove('hidden');
  btnBackOverview.classList.add('hidden');
});

// Liste löschen
btnDeleteList.addEventListener('click', async () => {
  if (confirm('Liste wirklich löschen?')) {
    await deleteDoc(doc(firestore, 'lists', currentListId));
    detail.classList.add('hidden');
    overview.classList.remove('hidden');
  }
});
