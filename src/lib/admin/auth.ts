import { cache } from 'react'
import { redirect } from 'next/navigation'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getPublicSupabaseKey } from '@/lib/supabase/config'

export type AdminIdentity = {
  id: string
  email: string
}

export function getAdminConfigurationIssue() {
  if (!process.env.ADMIN_EMAIL) {
    return 'ADMIN_EMAIL არ არის მითითებული.'
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return 'NEXT_PUBLIC_SUPABASE_URL არ არის მითითებული.'
  }

  if (!getPublicSupabaseKey()) {
    return 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY არ არის მითითებული.'
  }

  return null
}

export const getCurrentAdmin = cache(
  async (): Promise<AdminIdentity | null> => {
    const configuredEmail = process.env.ADMIN_EMAIL
    if (!configuredEmail || getAdminConfigurationIssue()) return null

    try {
      const supabase = await createServerSupabaseClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user?.email || user.email !== configuredEmail) return null

      return { id: user.id, email: user.email }
    } catch {
      return null
    }
  },
)

/**
 * The secure authorization boundary for every private admin read and mutation.
 * The comparison intentionally remains case-sensitive and exact.
 */
export const requireAdmin = cache(async (): Promise<AdminIdentity> => {
  const configuredEmail = process.env.ADMIN_EMAIL

  if (!configuredEmail || getAdminConfigurationIssue()) {
    redirect('/admin/login?reason=configuration')
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.email || user.email !== configuredEmail) {
    redirect('/admin/login?reason=unauthorized')
  }

  return { id: user.id, email: user.email }
})
