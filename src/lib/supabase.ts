import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && anonKey)

// Null until the project is configured; the app then shows a setup screen
// instead of failing on the first request.
export const supabase = isConfigured ? createClient(url!, anonKey!) : null

export function db() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}
