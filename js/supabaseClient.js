// js/supabaseClient.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// Einmalig den Client erstellen
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
auth: { persistSession: true, autoRefreshToken: true },
});