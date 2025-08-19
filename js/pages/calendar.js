// js/pages/calendar.js
import { html, mount } from "../ui.js";
export async function CalendarPage() {
const node = html`<section class="card"><h2>Kalender</h2><p class="small">Platzhalter</p></section>`;
mount(node, document.getElementById("app"));
}