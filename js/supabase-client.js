// Public Supabase project config. The publishable key is safe in client code —
// write access is gated by RLS (see supabase/schema.sql), not by hiding this key.
const SUPABASE_URL = 'https://okohkazadppiwbwqbygq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_eqxn_RkUra0kLaJ2gJqaWQ_sllRe8Li';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
