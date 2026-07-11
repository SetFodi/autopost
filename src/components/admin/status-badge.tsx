import { STATUS_DETAILS } from '@/lib/admin/constants'
import type { SubmissionStatus } from '@/lib/admin/types'

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const details = STATUS_DETAILS[status]

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${details.className}`}
      aria-label={`სტატუსი: ${details.label}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${details.dotClassName}`}
      />
      {details.label}
    </span>
  )
}
