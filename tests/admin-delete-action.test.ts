import { beforeEach, describe, expect, it, vi } from 'vitest'

const actionMocks = vi.hoisted(() => ({
  deleteSubmissionPermanently: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`redirect:${path}`)
  }),
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: actionMocks.requireAdmin,
}))
vi.mock('@/lib/admin/delete-submission', () => ({
  deleteSubmissionPermanently: actionMocks.deleteSubmissionPermanently,
}))
vi.mock('next/cache', () => ({ revalidatePath: actionMocks.revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: actionMocks.redirect }))

import { deleteSubmissionAction } from '@/app/admin/delete-actions'

const SUBMISSION_ID = '123e4567-e89b-42d3-a456-426614174000'
const PUBLIC_REFERENCE = 'AP-1234567890'
const INITIAL_STATE = {
  kind: 'idle' as const,
  message: '',
  storageRemoved: false,
}

function deletionForm(confirmation = PUBLIC_REFERENCE) {
  const form = new FormData()
  form.set('id', SUBMISSION_ID)
  form.set('confirmation', confirmation)
  return form
}

describe('admin delete Server Action', () => {
  beforeEach(() => {
    actionMocks.deleteSubmissionPermanently.mockReset()
    actionMocks.redirect.mockClear()
    actionMocks.requireAdmin.mockReset()
    actionMocks.revalidatePath.mockClear()
    actionMocks.requireAdmin.mockResolvedValue({
      id: 'admin-user-id',
      email: 'admin@autopost.ge',
    })
  })

  it('checks the allow-listed authenticated admin before parsing or deletion', async () => {
    actionMocks.requireAdmin.mockRejectedValue(new Error('unauthorized'))

    await expect(
      deleteSubmissionAction(INITIAL_STATE, deletionForm()),
    ).rejects.toThrow('unauthorized')
    expect(actionMocks.deleteSubmissionPermanently).not.toHaveBeenCalled()
  })

  it('rejects a malformed confirmation without invoking privileged deletion', async () => {
    const result = await deleteSubmissionAction(
      INITIAL_STATE,
      deletionForm('delete'),
    )

    expect(result).toMatchObject({ kind: 'error', storageRemoved: false })
    expect(actionMocks.deleteSubmissionPermanently).not.toHaveBeenCalled()
  })

  it('preserves the partial-failure warning needed for a safe retry', async () => {
    actionMocks.deleteSubmissionPermanently.mockResolvedValue({
      ok: false,
      stage: 'database',
      storageRemoved: true,
    })

    const result = await deleteSubmissionAction(INITIAL_STATE, deletionForm())

    expect(result).toMatchObject({
      kind: 'error',
      storageRemoved: true,
      message: expect.stringContaining('განმეორება უსაფრთხოა'),
    })
  })

  it('invalidates admin reads and redirects after full deletion', async () => {
    actionMocks.deleteSubmissionPermanently.mockResolvedValue({ ok: true })

    await expect(
      deleteSubmissionAction(INITIAL_STATE, deletionForm()),
    ).rejects.toThrow('redirect:/admin')
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/admin')
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
      `/admin/${SUBMISSION_ID}`,
    )
  })
})
