import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import type { Database } from '@/types/database'

import { getPublicSupabaseConfig, isPublicSupabaseConfigured } from './config'

export async function updateSupabaseSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  if (!isPublicSupabaseConfigured()) return response
  const { url, key } = getPublicSupabaseConfig()

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, requiredHeaders) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }

        response = NextResponse.next({ request })

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
        for (const [name, value] of Object.entries(requiredHeaders)) {
          response.headers.set(name, value)
        }
      },
    },
  })

  // getClaims verifies the JWT and refreshes an expired access token. Do not
  // place logic between client creation and this call; doing so can desync the
  // request/response cookie pair during a refresh.
  await supabase.auth.getClaims()

  return response
}

// Compatibility with Supabase's official utility name.
export const updateSession = updateSupabaseSession
