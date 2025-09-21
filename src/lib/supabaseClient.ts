import { createClient } from '@supabase/supabase-js'
import fetch from 'cross-fetch'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY


if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 Supabase URL and/or Anon Key are missing. Please check your environment variables.");
  throw new Error("Missing Supabase configuration");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch,
  },
  auth: {
    persistSession: true,
    detectSessionInUrl: true
  }
})
