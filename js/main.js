// js/main.js
import { el } from "./ui.js";
import { supabase } from "./supabaseClient.js";
import { defineRoute, render, go } from "./router.js";
import { LoginPage } from "./pages/login.js";
import { HomePage } from "./pages/home.js";
import { CalendarPage } from "./pages/calendar.js";
import { PlatesPage } from "./pages/plates.js";
import { PacklistPage } from "./pages/packlist.js";
import { BookmarksPage } from "./pages/bookmarks.js";

// Minimal-Topbar rechts nur Home (wenn eingeloggt)
function drawNav(auth) {
  const nav = el("#top-nav");
  nav.innerHTML = auth ? `<a href="#/home">Home</a>` : "";
}

// Erzwinge Hash-Routing als Start
if (!location.hash || location.hash === "#") {
  location.replace("#/");
}

// Routen
defineRoute("/", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) { drawNav(true); return go("/home"); }
  drawNav(false);
  await LoginPage();
});

defineRoute("/home", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) { drawNav(false); return go("/"); }
  drawNav(true);
  await HomePage();
});

defineRoute("/calendar", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) { drawNav(false); return go("/"); }
  drawNav(true);
  await CalendarPage();
});

defineRoute("/plates", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) { drawNav(false); return go("/"); }
  drawNav(true);
  await PlatesPage();
});

defineRoute("/packlist", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) { drawNav(false); return go("/"); }
  drawNav(true);
  await PacklistPage();
});

defineRoute("/bookmarks", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) { drawNav(false); return go("/"); }
  drawNav(true);
  await BookmarksPage();
});

defineRoute("/404", async () => {
  drawNav(false);
  el("#app").innerHTML = `<div class="card">Seite nicht gefunden.</div>`;
});

// Start rendern
render();
