import { z } from 'zod'

import {
  GEORGIAN_PHONE_ERROR,
  isValidGeorgianPhone,
} from '@/lib/validation/phone'
import {
  SELLER_TYPES,
  VEHICLE_PRICE_CURRENCIES,
} from '@/lib/validation/submission'
import type { AppLocale } from '@/lib/i18n'

const currentYear = new Date().getFullYear()
const formattedPositiveNumber = /^\d[\d\s,]*(?:\.\d{1,2})?$/
const formattedNonNegativeInteger = /^\d[\d\s,]*$/

export function createPublicSubmissionFormSchema(locale: AppLocale) {
  const english = locale === 'en'
  const optionalText = (max: number) =>
    z
      .string()
      .trim()
      .max(
        max,
        english ? `Maximum ${max} characters.` : `მაქსიმუმ ${max} სიმბოლო.`,
      )
      .optional()

  return z.object({
    sellerType: z.enum(SELLER_TYPES, {
      error: english
        ? 'Choose whether you are a private seller or a dealer.'
        : 'აირჩიე, პირადი გამყიდველი ხარ თუ ავტოდილერი.',
    }),
    phone: z
      .string()
      .trim()
      .min(
        1,
        english
          ? 'Enter a phone or WhatsApp number.'
          : 'მიუთითე ტელეფონი ან WhatsApp ნომერი.',
      )
      .refine(
        isValidGeorgianPhone,
        english
          ? 'Enter a valid Georgian mobile number.'
          : GEORGIAN_PHONE_ERROR,
      ),
    customerName: optionalText(80),
    vehicleModel: z
      .string()
      .trim()
      .min(
        2,
        english
          ? 'Enter the vehicle make and model.'
          : 'მიუთითე ავტომობილის მარკა და მოდელი.',
      )
      .max(
        120,
        english
          ? 'Make and model must be 120 characters or fewer.'
          : 'მარკა და მოდელი მაქსიმუმ 120 სიმბოლო უნდა იყოს.',
      ),
    vehicleYear: z
      .string()
      .trim()
      .regex(
        /^\d{4}$/,
        english
          ? 'Enter the year using four digits.'
          : 'წელი მიუთითე ოთხი ციფრით.',
      )
      .refine(
        (value) => {
          const year = Number(value)
          return year >= 1900 && year <= currentYear + 1
        },
        english
          ? `Year must be between 1900 and ${currentYear + 1}.`
          : `წელი უნდა იყოს 1900-სა და ${currentYear + 1}-ს შორის.`,
      ),
    price: z
      .string()
      .trim()
      .min(1, english ? 'Enter the price.' : 'მიუთითე ფასი.')
      .max(
        50,
        english
          ? 'Price must be 50 characters or fewer.'
          : 'ფასი მაქსიმუმ 50 სიმბოლო უნდა იყოს.',
      )
      .refine(
        (value) => formattedPositiveNumber.test(value),
        english
          ? 'Enter the price using numbers only.'
          : 'ფასი მიუთითე მხოლოდ რიცხვით.',
      )
      .refine(
        (value) => {
          const amount = Number(value.replace(/[\s,]/g, ''))
          return Number.isFinite(amount) && amount > 0 && amount <= 100_000_000
        },
        english ? 'Enter a valid price.' : 'მიუთითე სწორი ფასი.',
      ),
    priceCurrency: z.enum(VEHICLE_PRICE_CURRENCIES, {
      error: english ? 'Choose a currency.' : 'აირჩიე ფასის ვალუტა.',
    }),
    mileage: z
      .string()
      .trim()
      .max(
        50,
        english
          ? 'Mileage must be 50 characters or fewer.'
          : 'გარბენი მაქსიმუმ 50 სიმბოლო უნდა იყოს.',
      )
      .refine(
        (value) => !value || formattedNonNegativeInteger.test(value),
        english
          ? 'Enter mileage using numbers only.'
          : 'გარბენი მიუთითე მხოლოდ რიცხვით.',
      )
      .refine(
        (value) => !value || Number(value.replace(/[\s,]/g, '')) <= 10_000_000,
        english ? 'Enter valid mileage.' : 'მიუთითე სწორი გარბენი.',
      )
      .optional(),
    engine: optionalText(50),
    transmission: optionalText(50),
    location: optionalText(80),
    additionalInfo: optionalText(1000),
    consentGiven: z
      .boolean()
      .refine(
        Boolean,
        english
          ? 'Consent is required to continue.'
          : 'გასაგრძელებლად საჭიროა თანხმობა.',
      ),
    website: z.string().max(0).optional(),
  })
}

export const publicSubmissionFormSchema = createPublicSubmissionFormSchema('ka')

export type PublicSubmissionFormValues = z.infer<
  typeof publicSubmissionFormSchema
>
