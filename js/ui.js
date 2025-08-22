// /js/ui.js
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function show(el) { el.classList.remove("hidden"); }
export function hide(el) { el.classList.add("hidden"); }

export function setText(el, text) { el.textContent = text; }

export function setError(el, msg) {
  el.textContent = msg || "";
}
