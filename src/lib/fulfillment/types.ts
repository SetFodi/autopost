export type FulfillmentStatus =
  | 'queued'
  | 'generating_preview'
  | 'preview_ready'
  | 'generating_paid'
  | 'ready'
  | 'failed'

export type AssetAccessTier = 'preview' | 'paid'

export type GeneratedAssetKind =
  | 'square'
  | 'story_1'
  | 'story_2'
  | 'story_3'
  | 'carousel_1'
  | 'carousel_2'
  | 'carousel_3'
  | 'carousel_4'
  | 'carousel_5'
  | 'carousel_6'
  | 'copy'
  | 'reel'
  | 'package'

export type CreativeSubmission = {
  additional_info: string | null
  engine: string | null
  location: string | null
  mileage: number | null
  phone: string
  price: number
  price_currency: 'GEL' | 'USD'
  public_reference: string
  transmission: string | null
  vehicle_model: string
  vehicle_year: number
}

export type ResultAsset = {
  kind: GeneratedAssetKind
  filename: string
  mimeType: string
  url: string
}

export type ResultSnapshot = {
  publicReference: string
  vehicleModel: string
  vehicleYear: number
  status: FulfillmentStatus
  paymentStatus: string | null
  paid: boolean
  checkoutAvailable: boolean
  previewAssets: ResultAsset[]
  paidAssets: ResultAsset[]
  updatedAt: string
}
