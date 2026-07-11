import { z } from 'zod'

import {
  GEORGIAN_PHONE_ERROR,
  isValidGeorgianPhone,
} from '@/lib/validation/phone'

const currentYear = new Date().getFullYear()
const formattedPositiveNumber = /^\d[\d\s,]*(?:\.\d{1,2})?$/
const formattedNonNegativeInteger = /^\d[\d\s,]*$/

const optionalText = (max: number) =>
  z.string().trim().max(max, `მაქსიმუმ ${max} სიმბოლო.`).optional()

export const publicSubmissionFormSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'მიუთითე ტელეფონი ან WhatsApp ნომერი.')
    .refine(isValidGeorgianPhone, GEORGIAN_PHONE_ERROR),
  customerName: optionalText(80),
  vehicleModel: z
    .string()
    .trim()
    .min(2, 'მიუთითე ავტომობილის მარკა და მოდელი.')
    .max(120, 'მარკა და მოდელი მაქსიმუმ 120 სიმბოლო უნდა იყოს.'),
  vehicleYear: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'წელი მიუთითე ოთხი ციფრით.')
    .refine(
      (value) => {
        const year = Number(value)
        return year >= 1900 && year <= currentYear + 1
      },
      `წელი უნდა იყოს 1900-სა და ${currentYear + 1}-ს შორის.`,
    ),
  price: z
    .string()
    .trim()
    .min(1, 'მიუთითე ფასი.')
    .max(50, 'ფასი მაქსიმუმ 50 სიმბოლო უნდა იყოს.')
    .refine(
      (value) => formattedPositiveNumber.test(value),
      'ფასი მიუთითე მხოლოდ რიცხვით.',
    )
    .refine((value) => {
      const amount = Number(value.replace(/[\s,]/g, ''))
      return Number.isFinite(amount) && amount > 0 && amount <= 100_000_000
    }, 'მიუთითე სწორი ფასი.'),
  mileage: z
    .string()
    .trim()
    .max(50, 'გარბენი მაქსიმუმ 50 სიმბოლო უნდა იყოს.')
    .refine(
      (value) => !value || formattedNonNegativeInteger.test(value),
      'გარბენი მიუთითე მხოლოდ რიცხვით.',
    )
    .refine(
      (value) => !value || Number(value.replace(/[\s,]/g, '')) <= 10_000_000,
      'მიუთითე სწორი გარბენი.',
    )
    .optional(),
  engine: optionalText(50),
  transmission: optionalText(50),
  location: optionalText(80),
  additionalInfo: optionalText(1000),
  consentGiven: z.boolean().refine(Boolean, 'გასაგრძელებლად საჭიროა თანხმობა.'),
  website: z.string().max(0).optional(),
})

export type PublicSubmissionFormValues = z.infer<
  typeof publicSubmissionFormSchema
>
