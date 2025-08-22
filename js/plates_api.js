// /js/plates_api.js

// Zählt Gesamt & Picks (für Fortschritt)
export async function fetchTotals(client) {
  const tot = await client.from("plates_de").select("code", { count: "exact", head: true });
  const pic = await client.from("plate_picks").select("id", { count: "exact", head: true });

  return {
    total: tot.count ?? 0,
    picked: pic.count ?? 0,
  };
}

// Liste aller Picks inkl. Stammdaten (Ort/Bundesland)
export async function fetchPicks(client) {
  const { data, error } = await client
    .from("plate_picks")
    .select(`
      id,
      plate_code,
      created_at,
      plates_de:plate_code (
        label,
        state_code,
        state_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((r) => ({
    id: r.id,
    code: r.plate_code,
    label: r.plates_de?.label || "",
    state_code: r.plates_de?.state_code || "",
    state_name: r.plates_de?.state_name || "",
    created_at: r.created_at,
  }));
}

// Einen Pick auslösen (via RPC – sichert "nicht doppelt")
export async function pickPlate(client, codeRaw) {
  const code = String(codeRaw || "").trim().toUpperCase();
  if (!code) throw new Error("Bitte Kennzeichen-Code eingeben.");
  const { data, error } = await client.rpc("pick_plate", { p_code: code });
  if (error) throw error;
  return data?.[0] ?? null;
}
