// /js/main_app.js
import { requireAuthOrRedirect } from "./auth.js";
import { getMyProfile, touchSeen } from "./db.js";

const userBadge = document.getElementById("user-badge");
const btnLogout = document.getElementById("btn-logout");

// Guard & Initialisierung
(async () => {
  const session = await requireAuthOrRedirect();
  if (!session) return;
  const { client } = session;

  // Profil holen → Badge
  try {
    const profile = await getMyProfile(client);
    userBadge.textContent = `Angemeldet als: ${profile.username}`;
  } catch (e) {
    userBadge.textContent = "Angemeldet";
    console.warn(e);
  }

  // Heartbeat alle 60 Sekunden (last_seen_at)
  setInterval(() => touchSeen(client), 60_000);
})();

// Logout
btnLogout.addEventListener("click", async () => {
  const { signOut } = await import("./auth.js");
  await signOut();
  window.location.href = "./index.html";
});
