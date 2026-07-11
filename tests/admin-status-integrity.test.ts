import { describe, expect, it } from 'vitest'

import {
  DELIVERY_URL_REQUIRED_MESSAGE,
  getStatusPrerequisiteIssue,
  POSITIVE_PAYMENT_REQUIRED_MESSAGE,
} from '@/lib/admin/status-integrity'

describe('admin status-transition prerequisites', () => {
  it('requires a saved URL before a delivered status', () => {
    expect(getStatusPrerequisiteIssue('delivered', null, 0)).toBe(
      DELIVERY_URL_REQUIRED_MESSAGE,
    )
    expect(getStatusPrerequisiteIssue('delivered', '   ', 0)).toBe(
      DELIVERY_URL_REQUIRED_MESSAGE,
    )
    expect(
      getStatusPrerequisiteIssue(
        'delivered',
        'https://drive.example.test/preview',
        0,
      ),
    ).toBeNull()
  })

  it('requires both a saved URL and positive payment before conversion', () => {
    expect(getStatusPrerequisiteIssue('converted', null, 14.9)).toBe(
      DELIVERY_URL_REQUIRED_MESSAGE,
    )
    expect(
      getStatusPrerequisiteIssue(
        'converted',
        'https://drive.example.test/delivery',
        0,
      ),
    ).toBe(POSITIVE_PAYMENT_REQUIRED_MESSAGE)
    expect(
      getStatusPrerequisiteIssue(
        'converted',
        'https://drive.example.test/delivery',
        14.9,
      ),
    ).toBeNull()
  })

  it('does not apply delivery or payment prerequisites to earlier statuses', () => {
    expect(getStatusPrerequisiteIssue('preview_ready', null, 0)).toBeNull()
    expect(getStatusPrerequisiteIssue('rejected', null, 0)).toBeNull()
  })
})
