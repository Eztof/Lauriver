// js/auth.js
import { supabase } from "./supabaseClient.js";
import { toast } from "./ui.js";
import * as db from "./db.js";

/**
 * Registrierung
 * - Legt KEIN Profil im Frontend an (das macht der DB-Trigger).
 * - Wenn E-Mail-Bestätigung aktiv ist, gibt signUp KEINE Session zurück.
 */
export async function signUp({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || null },
      emailRedirectTo: location.origin, // optional
    },
  });
  if (error) throw error;

  // Hinweis je nach Setup: mit/ohne sofortige Session
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
      // last_seen_at aktualisieren
      await db.touchProfile(user.id);
      // Auth-Ereignis loggen (RLS: user_id = auth.uid())
      await db.insertAuthLog({ event, userAgent: navigator.userAgent });
    }
    // SIGNED_OUT: keine Session → kein Log (RLS würde blocken)
  } catch (e) {
    // Keine harten Fehler im UI auslösen – stilles Logging
    console.warn("Auth state handling error:", e);
  }
});
