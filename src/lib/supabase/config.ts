export class SupabaseConfigurationError extends Error {
  constructor(missingVariables: string[]) {
    super(
      `Supabase is not configured. Missing: ${missingVariables.join(', ')}. ` +
        'Copy .env.example to .env.local and add the project credentials.',
    )
    this.name = 'SupabaseConfigurationError'
  }
}

const PUBLIC_KEY_VARIABLES =
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)'

export function getPublicSupabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  )
}

export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = getPublicSupabaseKey()
  const missing: string[] = []

  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!key) missing.push(PUBLIC_KEY_VARIABLES)
  if (missing.length > 0) throw new SupabaseConfigurationError(missing)

  return { url: url!, key: key! }
}

export function isPublicSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && getPublicSupabaseKey(),
  )
}
