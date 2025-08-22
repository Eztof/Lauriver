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

  // Badge mit Username
  try {
    const { getMyProfile } = await import("./db.js");
    const p = await getMyProfile(client);
    $("#user-badge").textContent = `Angemeldet als: ${p.username}`;
  } catch {
    $("#user-badge").textContent = "Kennzeichen";
  }

  // Events
  $("#btn-pick").addEventListener("click", () => onPick(client));
  $("#plate-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onPick(client);
    }
  });
  $("#search-input").addEventListener("input", onSearch);
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

  await refresh(client);

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
    const q = $("#search-input").value || "";
    const filtered = filterRows(ALL_ROWS, q);
    const sorted = sortRows(filtered, sortKey, sortDir);
    renderTable(sorted);
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

  function onSearch() {
    render();
  }
})();
