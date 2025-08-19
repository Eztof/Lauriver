// js/pages/home.js
import { html, mount } from "../ui.js";

function menuCard(href, title, desc) {
  // WICHTIG: String zurückgeben, kein DocumentFragment
  return `<a href="#${href}" class="card menu-card" style="text-decoration:none;color:inherit">
    <h2>${title}</h2>
    <p class="small">${desc}</p>
  </a>`;
}

export async function HomePage() {
  const content = html`
    <section class="grid menu-grid">
      ${menuCard("/calendar", "Kalender", "Termine & Übersicht")}
      ${menuCard("/plates", "Kennzeichen", "Schnell nachschlagen")}
      ${menuCard("/packlist", "Packliste", "Gemeinsam abhakbar")}
      ${menuCard("/bookmarks", "Merken", "Links & Notizen speichern")}
    </section>
  `;
  mount(content, document.getElementById("app"));
}
