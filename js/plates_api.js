// /js/plates_api.js

// Zählt Gesamt & Picks (für Fortschritt)
export async function fetchTotals(client) {
  const tot = await client.from("plates_de").select("code", { count: "exact", head: true });
  const pic = await client.from("plate_picks").select("id", { count: "exact", head: true });
  if (tot.error) throw tot.error;
  if (pic.error) throw pic.error;
  return { total: tot.count ?? 0, picked: pic.count ?? 0 };
}

// Robust: Erst Picks laden, dann Stammdaten & Profile in separaten Queries
export async function fetchPicks(client) {
  const q1 = await client
    .from("plate_picks")
    .select("id, plate_code, user_id, created_at")
    .order("created_at", { ascending: false });

  if (q1.error) throw q1.error;
  const base = q1.data || [];
  if (base.length === 0) return [];

  // Stammdaten der Kennzeichen
  const codes = Array.from(new Set(base.map((r) => r.plate_code))).filter(Boolean);
  let plateMap = new Map();
  if (codes.length) {
    const q2 = await client
      .from("plates_de")
      .select("code, label, state_code, state_name")
      .in("code", codes);
    if (q2.error) throw q2.error;
    plateMap = new Map((q2.data || []).map((p) => [p.code, p]));
  }

  // Profilnamen
  const uids = Array.from(new Set(base.map((r) => r.user_id))).filter(Boolean);
  let profMap = new Map();
  if (uids.length) {
    // HINWEIS: benötigt eine SELECT-Policy auf public.profiles für authenticated
    const q3 = await client
      .from("profiles")
      .select("auth_user_id, username")
      .in("auth_user_id", uids);
    if (!q3.error && q3.data) {
      profMap = new Map(q3.data.map((p) => [p.auth_user_id, p.username]));
    }
  }

  // Zusammenbauen
  return base.map((r) => {
    const p = plateMap.get(r.plate_code) || {};
    const uname = profMap.get(r.user_id) || null;
    return {
      id: r.id,
      code: r.plate_code,
      user_id: r.user_id,
      label: p.label || "",
      state_code: p.state_code || "",
      state_name: p.state_name || "",
      created_at: r.created_at,
      username: uname,
    };
  });
}

// Einen Pick auslösen (via RPC – sichert "nicht doppelt")
export async function pickPlate(client, codeRaw) {
  const code = String(codeRaw || "").trim().toUpperCase();
  if (!code) throw new Error("Bitte Kennzeichen-Code eingeben.");
  const { data, error } = await client.rpc("pick_plate", { p_code: code });
  if (error) throw error;
  return data?.[0] ?? null;
}
