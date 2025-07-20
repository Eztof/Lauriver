// js/packlist.js
import { auth, firestore } from "./firebase-config.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// DOM-Elemente
const overview    = document.getElementById('lists-overview');
const detail      = document.getElementById('list-detail');
const listsEl     = document.getElementById('lists');
const itemsEl     = document.getElementById('items');
const btnNewList  = document.getElementById('btn-new-list');
const btnBack     = document.getElementById('btn-back');
const btnClose    = document.getElementById('btn-close-detail');
const btnAddItem  = document.getElementById('btn-add-item');
const btnDeleteList = document.getElementById('btn-delete-list');
const listTitleEl = document.getElementById('list-title');

let currentUser, currentListId;

// Auth & Initialisierung
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    loadLists();
  } else {
    window.location.href = 'index.html';
  }
});

// Alle Listen des Users laden
function loadLists() {
  const col = collection(firestore, "users", currentUser.uid, "lists");
  onSnapshot(col, snap => {
    listsEl.innerHTML = '';
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.textContent = data.title;
      // Bearbeiten/Navigieren
      li.addEventListener('click', () => openList(docSnap.id, data.title));
      // Löschen
      const del = document.createElement('button');
      del.textContent = '🗑';
      del.className = 'small danger';
      del.addEventListener('click', e => {
        e.stopPropagation();
        deleteDoc(doc(col, docSnap.id));
      });
      li.appendChild(del);
      listsEl.appendChild(li);
    });
  });
}

// Neue Liste anlegen
btnNewList.addEventListener('click', async () => {
  const title = prompt('Titel der neuen Packliste:');
  if (!title) return;
  await addDoc(collection(firestore, "users", currentUser.uid, "lists"), {
    title,
    createdAt: serverTimestamp()
  });
});

// Liste öffnen
function openList(listId, title) {
  currentListId = listId;
  listTitleEl.textContent = title;
  overview.classList.add('hidden');
  detail.classList.remove('hidden');
  loadItems();
}

// Items laden
function loadItems() {
  const itemsCol = collection(firestore, "users", currentUser.uid, "lists", currentListId, "items");
  onSnapshot(itemsCol, snap => {
    itemsEl.innerHTML = '';
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.textContent = data.text;
      li.style.textDecoration = data.done ? 'line-through' : 'none';
      // Abhaken
      li.addEventListener('click', () => {
        updateDoc(doc(itemsCol, docSnap.id), { done: !data.done });
      });
      // Löschen
      const del = document.createElement('button');
      del.textContent = '🗑';
      del.className = 'small danger';
      del.addEventListener('click', e => {
        e.stopPropagation();
        deleteDoc(doc(itemsCol, docSnap.id));
      });
      li.appendChild(del);
      // Bearbeiten
      const edit = document.createElement('button');
      edit.textContent = '✏️';
      edit.className = 'small';
      edit.addEventListener('click', e => {
        e.stopPropagation();
        const newText = prompt('Neuer Text:', data.text);
        if (newText) updateDoc(doc(itemsCol, docSnap.id), { text: newText });
      });
      li.appendChild(edit);

      itemsEl.appendChild(li);
    });
  });
}

// Item hinzufügen
btnAddItem.addEventListener('click', async () => {
  const text = prompt('Text für neuen Eintrag:');
  if (!text) return;
  await addDoc(collection(firestore, "users", currentUser.uid, "lists", currentListId, "items"), {
    text,
    done: false,
    createdAt: serverTimestamp()
  });
});

// Liste löschen
btnDeleteList.addEventListener('click', async () => {
  if (!confirm('Packliste wirklich löschen?')) return;
  await deleteDoc(doc(firestore, "users", currentUser.uid, "lists", currentListId));
  detail.classList.add('hidden');
  overview.classList.remove('hidden');
});

// Zurück-Button
btnBack.addEventListener('click', () => {
  window.location.href = 'index.html';
});
btnClose.addEventListener('click', () => {
  detail.classList.add('hidden');
  overview.classList.remove('hidden');
});
