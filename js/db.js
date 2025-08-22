// /js/db.js

// Profil anlegen, falls nicht vorhanden (oder Username aktualisieren, falls leer)
export async function ensureProfile(client, { auth_user_id, username }) {
  const payload = { auth_user_id, username };
  const { error } = await client
    .from("profiles")
    .upsert(payload, { onConflict: "auth_user_id" }); // unique
  if (error) throw error;
}

// last_login_at setzen + Event
export async function touchLogin(client) {
  const { error } = await client.rpc("touch_login");
  if (error) throw error;
}

// Heartbeat: last_seen_at alle 60s
export async function touchSeen(client) {
  const { error } = await client.rpc("touch_seen");
  if (error) {
    // nicht fatal – nur loggen
    console.warn("touch_seen failed", error);
  }
}

// Profil lesen (für Badge)
export async function getMyProfile(client) {
  const { data: auth } = await client.auth.getUser();
  const uid = auth.user.id;
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("auth_user_id", uid)
    .single();
  if (error) throw error;
  return data;
}
