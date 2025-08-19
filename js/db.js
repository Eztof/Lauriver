// js/db.js
import { supabase } from "./supabaseClient.js";


// PROFILE
export async function upsertProfile({ id, email, display_name }) {
const { error } = await supabase.from("profiles").upsert(
{ id, email, display_name },
{ onConflict: "id" }
);
if (error) throw error;
}


export async function touchProfile(id) {
const { error } = await supabase
.from("profiles")
.update({ last_seen_at: new Date().toISOString() })
.eq("id", id);
if (error) console.warn(error);
}


// AUTH LOGS (nur in DB, keine Anzeige)
export async function insertAuthLog({ event, userAgent }) {
const { error } = await supabase
.from("auth_logs")
.insert({ event, user_agent: userAgent });
if (error) console.warn(error);
}


// MERKEN (Bookmarks)
export async function addBookmark({ title, url, notes }) {
const { error } = await supabase.from("bookmarks").insert({ title, url, notes });
if (error) throw error;
}


export async function listBookmarks() {
const { data, error } = await supabase
.from("bookmarks")
.select("id, title, url, notes, created_at")
.order("created_at", { ascending: false });
if (error) throw error;
return data || [];
}


export async function deleteBookmark(id) {
const { error } = await supabase.from("bookmarks").delete().eq("id", id);
if (error) throw error;
}