import { requireAdmin } from '@/lib/admin/auth'
import type {
  AdminDashboardFilters,
  AdminDashboardStats,
  AdminSubmissionDetail,
  AdminSubmissionListItem,
  AdminSubmissionPhoto,
  SubmissionStatus,
} from '@/lib/admin/types'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'

const DASHBOARD_RESULT_LIMIT = 100
const SIGNED_URL_TTL_SECONDS = 60 * 60
const REVENUE_PAGE_SIZE = 1_000

type CountResponse = {
  count: number | null
  error: { code?: string; message: string } | null
}

async function countSubmissions(status?: SubmissionStatus) {
  const supabase = getServiceSupabaseClient()
  let query = supabase
    .from('submissions')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('upload_state', 'complete')

  if (status) query = query.eq('status', status)

  const { count, error } = (await query) as CountResponse
  if (error) {
    console.error('[admin] Failed to count submissions', error.code)
    throw new Error('Admin dashboard metrics could not be loaded.')
  }

  return count ?? 0
}

function sanitizePostgrestSearch(value: string) {
  return value
    .replace(/[,%_*()\[\]{}"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

async function loadRecordedRevenue() {
  const supabase = getServiceSupabaseClient()
  let revenueInTetri = 0
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('submissions')
      .select('id, amount_paid')
      .eq('upload_state', 'complete')
      .eq('status', 'converted')
      .gt('amount_paid', 0)
      .order('id', { ascending: true })
      .range(offset, offset + REVENUE_PAGE_SIZE - 1)

    if (error) {
      console.error('[admin] Failed to calculate revenue', error.code)
      throw new Error('Admin dashboard revenue could not be loaded.')
    }

    const rows = data ?? []
    for (const row of rows) {
      const amount = Number(row.amount_paid ?? 0)
      if (Number.isFinite(amount) && amount > 0) {
        revenueInTetri += Math.round(amount * 100)
      }
    }

    if (rows.length < REVENUE_PAGE_SIZE) break
    offset += REVENUE_PAGE_SIZE
  }

  return revenueInTetri / 100
}

async function loadStats(): Promise<AdminDashboardStats> {
  const [
    total,
    newCount,
    inProgress,
    previewReady,
    delivered,
    converted,
    revenue,
  ] = await Promise.all([
    countSubmissions(),
    countSubmissions('new'),
    countSubmissions('in_progress'),
    countSubmissions('preview_ready'),
    countSubmissions('delivered'),
    countSubmissions('converted'),
    loadRecordedRevenue(),
  ])

  return {
    total,
    new: newCount,
    inProgress,
    previewReady,
    delivered,
    converted,
    revenue,
  }
}

async function loadSubmissionList(filters: AdminDashboardFilters) {
  const supabase = getServiceSupabaseClient()
  let query = supabase
    .from('submissions')
    .select(
      'id, public_reference, phone, customer_name, vehicle_model, vehicle_year, price, price_currency, status, amount_paid, created_at',
    )
    .eq('upload_state', 'complete')
    .order('created_at', { ascending: false })
    .limit(DASHBOARD_RESULT_LIMIT)

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const safeSearch = sanitizePostgrestSearch(filters.query)
  if (safeSearch) {
    query = query.or(
      `vehicle_model.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,public_reference.ilike.%${safeSearch}%`,
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('[admin] Failed to load submissions', error.code)
    throw new Error('Admin submissions could not be loaded.')
  }

  return (data ?? []) as AdminSubmissionListItem[]
}

export async function getAdminDashboardData(filters: AdminDashboardFilters) {
  await requireAdmin()

  const [stats, submissions] = await Promise.all([
    loadStats(),
    loadSubmissionList(filters),
  ])

  return { stats, submissions, resultLimit: DASHBOARD_RESULT_LIMIT }
}

export async function getAdminSubmission(
  id: string,
): Promise<AdminSubmissionDetail | null> {
  await requireAdmin()
  const supabase = getServiceSupabaseClient()

  const [submissionResult, filesResult] = await Promise.all([
    supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .eq('upload_state', 'complete')
      .maybeSingle(),
    supabase
      .from('submission_files')
      .select(
        'id, storage_path, original_filename, mime_type, file_size, sort_order',
      )
      .eq('submission_id', id)
      .eq('file_type', 'source_photo')
      .order('sort_order', { ascending: true }),
  ])

  if (submissionResult.error) {
    console.error(
      '[admin] Failed to load submission',
      submissionResult.error.code,
    )
    throw new Error('Submission details could not be loaded.')
  }

  if (!submissionResult.data) return null

  if (filesResult.error) {
    console.error(
      '[admin] Failed to load submission files',
      filesResult.error.code,
    )
    throw new Error('Submission photos could not be loaded.')
  }

  const rawFiles = (filesResult.data ?? []) as Omit<
    AdminSubmissionPhoto,
    'signed_url'
  >[]
  const paths = rawFiles.map((file) => file.storage_path)
  const signedUrlByPath = new Map<string, string>()

  if (paths.length > 0) {
    const signedResult = await supabase.storage
      .from('vehicle-uploads')
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)

    if (signedResult.error) {
      console.error('[admin] Failed to sign submission photos')
    } else {
      for (const item of signedResult.data) {
        if (item.path && item.signedUrl) {
          signedUrlByPath.set(item.path, item.signedUrl)
        }
      }
    }
  }

  const photos: AdminSubmissionPhoto[] = rawFiles.map((file) => ({
    ...file,
    file_size: Number(file.file_size),
    signed_url: signedUrlByPath.get(file.storage_path) ?? null,
  }))

  return {
    ...(submissionResult.data as Omit<AdminSubmissionDetail, 'photos'>),
    photos,
  }
}
