'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { LoaderCircle } from 'lucide-react'

type PendingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  pendingLabel?: string
}

export function PendingButton({
  children,
  pendingLabel = 'იტვირთება…',
  className = '',
  disabled,
  ...props
}: PendingButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      {...props}
      type="submit"
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}
