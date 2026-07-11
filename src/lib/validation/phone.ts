import { z } from 'zod'

export const GEORGIAN_PHONE_ERROR =
  'შეიყვანეთ მოქმედი ქართული მობილურის ნომერი.'

const ALLOWED_PHONE_CHARACTERS = /^[+0-9\s()\-]+$/
const GEORGIAN_MOBILE_LOCAL = /^5[0-9]{8}$/

/**
 * Normalizes common Georgian mobile formats to +9955XXXXXXXX.
 * Returns null for landlines, foreign numbers, or malformed input.
 */
export function normalizeGeorgianPhone(input: string): string | null {
  const value = input.trim()

  if (!value || !ALLOWED_PHONE_CHARACTERS.test(value)) {
    return null
  }

  const plusCount = (value.match(/\+/g) ?? []).length
  if (plusCount > 1 || (plusCount === 1 && !value.startsWith('+'))) {
    return null
  }

  const digits = value.replace(/[^0-9]/g, '')
  let localNumber: string

  if (digits.length === 9) {
    localNumber = digits
  } else if (digits.length === 10 && digits.startsWith('0')) {
    localNumber = digits.slice(1)
  } else if (digits.length === 12 && digits.startsWith('995')) {
    localNumber = digits.slice(3)
  } else {
    return null
  }

  return GEORGIAN_MOBILE_LOCAL.test(localNumber) ? `+995${localNumber}` : null
}

export function isValidGeorgianPhone(input: string): boolean {
  return normalizeGeorgianPhone(input) !== null
}

export const georgianPhoneSchema = z
  .string()
  .trim()
  .min(1, GEORGIAN_PHONE_ERROR)
  .transform((value, context) => {
    const normalized = normalizeGeorgianPhone(value)
    if (!normalized) {
      context.addIssue({
        code: 'custom',
        message: GEORGIAN_PHONE_ERROR,
      })
      return z.NEVER
    }

    return normalized
  })
