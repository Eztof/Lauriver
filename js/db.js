// js/db.js
import { supabase } from "./supabaseClient.js";

/* ---------- PROFILE ---------- */
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

/* ---------- AUTH LOGS ---------- */
export async function insertAuthLog({ event, userAgent, deviceId }) {
  const { error } = await supabase
    .from("auth_logs")
    .insert({ event, user_agent: userAgent, device_id: deviceId });
  if (error) console.warn(error);
}

/* ---------- BOOKMARKS ---------- */
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

/* ---------- PLATES ---------- */
export async function countPlates() {
  const { count, error } = await supabase
    .from("plates_de")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

export async function countPicked() {
  const { count, error } = await supabase
    .from("plate_picks")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

export async function getPlateInfo(code) {
  code = (code || "").toUpperCase().trim();
  const { data, error } = await supabase
    .from("plates_de")
    .select("code, label, state_code, state_name, is_legacy")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function pickPlate({ code, displayName }) {
  code = (code || "").toUpperCase().replace(/[^A-ZÄÖÜ]/g, "");
  const payload = {
    plate_code: code,
    picked_user_display_name: displayName || null,
    // user_id kommt per default aus auth.uid() (RLS checkt das)
  };
  const { error } = await supabase.from("plate_picks").insert(payload);
  if (error) throw error;
}

export async function listPicks() {
  const { data, error } = await supabase
    .from("plate_picks")
    .select("plate_code, picked_user_display_name, picked_at")
    .order("picked_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function unpickPlate(code) {
  code = (code || "").toUpperCase().trim();
  const { error } = await supabase.from("plate_picks").delete().eq("plate_code", code);
  if (error) throw error;
}
