import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

import { getPublicSupabaseConfig } from './config'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null

export function createBrowserSupabaseClient() {
  if (!browserClient) {
    const { url, key } = getPublicSupabaseConfig()
    browserClient = createBrowserClient<Database>(url, key)
  }

  return browserClient
}
