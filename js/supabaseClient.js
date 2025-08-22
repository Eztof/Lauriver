// /js/supabaseClient.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://pnljimiqmfyrzczaocwf.supabase.co";
export const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubGppbWlxbWZ5cnpjemFvY3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NTgwNTksImV4cCI6MjA3MTQzNDA1OX0.gNRemAN3FTI1SK_2rHILEr_stRV55xymkh4TJOyLW8I";

// Client mit wählbarem Storage (Merken = localStorage, sonst sessionStorage)
function makeClient(persist) {
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: true,
      storage: persist ? window.localStorage : window.sessionStorage,
      // optional: autoRefreshToken ist default true
    },
  });
}

export const clientPersistent = makeClient(true);
export const clientSession    = makeClient(false);

// Aktive Session herausfinden (persistenter Vorrang)
export async function pickClient() {
  const [ps, ss] = await Promise.all([
    clientPersistent.auth.getSession(),
    clientSession.auth.getSession(),
  ]);
  if (ps.data.session) return { client: clientPersistent, source: "local" };
  if (ss.data.session) return { client: clientSession, source: "session" };
  return { client: null, source: null };
}
