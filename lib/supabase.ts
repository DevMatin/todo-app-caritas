// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client für Client-seitige Operationen
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin Client für Server-seitige Operationen mit Service Role
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Hilfsfunktion um DATABASE_URL aus Supabase-Keys zu generieren
export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  
  // Extrahiere Project Reference aus SUPABASE_URL
  const url = new URL(process.env.SUPABASE_URL!)
  const projectRef = url.hostname.split('.')[0]
  
  // Generiere DATABASE_URL (Sie müssen das Passwort separat setzen)
  const password = process.env.SUPABASE_DB_PASSWORD || 'your-password'
  return `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`
}
