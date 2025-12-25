import { createClient } from '@supabase/supabase-js'

// In Vite si usa import.meta.env invece di process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Mancano le chiavi di Supabase nel file .env")
}

export const supabase = createClient(supabaseUrl, supabaseKey)
