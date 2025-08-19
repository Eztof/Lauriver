// js/auth.js
import { supabase } from "./supabaseClient.js";
import { toast } from "./ui.js";
import * as db from "./db.js";

/**
 * Registrierung
 * - Profil wird per DB-Trigger angelegt (Option B).
 * - Wenn E-Mail-Bestätigung aktiv ist, gibt signUp KEINE Session zurück.
 * - Wir geben eine Callback-Route an, die wir im main.js behandeln.
 */
export async function signUp({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || null },
      emailRedirectTo: `${location.origin}/#auth-callback`, // <— wichtig
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

/**
 * Login mit E-Mail + Passwort
 */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  toast("Willkommen zurück!");
  return data;
}

/**
 * Logout
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  toast("Abgemeldet.");
}

/**
 * Aktuelle Session holen
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Auth-Events:
 * - setzt last_seen_at
 * - schreibt Auth-Log (nur wenn eine Session existiert → RLS)
 */
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
