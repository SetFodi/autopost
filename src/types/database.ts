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
          public_reference: string
          request_fingerprint: string
          status: SubmissionStatus
          transmission: string | null
          updated_at: string
          upload_state: SubmissionUploadState
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
          public_reference?: string
          request_fingerprint: string
          status?: SubmissionStatus
          transmission?: string | null
          updated_at?: string
          upload_state?: SubmissionUploadState
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
          public_reference?: string
          request_fingerprint?: string
          status?: SubmissionStatus
          transmission?: string | null
          updated_at?: string
          upload_state?: SubmissionUploadState
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
          p_rate_limit: number
          p_request_rate_limit: number
          p_request_fingerprint: string
          p_submission_id: string
          p_transmission: string | null
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
