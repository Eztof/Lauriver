// calendar.js
export function render(container, { auth, dbFs }) {
  const uid = auth.currentUser.uid;
  const col = dbFs.collection('calendar').doc(uid).collection('events');

  container.innerHTML = `
    <button onclick="history.back()">← Zurück</button>
    <h2>Kalender</h2>
    <div>
      <input id="date-input" type="date" />
      <input id="desc-input" type="text" placeholder="Beschreibung" style="width:60%;" />
      <button id="add-event">Hinzufügen</button>
    </div>
    <ul id="events" style="margin-top:1rem; padding-left:1.2rem;"></ul>`;

  const listEl = container.querySelector('#events');
  const dateEl = container.querySelector('#date-input');
  const descEl = container.querySelector('#desc-input');
  const addBtn = container.querySelector('#add-event');

  // Lade Events
  col.orderBy('date').onSnapshot(snap => {
    listEl.innerHTML = '';
    snap.forEach(doc => {
      const ev = doc.data();
      const li = document.createElement('li');
      li.textContent = `${ev.date} – ${ev.desc}`;
      li.addEventListener('click', () => doc.ref.delete());
      listEl.append(li);
    });
  });

  // Neues Event
  addBtn.addEventListener('click', () => {
    const date = dateEl.value;
    const desc = descEl.value.trim();
    if (!date || !desc) return;
    col.add({ date, desc });
    dateEl.value = descEl.value = '';
  });
}
