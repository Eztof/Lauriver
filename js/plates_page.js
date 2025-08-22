// /js/plates_page.js
import { requireAuthOrRedirect } from "./auth.js";
import { fetchTotals, fetchPicks, pickPlate } from "./plates_api.js";
import { $, renderTotals, renderTable, sortRows, filterRows, setError } from "./plates_ui.js";

let ALL_ROWS = [];
let sortKey = "date";      // Standard: Datum
let sortDir = "desc";      // neueste zuerst

// Standard-Spalten: Code + Ort
const DEFAULT_COLS = ["code", "label"];

(function init() {
  boot().catch((e) => console.error(e));
})();

async function boot() {
  const session = await requireAuthOrRedirect();
  if (!session) return;
  const { client } = session;

  // Badge mit Username
  try {
    const { getMyProfile } = await import("./db.js");
    const p = await getMyProfile(client);
    $("#user-badge").textContent = `Angemeldet als: ${p.username}`;
  } catch {
    $("#user-badge").textContent = "Kennzeichen";
  }

  // Checkbox-Defaults setzen (falls HTML geändert wurde)
  setInitialColumns(DEFAULT_COLS);

  // Events: Pick, Suche
  $("#btn-pick").addEventListener("click", () => onPick(client));
  $("#plate-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onPick(client);
    }
  });
  $("#search-input").addEventListener("input", () => render());

  // Events: Columns (mindestens eine Spalte aktiv lassen)
  $$(".options input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const cols = getSelectedColumns();
      if (!e.target.checked && cols.length === 0) {
        // letzte Spalte darf nicht abgewählt werden
        e.target.checked = true;
        return;
      }
      render(); // neu zeichnen mit aktuellen Spalten
    });
  });

  await refresh(client);
}

function setInitialColumns(cols) {
  const all = $$(".options input[type=checkbox]");
  // zuerst alle aus
  all.forEach((cb) => (cb.checked = false));
  // dann gewünschte an
  cols.forEach((key) => {
    const cb = $(`.options input[data-col="${key}"]`);
    if (cb) cb.checked = true;
  });
}

async function refresh(client) {
  try {
    const [tot, rows] = await Promise.all([fetchTotals(client), fetchPicks(client)]);
    renderTotals(tot);
    ALL_ROWS = rows;
    render();
  } catch (e) {
    console.error("Fehler beim Laden:", e);
    setError($("#pick-error"), e?.message || String(e));
    ALL_ROWS = [];
    render();
  }
}

function render() {
  const cols = getSelectedColumns();
  const q = $("#search-input").value || "";
  const filtered = filterRows(ALL_ROWS, q);
  const sorted = sortRows(filtered, sortKey, sortDir);

  renderTable(sorted, cols, sortKey, sortDir);

  // Header-Click-Events (nach dem Rendern neu binden)
  $$("#picks-head th[data-sort]").forEach((th) => {
    th.onclick = () => {
      const key = th.getAttribute("data-sort");
      if (sortKey === key) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortKey = key;
        sortDir = key === "date" ? "desc" : "asc";
      }
      render();
    };
  });
}

function getSelectedColumns() {
  return $$(".options input[type=checkbox]:checked").map((cb) => cb.dataset.col);
}

async function onPick(client) {
  const errEl = $("#pick-error");
  setError(errEl, "");
  const input = $("#plate-input");
  const code = input.value.toUpperCase().trim();
  if (!code) {
    setError(errEl, "Bitte Kennzeichen-Code eingeben.");
    return;
  }
  try {
    await pickPlate(client, code);
    input.value = "";
    await refresh(client);
  } catch (e) {
    setError(errEl, e?.message || String(e));
  }
}
