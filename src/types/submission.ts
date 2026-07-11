import type { SubmissionInitInput } from '@/lib/validation/submission'

export type SubmissionInitRequest = SubmissionInitInput

export type SubmissionUploadTarget = {
  fileIndex: number
  path: string
  token: string
}

export type SubmissionInitResponse = {
  submissionId: string
  publicReference: string
  completionToken: string
  uploads: SubmissionUploadTarget[]
}

export type SubmissionCompleteRequest = {
  submissionId: string
  completionToken: string
  uploaded: Array<{
    fileIndex: number
    path: string
  }>
}

export type SubmissionCompleteResponse = {
  submissionId: string
  publicReference: string
  vehicleModel: string
  photoCount: number
  expectedDelivery: '24 საათი'
}

export type ApiErrorCode =
  | 'CONFIGURATION_ERROR'
  | 'INVALID_REQUEST'
  | 'IDEMPOTENCY_REQUIRED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'RATE_LIMITED'
  | 'UPLOAD_INCOMPLETE'
  | 'SERVICE_UNAVAILABLE'

export type ApiErrorResponse = {
  code: ApiErrorCode
  error: string
}
