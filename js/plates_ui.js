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
  const fmt = (iso) =>
    new Date(iso).toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.code}</td>
      <td>${escapeHtml(r.label)}</td>
      <td>${escapeHtml(r.state_name || r.state_code || "")}</td>
      <td>${fmt(r.created_at)}</td>
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
    else if (key === "state") { va = a.state_name || a.state_code; vb = b.state_name || b.state_code; }
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

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
