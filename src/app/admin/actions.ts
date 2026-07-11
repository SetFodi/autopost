'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getAdminConfigurationIssue, requireAdmin } from '@/lib/admin/auth'
import {
  SUBMISSION_STATUSES,
  type AdminActionState,
  type SubmissionStatus,
} from '@/lib/admin/types'
import {
  assertStatusPrerequisites,
  DELIVERY_URL_REQUIRED_MESSAGE,
  getStatusPrerequisiteIssue,
  SubmissionStatusPrerequisiteError,
} from '@/lib/admin/status-integrity'
import { isValidDeliveryUrl } from '@/lib/admin/whatsapp'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

const uuidSchema = z.string().uuid()
const statusSchema = z.enum(SUBMISSION_STATUSES)
const deliveryUrlSchema = z
  .string()
  .trim()
  .max(2_000, 'ბმული ზედმეტად გრძელია.')
  .refine(
    (value) => {
      if (!value) return true
      return isValidDeliveryUrl(value)
    },
    { message: 'მიუთითეთ სრული http:// ან https:// ბმული.' },
  )

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(256),
})

const editorSchema = z
  .object({
    id: uuidSchema,
    status: statusSchema,
    internalNotes: z
      .string()
      .max(5_000)
      .transform((value) => value.trim()),
    deliveryUrl: deliveryUrlSchema,
    amountPaid: z.coerce.number().min(0).max(1_000_000),
  })
  .superRefine((value, context) => {
    const issue = getStatusPrerequisiteIssue(
      value.status,
      value.deliveryUrl,
      value.amountPaid,
    )
    if (issue) {
      context.addIssue({
        code: 'custom',
        message: issue,
        path: [
          issue === DELIVERY_URL_REQUIRED_MESSAGE
            ? 'deliveryUrl'
            : 'amountPaid',
        ],
      })
    }
  })

type SubmissionPatch = Database['public']['Tables']['submissions']['Update']

async function updateSubmissionRecord(
  id: string,
  nextStatus: SubmissionStatus,
  patch: SubmissionPatch,
) {
  const supabase = getServiceSupabaseClient()
  const { data: current, error: currentError } = await supabase
    .from('submissions')
    .select('delivery_url, amount_paid')
    .eq('id', id)
    .eq('upload_state', 'complete')
    .maybeSingle()

  if (currentError || !current) {
    console.error('[admin] Failed to load submission prerequisites', {
      code: currentError?.code,
    })
    throw new Error('Submission update failed.')
  }

  const deliveryUrl =
    patch.delivery_url === undefined ? current.delivery_url : patch.delivery_url
  const amountPaid =
    patch.amount_paid === undefined ? current.amount_paid : patch.amount_paid
  assertStatusPrerequisites(nextStatus, deliveryUrl, amountPaid)

  const update: SubmissionPatch = {
    ...patch,
    status: nextStatus,
    updated_at: new Date().toISOString(),
  }

  const { data, error: updateError } = await supabase
    .from('submissions')
    .update(update)
    .eq('id', id)
    .eq('upload_state', 'complete')
    .select('id')
    .maybeSingle()

  if (updateError || !data) {
    console.error('[admin] Failed to update submission', updateError?.code)
    throw new Error('Submission update failed.')
  }
}

function refreshSubmissionRoutes(id: string) {
  revalidatePath('/admin')
  revalidatePath(`/admin/${id}`)
}

export async function loginAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const configurationIssue = getAdminConfigurationIssue()
  if (configurationIssue) {
    return {
      kind: 'error',
      message:
        process.env.NODE_ENV === 'production'
          ? 'ადმინისტრატორის ავტორიზაცია დროებით მიუწვდომელია.'
          : configurationIssue,
    }
  }

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { kind: 'error', message: 'შეავსეთ ელფოსტა და პაროლი.' }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

    if (
      error ||
      !data.user?.email ||
      data.user.email !== process.env.ADMIN_EMAIL
    ) {
      if (data.session) await supabase.auth.signOut()
      return { kind: 'error', message: 'ელფოსტა ან პაროლი არასწორია.' }
    }
  } catch {
    return {
      kind: 'error',
      message: 'შესვლა ვერ მოხერხდა. გადაამოწმეთ კავშირი და სცადეთ თავიდან.',
    }
  }

  redirect('/admin')
}

export async function signOutAction() {
  await requireAdmin()
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function updateSubmissionAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin()

  const parsed = editorSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
    internalNotes: formData.get('internalNotes') ?? '',
    deliveryUrl: formData.get('deliveryUrl') ?? '',
    amountPaid: formData.get('amountPaid') ?? 0,
  })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message
    return {
      kind: 'error',
      message: issue || 'შეამოწმეთ შეყვანილი მონაცემები.',
    }
  }

  try {
    await updateSubmissionRecord(parsed.data.id, parsed.data.status, {
      internal_notes: parsed.data.internalNotes || null,
      delivery_url: parsed.data.deliveryUrl || null,
      amount_paid: parsed.data.amountPaid,
    })

    refreshSubmissionRoutes(parsed.data.id)

    return {
      kind: 'success',
      message: 'ცვლილებები შენახულია.',
    }
  } catch (error) {
    return {
      kind: 'error',
      message:
        error instanceof SubmissionStatusPrerequisiteError
          ? error.message
          : 'ცვლილებების შენახვა ვერ მოხერხდა.',
    }
  }
}

export async function saveDeliveryUrlAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin()

  const parsed = z
    .object({ id: uuidSchema, deliveryUrl: deliveryUrlSchema })
    .safeParse({
      id: formData.get('id'),
      deliveryUrl: formData.get('deliveryUrl') ?? '',
    })

  if (!parsed.success) {
    return {
      kind: 'error',
      message: parsed.error.issues[0]?.message || 'ბმული არასწორია.',
    }
  }

  try {
    const supabase = getServiceSupabaseClient()
    const { data: current, error: currentError } = await supabase
      .from('submissions')
      .select('id, status, amount_paid')
      .eq('id', parsed.data.id)
      .eq('upload_state', 'complete')
      .maybeSingle()

    if (currentError || !current) {
      throw currentError ?? new Error('Submission not found.')
    }

    assertStatusPrerequisites(
      current.status,
      parsed.data.deliveryUrl || null,
      current.amount_paid,
    )

    const { data, error } = await supabase
      .from('submissions')
      .update({
        delivery_url: parsed.data.deliveryUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.id)
      .eq('upload_state', 'complete')
      .select('id')
      .maybeSingle()

    if (error || !data) throw error ?? new Error('Submission not found.')
    refreshSubmissionRoutes(parsed.data.id)
    return { kind: 'success', message: 'მიწოდების ბმული შენახულია.' }
  } catch (error) {
    return {
      kind: 'error',
      message:
        error instanceof SubmissionStatusPrerequisiteError
          ? error.message
          : 'ბმულის შენახვა ვერ მოხერხდა.',
    }
  }
}

export async function changeSubmissionStatusAction(
  id: string,
  nextStatus: string,
) {
  await requireAdmin()

  const parsed = z.object({ id: uuidSchema, status: statusSchema }).safeParse({
    id,
    status: nextStatus,
  })

  if (!parsed.success) throw new Error('Invalid status update.')

  await updateSubmissionRecord(parsed.data.id, parsed.data.status, {})
  refreshSubmissionRoutes(parsed.data.id)
}
