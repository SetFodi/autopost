export const SUBMISSION_STATUSES = [
  'new',
  'in_progress',
  'preview_ready',
  'delivered',
  'converted',
  'rejected',
] as const

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

export type AdminActionState = {
  kind: 'idle' | 'success' | 'error'
  message: string
}

export type AdminDashboardStats = {
  total: number
  new: number
  inProgress: number
  previewReady: number
  delivered: number
  converted: number
  revenue: number
}

export type AdminSubmissionListItem = {
  id: string
  public_reference: string
  phone: string
  customer_name: string | null
  vehicle_model: string
  vehicle_year: number
  price: number | string
  status: SubmissionStatus
  amount_paid: number | string | null
  created_at: string
}

export type AdminSubmissionPhoto = {
  id: string
  storage_path: string
  original_filename: string
  mime_type: string
  file_size: number
  sort_order: number
  signed_url: string | null
}

export type AdminSubmissionDetail = AdminSubmissionListItem & {
  mileage: number | string | null
  engine: string | null
  transmission: string | null
  location: string | null
  additional_info: string | null
  consent_given: boolean
  internal_notes: string | null
  delivery_url: string | null
  delivered_at: string | null
  converted_at: string | null
  updated_at: string
  photos: AdminSubmissionPhoto[]
}

export type AdminDashboardFilters = {
  query: string
  status: SubmissionStatus | 'all'
}
