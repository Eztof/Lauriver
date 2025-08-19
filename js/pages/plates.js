// js/pages/plates.js
import { html, mount } from "../ui.js";
export async function PlatesPage() {
const node = html`<section class="card"><h2>Kennzeichen</h2><p class="small">Platzhalter</p></section>`;
mount(node, document.getElementById("app"));
}