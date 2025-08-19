// js/pages/plates.js
import { html, mount, toast } from "../ui.js";
import { countPlates, countPicked, getPlateInfo, pickPlate, listPicks, unpickPlate } from "../db.js";
import { supabase } from "../supabaseClient.js";

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

function rowPicked(p) {
  return html`<div class="list-item" data-code="${p.plate_code}">
    <div>
      <div><strong>${p.plate_code}</strong> <span class="small">— ${p.picked_user_display_name || "Unbekannt"}</span></div>
      <div class="small">${fmtDate(p.picked_at)}</div>
    </div>
    <!-- Optional: eigener Pick zurücknehmen -->
    <button class="btn danger btn-unpick">Zurücknehmen</button>
  </div>`;
}

function filterSort(items, q, sortKey) {
  const s = (q || "").toUpperCase().trim();
  let out = items.filter(x =>
    x.plate_code.toUpperCase().includes(s) ||
    (x.picked_user_display_name || "").toUpperCase().includes(s)
  );
  if (sortKey === "code_asc") out.sort((a,b)=>a.plate_code.localeCompare(b.plate_code, "de"));
  else if (sortKey === "code_desc") out.sort((a,b)=>b.plate_code.localeCompare(a.plate_code, "de"));
  else if (sortKey === "time_asc") out.sort((a,b)=>new Date(a.picked_at)-new Date(b.picked_at));
  else /* time_desc */ out.sort((a,b)=>new Date(b.picked_at)-new Date(a.picked_at));
  return out;
}

export async function PlatesPage() {
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = user?.user_metadata?.display_name || null;

  const node = html`
    <section class="card">
      <h2>Kennzeichen picken</h2>
      <div class="row">
        <input id="plate-input" class="input" placeholder="z. B. D, ABG, M, K..." />
        <button id="btn-pick" class="btn accent">Picken</button>
      </div>
      <div id="plate-info" class="small" style="margin-top:8px"></div>
    </section>

    <div style="height:16px"></div>

    <section class="card">
      <h2 style="display:flex;align-items:center;gap:8px">
        Fortschritt
        <span id="progress-badge" class="badge"></span>
      </h2>
      <p class="small">Ziel: 768 Kennzeichen</p>
    </section>

    <div style="height:16px"></div>

    <section class="card">
      <h2>Gepickte Kennzeichen</h2>
      <div class="row">
        <input id="search" class="input" placeholder="Suche (Code oder Name)" />
        <select id="sort" class="input">
          <option value="time_desc">Neueste zuerst</option>
          <option value="time_asc">Älteste zuerst</option>
          <option value="code_asc">Code A→Z</option>
          <option value="code_desc">Code Z→A</option>
        </select>
      </div>
      <div id="picked-list" class="list"></div>
    </section>
  `;
  mount(node, document.getElementById("app"));

  const elInput = document.getElementById("plate-input");
  const elBtn = document.getElementById("btn-pick");
  const elInfo = document.getElementById("plate-info");
  const elBadge = document.getElementById("progress-badge");
  const elList = document.getElementById("picked-list");
  const elSearch = document.getElementById("search");
  const elSort = document.getElementById("sort");

  let cache = [];

  async function refreshCounts() {
    const [total, picked] = await Promise.all([countPlates(), countPicked()]);
    // Falls noch nicht alle 768 importiert sind, zeigen wir total / 768
    const base = 768;
    const denom = Math.max(total, base); // wenn total < 768, nimm 768
    elBadge.textContent = `${picked} / ${denom}`;
  }

  async function refreshList() {
    cache = await listPicks();
    renderList();
  }

  function renderList() {
    const filtered = filterSort(cache, elSearch.value, elSort.value);
    elList.innerHTML = "";
    filtered.forEach(item => {
      const row = rowPicked(item);
      elList.appendChild(row);
    });
    // Unpick nur erlauben, wenn es der eigene Pick ist (wir kennen die user_id nicht hier – einfach backend prüfen)
    elList.querySelectorAll(".btn-unpick").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const code = e.currentTarget.closest(".list-item").dataset.code;
        try {
          await unpickPlate(code);    // RLS lässt nur eigenen Pick löschen
          toast(`Pick ${code} entfernt`);
          await refreshCounts();
          await refreshList();
        } catch (err) {
          alert(err.message || "Konnte Pick nicht entfernen (vermutlich nicht dein Pick).");
        }
      });
    });
  }

  elSort.addEventListener("change", renderList);
  elSearch.addEventListener("input", renderList);

  elInput.addEventListener("input", () => {
    elInput.value = elInput.value.toUpperCase().replace(/[^A-ZÄÖÜ]/g, "");
  });

  elBtn.addEventListener("click", async () => {
    const code = elInput.value.toUpperCase().trim();
    if (!code) return alert("Bitte Kennzeichen-Code eingeben (nur Buchstaben).");

    // Info anzeigen
    const info = await getPlateInfo(code);
    if (!info) {
      elInfo.innerHTML = `Unbekannter Code <strong>${code}</strong> – bitte zuerst in Supabase importieren.`;
      return;
    }
    elInfo.innerHTML = `
      <span class="small"> ${code} – ${info.label} ${info.state_name ? `(${info.state_name})` : ""} ${info.is_legacy ? " – veraltet" : ""}</span>
    `;

    try {
      await pickPlate({ code, displayName });
      toast(`Gepickt: ${code}`);
      elInput.value = "";
      await refreshCounts();
      await refreshList();
    } catch (e) {
      // Duplikat?
      const msg = (e?.message || "").toLowerCase();
      if (msg.includes("duplicate") || msg.includes("unique") || msg.includes("conflict")) {
        alert(`Schon gepickt: ${code}`);
      } else {
        alert(e.message || "Fehler beim Picken");
      }
    }
  });

  await refreshCounts();
  await refreshList();
}
