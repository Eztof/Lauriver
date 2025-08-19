// js/pages/packlist.js
import { html, mount } from "../ui.js";
export async function PacklistPage() {
const node = html`<section class="card"><h2>Packliste</h2><p class="small">Platzhalter</p></section>`;
mount(node, document.getElementById("app"));
}