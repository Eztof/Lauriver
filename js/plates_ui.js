// /js/plates_ui.js
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const TITLES = {
  code: "Code",
  label: "Ort",
  state: "BL",
  date: "Datum",
  player: "Spieler",
};

export function renderTotals({ total, picked }) {
  $("#count-total").textContent = total;
  $("#count-picked").textContent = picked;
  const pct = total > 0 ? Math.round((picked / total) * 100) : 0;
  $("#progress").style.width = `${pct}%`;
}

export function renderTable(rows, columns, sortKey, sortDir) {
  const theadRow = $("#picks-head");
  const tbody = $("#picks-body");
  theadRow.innerHTML = "";
  tbody.innerHTML = "";

  // Header
  for (const col of columns) {
    const th = document.createElement("th");
    th.dataset.sort = col;
    th.setAttribute("scope", "col");
    th.textContent = `${TITLES[col]} ▲▼`;
    th.setAttribute("aria-sort", col === sortKey ? (sortDir === "desc" ? "descending" : "ascending") : "none");
    theadRow.appendChild(th);
  }

  // Body
  for (const r of rows) {
    const tr = document.createElement("tr");
    for (const col of columns) {
      const td = document.createElement("td");
      if (col === "code") {
        td.textContent = r.code;
        td.className = "cell-nowrap";
      } else if (col === "label") {
        td.textContent = r.label || "";
        td.className = "cell-wrap";
      } else if (col === "state") {
        td.textContent = r.state_code || "";
        td.title = r.state_name || r.state_code || "";
        td.className = "cell-nowrap cell-center";
      } else if (col === "date") {
        td.textContent = formatShortDateTime(r.created_at);
        td.className = "cell-nowrap";
      } else if (col === "player") {
        td.textContent = r.username || shortUuid(r.user_id);
        td.title = r.username ? `@${r.username}` : r.user_id;
        td.className = "cell-nowrap";
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

export function sortRows(rows, key, dir) {
  const s = [...rows];
  const mult = dir === "desc" ? -1 : 1;
  s.sort((a, b) => {
    let va, vb;
    if (key === "code") { va = a.code; vb = b.code; }
    else if (key === "label") { va = a.label; vb = b.label; }
    else if (key === "state") { va = a.state_code || a.state_name; vb = b.state_code || b.state_name; }
    else if (key === "player") { va = a.username || a.user_id; vb = b.username || b.user_id; }
    else if (key === "date") { va = a.created_at; vb = b.created_at; }
    va = (va ?? "").toString();
    vb = (vb ?? "").toString();
    if (va < vb) return -1 * mult;
    if (va > vb) return 1 * mult;
    return 0;
  });
  return s;
}

export function filterRows(rows, q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((r) =>
    r.code.toLowerCase().includes(needle) ||
    (r.label || "").toLowerCase().includes(needle) ||
    (r.state_name || "").toLowerCase().includes(needle) ||
    (r.state_code || "").toLowerCase().includes(needle) ||
    (r.username || "").toLowerCase().includes(needle) ||
    (r.user_id || "").toLowerCase().includes(needle)
  );
}

export function setError(el, msg) {
  el.textContent = msg || "";
}

/* Helpers */
function pad2(n) { return String(n).padStart(2, "0"); }
function shortUuid(u) { return (u || "").split("-")[0] || ""; }
function formatShortDateTime(iso) {
  const d = new Date(iso);
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yy = String(d.getFullYear()).slice(-2);
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${dd}.${mm}.${yy} ${hh}:${mi}`;
}
