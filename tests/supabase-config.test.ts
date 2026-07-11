import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getServiceSupabaseConfig } from '@/lib/supabase/admin'
import {
  getPublicSupabaseConfig,
  isPublicSupabaseConfigured,
} from '@/lib/supabase/config'

const supabaseEnvironmentVariables = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const originalEnvironment = Object.fromEntries(
  supabaseEnvironmentVariables.map((name) => [name, process.env[name]]),
)

describe('Supabase environment configuration', () => {
  beforeEach(() => {
    for (const name of supabaseEnvironmentVariables) delete process.env[name]
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  })

  afterEach(() => {
    for (const name of supabaseEnvironmentVariables) {
      const value = originalEnvironment[name]
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  })

  it('prefers the modern publishable key over the legacy anon key', () => {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ' publishable-key '
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'legacy-anon-key'

    expect(getPublicSupabaseConfig()).toEqual({
      url: 'https://example.supabase.co',
      key: 'publishable-key',
    })
    expect(isPublicSupabaseConfigured()).toBe(true)
  })

  it('falls back to the legacy anon key', () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ' legacy-anon-key '

    expect(getPublicSupabaseConfig().key).toBe('legacy-anon-key')
  })

  it('reports both accepted public key variables when neither is set', () => {
    expect(() => getPublicSupabaseConfig()).toThrow(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)',
    )
    expect(isPublicSupabaseConfigured()).toBe(false)
  })

  it('prefers the modern secret key over the legacy service-role key', () => {
    process.env.SUPABASE_SECRET_KEY = ' secret-key '
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'legacy-service-role-key'

    expect(getServiceSupabaseConfig()).toEqual({
      url: 'https://example.supabase.co',
      key: 'secret-key',
    })
  })

  it('falls back to the legacy service-role key', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = ' legacy-service-role-key '

    expect(getServiceSupabaseConfig().key).toBe('legacy-service-role-key')
  })

  it('reports both accepted server key variables when neither is set', () => {
    expect(() => getServiceSupabaseConfig()).toThrow(
      'SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)',
    )
  })
})
