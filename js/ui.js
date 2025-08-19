// js/ui.js
export const el = (sel, root = document) => root.querySelector(sel);
export const els = (sel, root = document) => [...root.querySelectorAll(sel)];


export function html(strings, ...vals) {
const tpl = document.createElement("template");
tpl.innerHTML = String.raw({ raw: strings }, ...vals);
return tpl.content;
}


export function mount(node, target) {
target.innerHTML = "";
target.appendChild(node);
}


export function toast(msg, ms = 2500) {
const t = document.createElement("div");
t.className = "toast";
t.textContent = msg;
document.body.appendChild(t);
setTimeout(() => t.remove(), ms);
}


export function setActiveNav(path) {
document.querySelectorAll(".top-nav a").forEach(a => {
a.classList.toggle("active", a.getAttribute("href") === `#${path}`);
});
}