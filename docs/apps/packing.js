// packing.js
export function render(container, { auth, dbFs }) {
  const uid = auth.currentUser.uid;
  const ref = dbFs.collection('packing').doc(uid);

  container.innerHTML = `
    <button onclick="history.back()">← Zurück</button>
    <h2>Packliste</h2>
    <div>
      <input id="item-input" type="text" placeholder="Gegenstand" style="width:70%;" />
      <button id="add-btn">Hinzufügen</button>
    </div>
    <ul id="items" style="margin-top:1rem; padding-left:1.2rem;"></ul>`;

  const listEl = container.querySelector('#items');
  const inputEl = container.querySelector('#item-input');
  const addBtn  = container.querySelector('#add-btn');

  // Lade vorhandene Liste
  ref.get().then(doc => {
    const arr = doc.exists ? doc.data().items : [];
    arr.forEach(addItemToUI);
  });

  // Hinzufügen
  addBtn.addEventListener('click', async () => {
    const txt = inputEl.value.trim();
    if (!txt) return;
    const doc = await ref.get();
    const arr = doc.exists ? doc.data().items : [];
    arr.push(txt);
    await ref.set({ items: arr });
    addItemToUI(txt);
    inputEl.value = '';
  });

  function addItemToUI(txt) {
    const li = document.createElement('li');
    li.textContent = txt;
    li.addEventListener('click', async () => {
      // Entfernen on click
      let arr = (await ref.get()).data().items;
      arr = arr.filter(x => x !== txt);
      await ref.set({ items: arr });
      li.remove();
    });
    listEl.append(li);
  }
}
