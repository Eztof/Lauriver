// js/pages/home.js
import { html, mount } from "../ui.js";
import { listBookmarks, addBookmark, deleteBookmark } from "../db.js";
import { uploadFile, signedUrl } from "../storage.js";


function menuCard(href, title, desc) {
return html`<a href="#${href}" class="card" style="text-decoration:none;color:inherit">
<h2>${title}</h2>
<p class="small">${desc}</p>
</a>`;
}


async function MerkenList(container) {
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
MerkenList(container);
});
});
}


export async function HomePage() {
const node = html`
<section class="grid">
${menuCard("/calendar", "Kalender", "Platzhalter – bald")}
${menuCard("/plates", "Kennzeichen", "Platzhalter – bald")}
${menuCard("/packlist", "Packliste", "Platzhalter – bald")}
</section>


<div style="height:16px"></div>


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
<h2>Storage (optional)</h2>
<p class="small">Kleines Beispiel: Datei hochladen → temporären Link holen.</p>
<input id="file" type="file" />
<div style="height:8px"></div>
<button id="upload" class="btn">Hochladen</button>
<div id="file-link" class="small"></div>
</section>
`;


node.getElementById("bm-add").addEventListener("click", async () => {
const title = node.getElementById("bm-title").value.trim();
const url = node.getElementById("bm-url").value.trim();
const notes = node.getElementById("bm-notes").value.trim();
}