// js/pages/home.js
import { html, mount } from "../ui.js";
import { supabase } from "../supabaseClient.js";

function menuCard(href, title, desc) {
  return `<a href="#${href}" class="card menu-card" style="text-decoration:none;color:inherit">
    <h2>${title}</h2>
    <p class="small">${desc}</p>
  </a>`;
}

export async function HomePage() {
  const content = html`
    <section class="grid menu-grid">
      ${menuCard("/calendar", "Kalender", "Termine & Übersicht")}
      ${menuCard("/plates", "Kennzeichen", "Spiel & Übersicht")}
      ${menuCard("/packlist", "Packliste", "Gemeinsam abhakbar")}
      ${menuCard("/bookmarks", "Merken", "Links & Notizen")}
    </section>

    <div style="height:16px"></div>

    <section class="card">
      <button id="logout" class="btn danger">Logout</button>
    </section>
  `;
  mount(content, document.getElementById("app"));

  document.getElementById("logout").addEventListener("click", async () => {
    try { await supabase.auth.signOut(); } finally { location.hash = "#/"; }
  });
}
