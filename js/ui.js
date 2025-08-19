// js/ui.js
export function el(sel, root = document) {
  return root.querySelector(sel);
}

export function html(strings, ...values) {
  const str = strings.reduce((acc, s, i) => acc + s + (values[i] ?? ""), "");
  const tpl = document.createElement("template");
  tpl.innerHTML = str.trim();
  return tpl.content.firstElementChild || tpl.content;
}

export function mount(node, into) {
  if (!into) throw new Error("#app fehlt");
  into.innerHTML = "";
  into.append(node);
  // Boot-Overlay ausblenden
  if (typeof window.__hideBootCover === "function") {
    try { window.__hideBootCover(); } catch {}
  }
}

export function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.classList.add("show"); }, 10);
  setTimeout(() => { t.classList.remove("show"); t.remove(); }, 2500);
}
