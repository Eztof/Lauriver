// /js/plates_ui.js
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function renderTotals({ total, picked }) {
  $("#count-total").textContent = total;
  $("#count-picked").textContent = picked;
  const pct = total > 0 ? Math.round((picked / total) * 100) : 0;
  $("#progress").style.width = `${pct}%`;
}

export function renderTable(rows) {
  const tbody = $("#picks-body");
  tbody.innerHTML = "";

  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(r.code)}</td>
      <td>${escapeHtml(r.label)}</td>
      <td title="${escapeHtml(r.state_name || r.state_code || "")}">${escapeHtml(r.state_code || "")}</td>
      <td>${formatShortDateTime(r.created_at)}</td>
    `;
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
    (r.state_code || "").toLowerCase().includes(needle)
  );
}

export function setError(el, msg) {
  el.textContent = msg || "";
}

/* Helpers */
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function pad2(n) { return String(n).padStart(2, "0"); }

/* kompaktes Datum: 12.03.25 14:05 */
function formatShortDateTime(iso) {
  const d = new Date(iso);
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yy = String(d.getFullYear()).slice(-2);
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${dd}.${mm}.${yy} ${hh}:${mi}`;
}
