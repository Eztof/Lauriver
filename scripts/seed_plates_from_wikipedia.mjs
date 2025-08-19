// scripts/seed_plates_from_wikipedia.mjs
// Node 18+ (ESM). Install: npm i @supabase/supabase-js node-fetch@3
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// === KONFIG ===
const SUPABASE_URL = process.env.SUPABASE_URL || "https://aarxcnncnshpphriwejb.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcnhjbm5jbnNocHBocml3ZWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTUxNzcsImV4cCI6MjA3MTE3MTE3N30.r4bdvaGOlofZC3QVpFwbXJz366RYpkhhYmS9fxP1G7I";

// Wikipedia – Rohtext des Artikels
const WIKI_RAW = "https://de.wikipedia.org/w/index.php?title=Liste_der_Kfz-Kennzeichen_in_Deutschland&action=raw";

// Mapping Bundesland → 2-Buchstaben-Code
const STATE_MAP = {
  "Baden-Württemberg": { code: "BW", name: "Baden-Württemberg" },
  "Bayern": { code: "BY", name: "Bayern" },
  "Berlin": { code: "BE", name: "Berlin" },
  "Brandenburg": { code: "BB", name: "Brandenburg" },
  "Bremen": { code: "HB", name: "Bremen" },
  "Hamburg": { code: "HH", name: "Hamburg" },
  "Hessen": { code: "HE", name: "Hessen" },
  "Mecklenburg-Vorpommern": { code: "MV", name: "Mecklenburg-Vorpommern" },
  "Niedersachsen": { code: "NI", name: "Niedersachsen" },
  "Nordrhein-Westfalen": { code: "NW", name: "Nordrhein-Westfalen" },
  "Rheinland-Pfalz": { code: "RP", name: "Rheinland-Pfalz" },
  "Saarland": { code: "SL", name: "Saarland" },
  "Sachsen": { code: "SN", name: "Sachsen" },
  "Sachsen-Anhalt": { code: "ST", name: "Sachsen-Anhalt" },
  "Schleswig-Holstein": { code: "SH", name: "Schleswig-Holstein" },
  "Thüringen": { code: "TH", name: "Thüringen" },
};

// Wikitext → sauberer Text
function stripWiki(s) {
  if (!s) return "";
  return s
    // [[Link|Text]] → Text
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1")
    // HTML-Tags & Templates weg
    .replace(/<[^>]*>/g, "")
    .replace(/\{\{[^}]*\}\}/g, "")
    // Kursiv/Bold
    .replace(/''+/g, "")
    // Entities
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// einige Tabellen verwenden rowspan → diese Hilfsstruktur puffert Zellen
class RowspanBuffer {
  constructor() { this.buf = {}; }
  get(col) { return this.buf[col]; }
  set(col, val, span) {
    if (span && span > 1) this.buf[col] = { val, left: span };
    return val;
  }
  tick() {
    for (const k of Object.keys(this.buf)) {
      this.buf[k].left -= 1;
      if (this.buf[k].left <= 0) delete this.buf[k];
    }
  }
}

// Aus Wikitext Tabellenzeilen extrahieren
function parseWikiRawToRecords(raw) {
  const lines = raw.split("\n");

  let inTable = false;
  const recs = [];
  const span = new RowspanBuffer();

  // Eine Reihe Tabellenabschnitte – wir suchen alle "wikitable"
  let row = null;

  const codeCell = /^\|\s*'''(?:\[\[[^\|\]]*\|)?([A-ZÄÖÜ]{1,3})(?:\]\])?'''/;
  const tdCell = /^\|\s*(.*)$/;      // Einzelzelle
  const tdCellEx = /^\|\s*(?:rowspan="(\d+)"\s*\|\s*)?(.*)$/; // mit optional rowspan

  for (let i = 0; i < lines.length; i++) {
    const L = lines[i].trim();

    if (!inTable && L.startsWith("{|") && L.includes("wikitable")) {
      inTable = true; row = { code: null, label: null, state: null }; continue;
    }
    if (inTable && L.startsWith("|}")) {
      // Tabellenende → evtl. letzte Zeile flushen
      if (row && row.code && row.label) recs.push(row);
      inTable = false; row = null; continue;
    }
    if (!inTable) continue;

    if (L.startsWith("|-")) {
      // neue Tabellenzeile
      if (row && row.code && row.label) recs.push(row);
      row = { code: span.get(0)?.val || null, label: span.get(1)?.val || null, state: span.get(2)?.val || null };
      span.tick();
      continue;
    }

    // 1) CODE
    let m;
    if ((m = L.match(codeCell))) {
      const v = stripWiki(m[1].toUpperCase());
      row.code = span.set(0, v, 1);
      continue;
    }

    // 2) Normale Zellen – nacheinander: label, state, evtl. weitere
    if ((m = L.match(tdCellEx))) {
      const rs = m[1] ? parseInt(m[1], 10) : 1;
      const val = stripWiki(m[2]);

      // Fülle Spalten in Reihenfolge: label → state → (ignoriere Rest)
      if (!row.label) {
        row.label = span.set(1, val, rs);
      } else if (!row.state) {
        row.state = span.set(2, val, rs);
      } else {
        // weitere Spalten ignorieren
      }
    }
  }

  // Cleanup & Filter
  const clean = recs
    .filter(r => /^[A-ZÄÖÜ]{1,3}$/.test(r.code || "") && r.label)
    .map(r => {
      const label = r.label.replace(/\s*\(.*?ehem.*?\)$/i, "").trim();
      const stateName = r.state ? r.state.replace(/\s*\(.*?\)$/, "").trim() : "";
      return { code: r.code, label, stateName };
    });

  // Doppelte Codes (selten) zuletzt behalten
  const map = new Map();
  for (const r of clean) map.set(r.code, r);
  return [...map.values()];
}

function buildRawBlocks(records) {
  // 1) CODE ; NAME
  const rawCodes = records.map(r => `${r.code} ; ${r.label}`).join("\n");

  // 2) CODE ; STATE_CODE ; STATE_NAME
  const rawStates = records.map(r => {
    const st = STATE_MAP[r.stateName] || { code: "", name: r.stateName || "" };
    return `${r.code} ; ${st.code} ; ${st.name}`;
  }).join("\n");

  return { rawCodes, rawStates };
}

async function main() {
  console.log("Lade Wikipedia-Rohtext …");
  const res = await fetch(WIKI_RAW);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const raw = await res.text();

  const records = parseWikiRawToRecords(raw);
  console.log(`Gefundene Kennzeichen: ${records.length}`);

  const { rawCodes, rawStates } = buildRawBlocks(records);

  // In Supabase einspeisen (RPC: seed_plates_de + update_plate_states)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log("→ seed_plates_de …");
  let { data: d1, error: e1 } = await supabase.rpc("seed_plates_de", { raw: rawCodes });
  if (e1) throw e1;
  console.log("OK.", d1);

  console.log("→ update_plate_states …");
  let { data: d2, error: e2 } = await supabase.rpc("update_plate_states", { raw: rawStates });
  if (e2) throw e2;
  console.log("OK.", d2);

  console.log("FERTIG ✅");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
