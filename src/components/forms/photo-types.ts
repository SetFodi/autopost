export type PhotoUploadStatus = 'ready' | 'uploading' | 'uploaded' | 'error'

export interface SelectedPhoto {
  id: string
  file: File
  previewUrl: string | null
  status: PhotoUploadStatus
  progress: number
  error?: string
}
