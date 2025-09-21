import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 Supabase URL and/or Anon Key are missing. Please check your environment variables.");
  throw new Error("Missing Supabase configuration");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
    storage: window.localStorage
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})
