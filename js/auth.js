// js/auth.js
import { supabase } from "./supabaseClient.js";
import { toast } from "./ui.js";
import * as db from "./db.js";


export async function signUp({ email, password, displayName }) {
const { data, error } = await supabase.auth.signUp({
email,
password,
options: { data: { display_name: displayName || null } },
});
if (error) throw error;
// Profil anlegen/aktualisieren
const user = data.user;
await db.upsertProfile({
id: user.id,
email: user.email,
display_name: user.user_metadata?.display_name || null,
});
toast("Registrierung erfolgreich – du bist angemeldet.");
return data;
}


export async function signIn({ email, password }) {
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) throw error;
toast("Willkommen zurück!");
return data;
}


export async function signOut() {
await supabase.auth.signOut();
toast("Abgemeldet.");
}


export async function getSession() {
const { data } = await supabase.auth.getSession();
return data.session;
}


// Reagiere auf Auth-Änderungen und logge Zeitstempel
supabase.auth.onAuthStateChange(async (event, session) => {
const user = session?.user || null;
if (user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
await db.touchProfile(user.id);
await db.insertAuthLog({ event, userAgent: navigator.userAgent });
}
});