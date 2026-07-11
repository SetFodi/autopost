import { describe, expect, it } from 'vitest'

import {
  GEORGIAN_PHONE_ERROR,
  georgianPhoneSchema,
  normalizeGeorgianPhone,
} from '@/lib/validation/phone'

describe('normalizeGeorgianPhone', () => {
  it.each([
    '555 12 34 56',
    '555123456',
    '0555123456',
    '+995 555 12 34 56',
    '+995555123456',
    '+995 (555) 12-34-56',
  ])('normalizes %s', (input) => {
    expect(normalizeGeorgianPhone(input)).toBe('+995555123456')
  })

  it.each([
    '',
    '0322123456',
    '+1 555 123 4567',
    '55512345',
    '5551234567',
    '+995+555123456',
    '555-ABC-456',
  ])('rejects %s', (input) => {
    expect(normalizeGeorgianPhone(input)).toBeNull()
  })

  it('returns a Georgian validation message', () => {
    const result = georgianPhoneSchema.safeParse('123')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(GEORGIAN_PHONE_ERROR)
    }
  })
})
