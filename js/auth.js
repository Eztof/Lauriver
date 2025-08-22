// /js/auth.js
import { clientPersistent, clientSession, pickClient } from "./supabaseClient.js";
import { ensureProfile, touchLogin } from "./db.js";

const USER_DOMAIN = "user.lauriver"; // künstliche Domain, existiert nicht

export function usernameToEmail(username) {
  const clean = String(username || "").trim().toLowerCase();
  if (!clean) throw new Error("Nutzername fehlt");
  return `${clean}@${USER_DOMAIN}`;
}

export async function signUp({ username, password, remember }) {
  const client = remember ? clientPersistent : clientSession;
  const email = usernameToEmail(username);

  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;

  // Profil anlegen/aktualisieren (1:1 zur auth.users-ID)
  const authUser = data.user;
  await ensureProfile(client, { auth_user_id: authUser.id, username });

  // Login berühren + Auto-Weiterleitung
  await touchLogin(client);
  return { client, user: authUser };
}

export async function signIn({ username, password, remember }) {
  const client = remember ? clientPersistent : clientSession;
  const email = usernameToEmail(username);

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;

  await touchLogin(client);
  return { client, user: data.user };
}

export async function signOut() {
  const { client } = await pickClient();
  if (client) await client.auth.signOut();
}

// Guard: wenn keine Session → auf index.html
export async function requireAuthOrRedirect() {
  const { client } = await pickClient();
  if (!client) {
    window.location.href = "./index.html";
    return null;
  }
  const { data } = await client.auth.getUser();
  if (!data.user) {
    window.location.href = "./index.html";
    return null;
  }
  return { client, user: data.user };
}
