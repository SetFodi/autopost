import 'server-only'

import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

import { SupabaseConfigurationError } from './config'

let serviceClient: ReturnType<typeof createClient<Database>> | null = null

export function getServiceSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const missing: string[] = []

  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!key) {
    missing.push('SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)')
  }
  if (missing.length > 0) throw new SupabaseConfigurationError(missing)

  return { url: url!, key: key! }
}

export function getServiceSupabaseClient() {
  if (serviceClient) return serviceClient

  const { url, key } = getServiceSupabaseConfig()

  serviceClient = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'autopost-server',
      },
    },
  })

  return serviceClient
}
