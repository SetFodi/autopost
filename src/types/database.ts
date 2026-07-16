export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubmissionStatus =
  | 'new'
  | 'in_progress'
  | 'preview_ready'
  | 'delivered'
  | 'converted'
  | 'rejected'

export type SubmissionUploadState = 'pending' | 'complete' | 'failed'

export type VehiclePriceCurrency = 'GEL' | 'USD'

export type SellerType = 'private_seller' | 'dealer'

export type FulfillmentStatus =
  | 'queued'
  | 'generating_preview'
  | 'preview_ready'
  | 'generating_paid'
  | 'ready'
  | 'failed'

export type GeneratedAssetAccessTier = 'preview' | 'paid'
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

export type PaymentStatus =
  | 'created'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'expired'
  | 'returned'
  | 'cancelled'

export type AnalyticsEventName =
  | 'landing_view'
  | 'primary_cta_click'
  | 'form_started'
  | 'photo_added'
  | 'submission_completed'
  | 'whatsapp_clicked'
  | 'preview_delivered'
  | 'converted'

export type Database = {
  public: {
    Tables: {
      fulfillments: {
        Row: {
          created_at: string
          failed_at: string | null
          last_error_code: string | null
          paid_started_at: string | null
          paid_workflow_run_id: string | null
          preview_ready_at: string | null
          preview_started_at: string | null
          preview_workflow_run_id: string | null
          ready_at: string | null
          status: FulfillmentStatus
          submission_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          failed_at?: string | null
          last_error_code?: string | null
          paid_started_at?: string | null
          paid_workflow_run_id?: string | null
          preview_ready_at?: string | null
          preview_started_at?: string | null
          preview_workflow_run_id?: string | null
          ready_at?: string | null
          status?: FulfillmentStatus
          submission_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          failed_at?: string | null
          last_error_code?: string | null
          paid_started_at?: string | null
          paid_workflow_run_id?: string | null
          preview_ready_at?: string | null
          preview_started_at?: string | null
          preview_workflow_run_id?: string | null
          ready_at?: string | null
          status?: FulfillmentStatus
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fulfillments_submission_id_fkey'
            columns: ['submission_id']
            isOneToOne: true
            referencedRelation: 'submissions'
            referencedColumns: ['id']
          },
        ]
      }
      generated_assets: {
        Row: {
          access_tier: GeneratedAssetAccessTier
          asset_kind: GeneratedAssetKind
          created_at: string
          file_size: number
          filename: string
          id: string
          mime_type:
            | 'image/png'
            | 'text/plain; charset=utf-8'
            | 'video/mp4'
            | 'application/zip'
          storage_path: string
          submission_id: string
          updated_at: string
        }
        Insert: {
          access_tier: GeneratedAssetAccessTier
          asset_kind: GeneratedAssetKind
          created_at?: string
          file_size: number
          filename: string
          id?: string
          mime_type:
            | 'image/png'
            | 'text/plain; charset=utf-8'
            | 'video/mp4'
            | 'application/zip'
          storage_path: string
          submission_id: string
          updated_at?: string
        }
        Update: {
          access_tier?: GeneratedAssetAccessTier
          asset_kind?: GeneratedAssetKind
          created_at?: string
          file_size?: number
          filename?: string
          id?: string
          mime_type?:
            | 'image/png'
            | 'text/plain; charset=utf-8'
            | 'video/mp4'
            | 'application/zip'
          storage_path?: string
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'generated_assets_submission_id_fkey'
            columns: ['submission_id']
            isOneToOne: false
            referencedRelation: 'submissions'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          checkout_url: string | null
          created_at: string
          currency: 'GEL'
          id: string
          merchant_payment_id: string
          paid_at: string | null
          provider: 'tbc'
          provider_payment_id: string | null
          provider_result_code: string | null
          status: PaymentStatus
          submission_id: string
          updated_at: string
          verified_payload: Json
        }
        Insert: {
          amount: number
          checkout_url?: string | null
          created_at?: string
          currency: 'GEL'
          id?: string
          merchant_payment_id: string
          paid_at?: string | null
          provider?: 'tbc'
          provider_payment_id?: string | null
          provider_result_code?: string | null
          status?: PaymentStatus
          submission_id: string
          updated_at?: string
          verified_payload?: Json
        }
        Update: {
          amount?: number
          checkout_url?: string | null
          created_at?: string
          currency?: 'GEL'
          id?: string
          merchant_payment_id?: string
          paid_at?: string | null
          provider?: 'tbc'
          provider_payment_id?: string | null
          provider_result_code?: string | null
          status?: PaymentStatus
          submission_id?: string
          updated_at?: string
          verified_payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'payments_submission_id_fkey'
            columns: ['submission_id']
            isOneToOne: false
            referencedRelation: 'submissions'
            referencedColumns: ['id']
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: AnalyticsEventName
          id: string
          metadata: Json
          submission_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: AnalyticsEventName
          id?: string
          metadata?: Json
          submission_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: AnalyticsEventName
          id?: string
          metadata?: Json
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'analytics_events_submission_id_fkey'
            columns: ['submission_id']
            isOneToOne: false
            referencedRelation: 'submissions'
            referencedColumns: ['id']
          },
        ]
      }
      rate_limit_events: {
        Row: {
          created_at: string
          id: string
          ip_hash: string
          scope:
            'submission_init_request' | 'submission_init' | 'public_analytics'
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash: string
          scope:
            'submission_init_request' | 'submission_init' | 'public_analytics'
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string
          scope?:
            'submission_init_request' | 'submission_init' | 'public_analytics'
        }
        Relationships: []
      }
      submission_files: {
        Row: {
          created_at: string
          file_size: number
          file_type: 'source_photo'
          id: string
          mime_type:
            | 'image/jpeg'
            | 'image/png'
            | 'image/webp'
            | 'image/heic'
            | 'image/heif'
          original_filename: string
          sort_order: number
          storage_path: string
          submission_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          file_size: number
          file_type?: 'source_photo'
          id?: string
          mime_type:
            | 'image/jpeg'
            | 'image/png'
            | 'image/webp'
            | 'image/heic'
            | 'image/heif'
          original_filename: string
          sort_order: number
          storage_path: string
          submission_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          file_size?: number
          file_type?: 'source_photo'
          id?: string
          mime_type?:
            | 'image/jpeg'
            | 'image/png'
            | 'image/webp'
            | 'image/heic'
            | 'image/heif'
          original_filename?: string
          sort_order?: number
          storage_path?: string
          submission_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'submission_files_submission_id_fkey'
            columns: ['submission_id']
            isOneToOne: false
            referencedRelation: 'submissions'
            referencedColumns: ['id']
          },
        ]
      }
      submissions: {
        Row: {
          additional_info: string | null
          amount_paid: number
          completed_at: string | null
          cleanup_claimed_at: string | null
          cleanup_claim_token: string | null
          consent_given: boolean
          converted_at: string | null
          created_at: string
          customer_name: string | null
          delivered_at: string | null
          delivery_url: string | null
          engine: string | null
          expected_file_count: number
          id: string
          idempotency_key_hash: string
          internal_notes: string | null
          location: string | null
          mileage: number | null
          phone: string
          price: number
          price_currency: VehiclePriceCurrency
          public_reference: string
          request_fingerprint: string
          seller_type: SellerType | null
          status: SubmissionStatus
          transmission: string | null
          updated_at: string
          upload_state: SubmissionUploadState
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          vehicle_model: string
          vehicle_year: number
        }
        Insert: {
          additional_info?: string | null
          amount_paid?: number
          completed_at?: string | null
          cleanup_claimed_at?: string | null
          cleanup_claim_token?: string | null
          consent_given: boolean
          converted_at?: string | null
          created_at?: string
          customer_name?: string | null
          delivered_at?: string | null
          delivery_url?: string | null
          engine?: string | null
          expected_file_count: number
          id?: string
          idempotency_key_hash: string
          internal_notes?: string | null
          location?: string | null
          mileage?: number | null
          phone: string
          price: number
          price_currency: VehiclePriceCurrency
          public_reference?: string
          request_fingerprint: string
          seller_type?: SellerType | null
          status?: SubmissionStatus
          transmission?: string | null
          updated_at?: string
          upload_state?: SubmissionUploadState
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_model: string
          vehicle_year: number
        }
        Update: {
          additional_info?: string | null
          amount_paid?: number
          completed_at?: string | null
          cleanup_claimed_at?: string | null
          cleanup_claim_token?: string | null
          consent_given?: boolean
          converted_at?: string | null
          created_at?: string
          customer_name?: string | null
          delivered_at?: string | null
          delivery_url?: string | null
          engine?: string | null
          expected_file_count?: number
          id?: string
          idempotency_key_hash?: string
          internal_notes?: string | null
          location?: string | null
          mileage?: number | null
          phone?: string
          price?: number
          price_currency?: VehiclePriceCurrency
          public_reference?: string
          request_fingerprint?: string
          seller_type?: SellerType | null
          status?: SubmissionStatus
          transmission?: string | null
          updated_at?: string
          upload_state?: SubmissionUploadState
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_model?: string
          vehicle_year?: number
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      begin_submission: {
        Args: {
          p_additional_info: string | null
          p_consent_given: boolean
          p_customer_name: string | null
          p_engine: string | null
          p_files: Json
          p_idempotency_key_hash: string
          p_ip_hash: string
          p_location: string | null
          p_mileage: number | null
          p_phone: string
          p_price: number
          p_price_currency: VehiclePriceCurrency
          p_rate_limit: number
          p_request_rate_limit: number
          p_request_fingerprint: string
          p_seller_type: SellerType
          p_submission_id: string
          p_transmission: string | null
          p_utm_campaign: string | null
          p_utm_content: string | null
          p_utm_medium: string | null
          p_utm_source: string | null
          p_utm_term: string | null
          p_vehicle_model: string
          p_vehicle_year: number
          p_window_seconds: number
        }
        Returns: {
          idempotency_conflict: boolean
          public_reference: string | null
          rate_limited: boolean
          retry_after_seconds: number
          submission_id: string | null
          was_existing: boolean
        }[]
      }
      claim_stale_submissions: {
        Args: {
          p_batch_size: number
          p_stale_before: string
        }
        Returns: {
          claim_token: string
          submission_id: string
        }[]
      }
      cleanup_expired_rate_limit_events: {
        Args: { p_expired_before: string }
        Returns: number
      }
      claim_due_deletion_tombstones: {
        Args: { p_batch_size: number }
        Returns: {
          claim_token: string
          storage_prefix: string
          submission_id: string
        }[]
      }
      confirm_tbc_payment: {
        Args: {
          p_amount: number
          p_currency: string
          p_delivery_url: string
          p_provider_payment_id: string
          p_provider_status: string
          p_result_code: string
          p_verified_payload: Json
        }
        Returns: {
          paid_start_token: string | null
          payment_status: PaymentStatus
          should_start_paid_generation: boolean
          submission_id: string
        }[]
      }
      create_submission_deletion_tombstone: {
        Args: { p_submission_id: string }
        Returns: boolean
      }
      delete_claimed_deletion_tombstone: {
        Args: { p_claim_token: string; p_submission_id: string }
        Returns: boolean
      }
      complete_submission: {
        Args: {
          p_submission_id: string
          p_uploaded_files: Json
        }
        Returns: {
          already_complete: boolean
          completed_at: string
          photo_count: number
          public_reference: string
          vehicle_model: string
        }[]
      }
      consume_rate_limit: {
        Args: {
          p_ip_hash: string
          p_limit: number
          p_scope: string
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          current_count: number
          retry_after_seconds: number
        }[]
      }
      delete_claimed_submission: {
        Args: {
          p_claim_token: string
          p_submission_id: string
        }
        Returns: boolean
      }
      queue_fulfillment: {
        Args: { p_submission_id: string }
        Returns: {
          fulfillment_status: FulfillmentStatus
          preview_start_token: string | null
          should_start_preview: boolean
        }[]
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

export type Submission = Database['public']['Tables']['submissions']['Row']
export type SubmissionFile =
  Database['public']['Tables']['submission_files']['Row']
export type AnalyticsEvent =
  Database['public']['Tables']['analytics_events']['Row']
