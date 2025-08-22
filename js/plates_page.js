// /js/plates_page.js
import { requireAuthOrRedirect } from "./auth.js";
import { fetchTotals, fetchPicks, pickPlate } from "./plates_api.js";
import { $, renderTotals, renderTable, sortRows, filterRows, setError } from "./plates_ui.js";

let ALL_ROWS = [];
let sortKey = "date";
let sortDir = "desc"; // neueste zuerst

(async function init() {
  const session = await requireAuthOrRedirect();
  if (!session) return;
  const { client } = session;

  // Badge
  try {
    const { getMyProfile } = await import("./db.js");
    const p = await getMyProfile(client);
    document.getElementById("user-badge").textContent = `Angemeldet als: ${p.username}`;
  } catch {}

  // Button & Inputs
  document.getElementById("btn-pick").addEventListener("click", () => onPick(client));
  document.getElementById("plate-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") onPick(client);
  });
  document.getElementById("search-input").addEventListener("input", onSearch);

  // Sortierung per Header
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (sortKey === key) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortKey = key;
        sortDir = key === "date" ? "desc" : "asc";
      }
      render();
    });
  });

  // Initial laden
  await refresh(client);

  async function refresh(client) {
    const [tot, rows] = await Promise.all([fetchTotals(client), fetchPicks(client)]);
    renderTotals(tot);
    ALL_ROWS = rows;
    render();
  }

  function render() {
    const q = document.getElementById("search-input").value || "";
    const filtered = filterRows(ALL_ROWS, q);
    const sorted = sortRows(filtered, sortKey, sortDir);
    renderTable(sorted);
  }

  async function onPick(client) {
    setError(document.getElementById("pick-error"), "");
    const input = document.getElementById("plate-input");
    const code = input.value.toUpperCase().trim();
    if (!code) {
      setError(document.getElementById("pick-error"), "Bitte Kennzeichen-Code eingeben.");
      return;
    }
    try {
      await pickPlate(client, code);
      input.value = "";
      await refresh(client);
    } catch (e) {
      setError(document.getElementById("pick-error"), e?.message || String(e));
    }
  }
})();
