export type PhotoUploadStatus = 'ready' | 'uploading' | 'uploaded' | 'error'

export interface SelectedPhoto {
  id: string
  file: File
  sourceFingerprint: string
  metadataSanitized: true
  previewUrl: string | null
  status: PhotoUploadStatus
  progress: number
  error?: string
}
