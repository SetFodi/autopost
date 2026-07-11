import 'server-only'

import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

import { SupabaseConfigurationError } from './config'

let serviceClient: ReturnType<typeof createClient<Database>> | null = null

export function getServiceSupabaseClient() {
  if (serviceClient) return serviceClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const missing: string[] = []

  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (missing.length > 0) throw new SupabaseConfigurationError(missing)

  serviceClient = createClient<Database>(url!, serviceRoleKey!, {
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
