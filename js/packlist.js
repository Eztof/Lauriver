import { auth, firestore } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  collection, doc, addDoc, getDocs, onSnapshot,
  updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const overview    = document.getElementById('overview');
const detail      = document.getElementById('detail');
const listsEl     = document.getElementById('lists');
const itemsEl     = document.getElementById('items');
const btnNewList  = document.getElementById('btn-new-list');
const btnBack     = document.getElementById('btn-back');
const btnClose    = document.getElementById('btn-close');
const btnAddItem  = document.getElementById('btn-add-item');
const btnDelete   = document.getElementById('btn-delete-list');
const titleEl     = document.getElementById('list-title');

let currentListId;

// Auth-Check
onAuthStateChanged(auth, user => {
  if (!user) return window.location.href = 'index.html';
  loadLists();
});

// Listen laden (global)
function loadLists() {
  const col = collection(firestore, 'lists');
  onSnapshot(col, snap => {
    listsEl.innerHTML = '';
    snap.forEach(docSnap => {
      const { title } = docSnap.data();
      const li = document.createElement('li');
      li.textContent = title;
      li.addEventListener('click', () => openList(docSnap.id, title));
      listsEl.appendChild(li);
    });
  });
}

// Neue Liste
btnNewList.addEventListener('click', async () => {
  const title = prompt('Titel der neuen Liste:');
  if (!title) return;
  await addDoc(collection(firestore, 'lists'), {
    title,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });
});

// Liste öffnen
function openList(id, title) {
  currentListId = id;
  titleEl.textContent = title;
  overview.classList.add('hidden');
  detail.classList.remove('hidden');
  loadItems();
}

// Items laden
function loadItems() {
  const col = collection(firestore, 'lists', currentListId, 'items');
  onSnapshot(col, snap => {
    itemsEl.innerHTML = '';
    snap.forEach(docSnap => {
      const { text, quantity=1, done } = docSnap.data();
      const li = document.createElement('li');
      li.className = done ? 'done' : '';
      const left = document.createElement('span');
      left.textContent = `${text} ×${quantity}`;
      const actions = document.createElement('div');
      actions.className = 'actions';

      // Check/Uncheck
      const chk = document.createElement('button');
      chk.textContent = done ? '☑' : '☐';
      chk.addEventListener('click', async () => {
        await updateDoc(doc(col, docSnap.id), { done: !done });
      });
      // Edit
      const edt = document.createElement('button');
      edt.textContent = '✎';
      edt.addEventListener('click', async () => {
        const newText = prompt('Text ändern:', text);
        const newQty  = parseInt(prompt('Anzahl:', quantity),10) || quantity;
        await updateDoc(doc(col, docSnap.id), {
          text: newText||text,
          quantity: newQty
        });
      });
      // Delete
      const del = document.createElement('button');
      del.textContent = '🗑';
      del.addEventListener('click', async () => {
        if (confirm('Eintrag löschen?')) {
          await deleteDoc(doc(col, docSnap.id));
        }
      });

      [chk, edt, del].forEach(b=>actions.appendChild(b));
      li.append(left, actions);
      itemsEl.appendChild(li);
    });
  });
}

// Item hinzufügen
btnAddItem.addEventListener('click', async () => {
  const text = prompt('Neuer Eintrag:');
  const qty  = parseInt(prompt('Anzahl:'),10) || 1;
  if (!text) return;
  await addDoc(collection(firestore, 'lists', currentListId, 'items'), {
    text,
    quantity: qty,
    done: false,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });
});

// Liste löschen
btnDelete.addEventListener('click', async () => {
  if (!confirm('Liste löschen?')) return;
  await deleteDoc(doc(firestore, 'lists', currentListId));
  detail.classList.add('hidden');
  overview.classList.remove('hidden');
});

// Navigation zurück
btnBack.addEventListener('click', () => window.location.href = 'index.html');
btnClose.addEventListener('click', () => {
  detail.classList.add('hidden');
  overview.classList.remove('hidden');
});
