// js/pages/bookmarks.js
import { html, mount } from "../ui.js";
import { listBookmarks, addBookmark, deleteBookmark } from "../db.js";
import { uploadFile, signedUrl } from "../storage.js";

async function renderList(container) {
  const list = await listBookmarks();
  container.innerHTML = "";
  list.forEach(item => {
    const row = html`<div class="list-item">
      <div>
        <div><strong>${item.title || "(ohne Titel)"}</strong></div>
        ${item.url ? html`<div class="small"><a target="_blank" href="${item.url}">${item.url}</a></div>` : ""}
        ${item.notes ? html`<div class="small">${item.notes}</div>` : ""}
      </div>
      <button class="btn danger" data-id="${item.id}">Löschen</button>
    </div>`;
    container.appendChild(row);
  });

  container.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteBookmark(btn.getAttribute("data-id"));
      renderList(container);
    });
  });
}

export async function BookmarksPage() {
  const content = html`
    <section class="card">
      <h2>Merken</h2>
      <div class="row">
        <input id="bm-title" class="input" placeholder="Titel" />
        <input id="bm-url" class="input" placeholder="https://… (optional)" />
      </div>
      <div style="height:8px"></div>
      <textarea id="bm-notes" class="input" rows="3" placeholder="Notizen (optional)"></textarea>
      <div style="height:10px"></div>
      <button id="bm-add" class="btn">Speichern</button>

      <div id="bm-list" class="list"></div>
    </section>

    <div style="height:16px"></div>

    <section class="card">
      <h2>Datei in Storage</h2>
      <p class="small">Beispiel: Datei hochladen → temporären Link holen.</p>
      <input id="file" type="file" />
      <div style="height:8px"></div>
      <button id="upload" class="btn">Hochladen</button>
      <div id="file-link" class="small"></div>
    </section>
  `;

  mount(content, document.getElementById("app"));

  document.getElementById("bm-add").addEventListener("click", async () => {
    const title = document.getElementById("bm-title").value.trim();
    const url = document.getElementById("bm-url").value.trim();
    const notes = document.getElementById("bm-notes").value.trim();
    if (!title && !url && !notes) return alert("Bitte etwas eingeben");
    await addBookmark({ title, url, notes });
    document.getElementById("bm-title").value = "";
    document.getElementById("bm-url").value = "";
    document.getElementById("bm-notes").value = "";
    await renderList(document.getElementById("bm-list"));
  });

  document.getElementById("upload").addEventListener("click", async () => {
    const f = document.getElementById("file").files?.[0];
    if (!f) return alert("Bitte eine Datei wählen");
    const path = await uploadFile(f);
    const url = await signedUrl(path);
    document.getElementById("file-link").innerHTML = `Link (1h gültig): <a target="_blank" href="${url}">Öffnen</a>`;
  });

  await renderList(document.getElementById("bm-list"));
}
