import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`redirect:${path}`)
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: authMocks.createServerSupabaseClient,
}))

vi.mock('next/navigation', () => ({ redirect: authMocks.redirect }))

import { requireAdmin } from '@/lib/admin/auth'

function serverClient(email: string | null, error: Error | null = null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: email ? { id: 'admin-user-id', email } : null,
        },
        error,
      }),
    },
  }
}

describe('admin authorization boundary', () => {
  beforeEach(() => {
    process.env.ADMIN_EMAIL = 'admin@autopost.ge'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key'
    authMocks.redirect.mockClear()
    authMocks.createServerSupabaseClient.mockReset()
  })

  it('returns only the exact allow-listed authenticated admin', async () => {
    authMocks.createServerSupabaseClient.mockResolvedValue(
      serverClient('admin@autopost.ge'),
    )

    await expect(requireAdmin()).resolves.toEqual({
      id: 'admin-user-id',
      email: 'admin@autopost.ge',
    })
    expect(authMocks.redirect).not.toHaveBeenCalled()
  })

  it('rejects a signed-in user whose email differs even only by case', async () => {
    authMocks.createServerSupabaseClient.mockResolvedValue(
      serverClient('Admin@autopost.ge'),
    )

    await expect(requireAdmin()).rejects.toThrow(
      'redirect:/admin/login?reason=unauthorized',
    )
  })

  it('redirects to a configuration-aware login when required env is missing', async () => {
    delete process.env.ADMIN_EMAIL

    await expect(requireAdmin()).rejects.toThrow(
      'redirect:/admin/login?reason=configuration',
    )
    expect(authMocks.createServerSupabaseClient).not.toHaveBeenCalled()
  })
})
