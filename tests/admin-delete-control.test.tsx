import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const componentMocks = vi.hoisted(() => ({
  deleteSubmissionAction: vi.fn(),
}))

vi.mock('@/app/admin/delete-actions', () => ({
  deleteSubmissionAction: componentMocks.deleteSubmissionAction,
}))

import { DeleteSubmissionControl } from '@/components/admin/delete-submission-control'

const PUBLIC_REFERENCE = 'AP-1234567890'
const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
)
const originalClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
)

describe('DeleteSubmissionControl', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function showModal(this: HTMLDialogElement) {
        this.setAttribute('open', '')
      },
    })
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: function close(this: HTMLDialogElement) {
        this.removeAttribute('open')
      },
    })
  })

  afterEach(() => {
    if (originalShowModal) {
      Object.defineProperty(
        HTMLDialogElement.prototype,
        'showModal',
        originalShowModal,
      )
    } else {
      delete (HTMLDialogElement.prototype as { showModal?: unknown }).showModal
    }

    if (originalClose) {
      Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose)
    } else {
      delete (HTMLDialogElement.prototype as { close?: unknown }).close
    }
  })

  it('requires a second step and the exact public reference', () => {
    render(
      <DeleteSubmissionControl
        submissionId="123e4567-e89b-42d3-a456-426614174000"
        publicReference={PUBLIC_REFERENCE}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'წაშლის დაწყება' }))

    const confirmation = screen.getByLabelText(new RegExp(PUBLIC_REFERENCE))
    const irreversibleDelete = screen.getByRole('button', {
      name: 'შეუქცევადად წაშლა',
    })

    expect(irreversibleDelete).toBeDisabled()
    fireEvent.change(confirmation, { target: { value: 'AP-0000000000' } })
    expect(irreversibleDelete).toBeDisabled()
    fireEvent.change(confirmation, { target: { value: PUBLIC_REFERENCE } })
    expect(irreversibleDelete).toBeEnabled()
  })
})
