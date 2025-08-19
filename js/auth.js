// js/auth.js
import { supabase } from "./supabaseClient.js";
import { toast } from "./ui.js";
import * as db from "./db.js";
import { SITE_URL } from "./config.js";

/**
 * Registrierung
 * - Profil wird per DB-Trigger angelegt (Option B).
 * - Wir setzen eine feste Redirect-URL auf dein Projekt (kein location.origin).
 */
export async function signUp({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || null },
      // Wichtig: Projekt-URL, damit E-Mail-Link auf /Lauriver zeigt
      emailRedirectTo: `${SITE_URL}/#auth-callback`,
    },
  });
  if (error) throw error;

  if (!data.session) {
    toast("Registrierung gestartet – bitte E-Mail bestätigen.");
  } else {
    toast("Registrierung erfolgreich – willkommen!");
  }
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  toast("Willkommen zurück!");
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  toast("Abgemeldet.");
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Auth-Events: last_seen_at updaten + Log schreiben
supabase.auth.onAuthStateChange(async (event, session) => {
  const user = session?.user || null;
  try {
    if (user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED")) {
      await db.touchProfile(user.id);
      await db.insertAuthLog({ event, userAgent: navigator.userAgent });
    }
  } catch (e) {
    console.warn("Auth state handling error:", e);
  }
});
