// js/main.js
import { el } from "./ui.js";
import { supabase } from "./supabaseClient.js";
import { defineRoute, render, go } from "./router.js";
import { LoginPage } from "./pages/login.js";
import { HomePage } from "./pages/home.js";
import { CalendarPage } from "./pages/calendar.js";
import { PlatesPage } from "./pages/plates.js";
import { PacklistPage } from "./pages/packlist.js";

// --- NEU: Auth-Callback vom E-Mail-Link erkennen & URL säubern ---
function handleAuthCallback() {
  const h = location.hash || "";
  // a) Unser eigener Marker "#auth-callback"
  const isOurCallback = h.startsWith("#auth-callback");
  // b) Oder Supabase hängt direkt Tokens in den Hash (#access_token=...)
  const hasToken = /access_token=/.test(h) || /type=recovery/.test(h) || /type=signup/.test(h);

  if (isOurCallback || hasToken) {
    // Dank detectSessionInUrl hat Supabase die Session bereits übernommen.
    // URL säubern und zur Startseite leiten.
    history.replaceState(null, "", `${location.origin}/#/home`);
  }
}
handleAuthCallback();

// Jahr im Footer
el("#year").textContent = new Date().getFullYear();

// Top-Navigation (abhängig von Login-Status)
function drawNav(auth) {
  const nav = el("#top-nav");
  if (!auth) {
    nav.innerHTML = `<a href="#/">Login</a>`;
    return;
  }
  nav.innerHTML = `
    <a href="#/home">Start</a>
    <a href="#/calendar">Kalender</a>
    <a href="#/plates">Kennzeichen</a>
    <a href="#/packlist">Packliste</a>
    <a href="#/" id="logout">Logout</a>
  `;
  nav.querySelector("#logout").addEventListener("click", async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    go("/");
  });
}

// Routen definieren
defineRoute("/", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) { drawNav(true); return go("/home"); }
  drawNav(false); await LoginPage();
});

defineRoute("/home", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return go("/");
  drawNav(true); await HomePage();
});

defineRoute("/calendar", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return go("/");
  drawNav(true); await CalendarPage();
});

defineRoute("/plates", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return go("/");
  drawNav(true); await PlatesPage();
});

defineRoute("/packlist", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return go("/");
  drawNav(true); await PacklistPage();
});

defineRoute("/404", async () => {
  drawNav(false);
  document.getElementById("app").innerHTML = `<div class="card">Seite nicht gefunden.</div>`;
});

// Direkt rendern
render();
