import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/types/database'

import { getPublicSupabaseConfig } from './config'

export async function createServerSupabaseClient() {
  const { url, key } = getPublicSupabaseConfig()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components cannot write cookies. The root proxy refreshes
          // auth tokens and is the authoritative cookie writer in that case.
        }
      },
    },
  })
}
