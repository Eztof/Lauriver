// js/supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/+esm";

const SUPABASE_URL = "https://aarxcnncnshpphriwejb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcnhjbm5jbnNocHBocml3ZWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTUxNzcsImV4cCI6MjA3MTE3MTE3N30.r4bdvaGOlofZC3QVpFwbXJz366RYpkhhYmS9fxP1G7I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
