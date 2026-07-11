import type { SubmissionStatus } from '@/lib/admin/types'

export const DELIVERY_URL_REQUIRED_MESSAGE =
  'გაგზავნილი სტატუსისთვის ჯერ შეინახეთ მიწოდების ბმული.'
export const POSITIVE_PAYMENT_REQUIRED_MESSAGE =
  'გადახდილი სტატუსისთვის მიღებული თანხა უნდა იყოს 0-ზე მეტი.'

export class SubmissionStatusPrerequisiteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SubmissionStatusPrerequisiteError'
  }
}

export function getStatusPrerequisiteIssue(
  status: SubmissionStatus,
  deliveryUrl: string | null | undefined,
  amountPaid: number | string | null | undefined,
): string | null {
  if (
    (status === 'delivered' || status === 'converted') &&
    !deliveryUrl?.trim()
  ) {
    return DELIVERY_URL_REQUIRED_MESSAGE
  }

  const payment = Number(amountPaid ?? 0)
  if (status === 'converted' && (!Number.isFinite(payment) || payment <= 0)) {
    return POSITIVE_PAYMENT_REQUIRED_MESSAGE
  }

  return null
}

export function assertStatusPrerequisites(
  status: SubmissionStatus,
  deliveryUrl: string | null | undefined,
  amountPaid: number | string | null | undefined,
) {
  const issue = getStatusPrerequisiteIssue(status, deliveryUrl, amountPaid)
  if (issue) throw new SubmissionStatusPrerequisiteError(issue)
}
