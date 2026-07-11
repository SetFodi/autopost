export class SupabaseConfigurationError extends Error {
  constructor(missingVariables: string[]) {
    super(
      `Supabase is not configured. Missing: ${missingVariables.join(', ')}. ` +
        'Copy .env.example to .env.local and add the project credentials.',
    )
    this.name = 'SupabaseConfigurationError'
  }
}

export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const missing: string[] = []

  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!key) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (missing.length > 0) throw new SupabaseConfigurationError(missing)

  return { url: url!, key: key! }
}

export function isPublicSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  )
}
