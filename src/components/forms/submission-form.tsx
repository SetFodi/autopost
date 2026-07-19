'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import {
  AlertCircle,
  Building2,
  Check,
  LoaderCircle,
  LockKeyhole,
  Send,
  UserRound,
} from 'lucide-react'
import { useForm, type DefaultValues } from 'react-hook-form'

import { PhotoDropzone } from '@/components/forms/photo-dropzone'
import type { SelectedPhoto } from '@/components/forms/photo-types'
import {
  canPreviewPhoto,
  createPhotoFingerprint,
  getPhotoPreparationErrorMessage,
  preparePhotos,
  validatePreparedPhotos,
  validateRawPhotos,
  withReliableMimeType,
} from '@/components/forms/photo-utils'
import {
  createPublicSubmissionFormSchema,
  type PublicSubmissionFormValues,
} from '@/components/forms/submission-form-schema'
import { getSubmissionFormCopy } from '@/components/forms/submission-form-copy'
import { SubmissionSuccess } from '@/components/forms/submission-success'
import { trackInternalEvent } from '@/lib/analytics/client'
import {
  trackMetaFormStarted,
  trackMetaLeadOnce,
} from '@/lib/analytics/meta-pixel'
import { getCampaignAttribution } from '@/lib/analytics/attribution'
import type { AppLocale } from '@/lib/i18n'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { normalizeGeorgianPhone } from '@/lib/validation/phone'
import {
  MAX_PHOTO_COUNT,
  MIN_PHOTO_COUNT,
  SUBMISSION_BUCKET,
  VEHICLE_PRICE_CURRENCIES,
  type AllowedImageMimeType,
  type SubmissionCompleteInput,
  type SubmissionInitInput,
} from '@/lib/validation/submission'
import type { SubmissionCompleteResponse } from '@/types/submission'

type SubmissionPhase =
  | 'idle'
  | 'preparing'
  | 'initializing'
  | 'uploading'
  | 'completing'
  | 'error'
  | 'success'

interface InitUpload {
  fileIndex: number
  path: string
  token: string
}

interface InitResponse {
  submissionId: string
  publicReference: string
  completionToken: string
  uploads: InitUpload[]
}

interface UploadAttempt {
  init: InitResponse
  uploadedIndexes: Set<number>
}

interface SuccessDetails {
  publicReference: string
  vehicleModel: string
  photoCount: number
  resultUrl: string
}

interface SubmissionFormProps {
  whatsappNumber?: string
  locale?: AppLocale
}

class SubmissionError extends Error {}

const defaultValues: DefaultValues<PublicSubmissionFormValues> = {
  phone: '',
  customerName: '',
  vehicleModel: '',
  vehicleYear: '',
  price: '',
  priceCurrency: 'GEL',
  mileage: '',
  engine: '',
  transmission: '',
  location: '',
  additionalInfo: '',
  consentGiven: false,
  website: '',
}

function optionalValue(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function numericValue(value: string) {
  return Number(value.replace(/[\s,]/g, ''))
}

function genericResponseMessage(status: number, locale: AppLocale) {
  const copy = getSubmissionFormCopy(locale)
  if (status === 429) return copy.response429
  if (status === 413) return copy.response413
  return copy.responseGeneric
}

async function parseSuccessfulResponse<T>(
  response: Response,
  locale: AppLocale,
): Promise<T> {
  if (!response.ok) {
    try {
      const payload = (await response.json()) as {
        code?: unknown
        error?: unknown
      }
      if (
        (payload.code === 'CONFIGURATION_ERROR' ||
          payload.code === 'INTAKE_CAPACITY_EXCEEDED') &&
        typeof payload.error === 'string'
      ) {
        throw new SubmissionError(
          locale === 'ka'
            ? payload.error
            : getSubmissionFormCopy(locale).responseGeneric,
        )
      }
    } catch (error) {
      if (error instanceof SubmissionError) throw error
    }

    throw new SubmissionError(genericResponseMessage(response.status, locale))
  }
  try {
    return (await response.json()) as T
  } catch {
    return {} as T
  }
}

function isValidInitResponse(value: InitResponse, photoCount: number) {
  return (
    typeof value.submissionId === 'string' &&
    typeof value.publicReference === 'string' &&
    /^v1:[a-f0-9]{64}$/.test(value.completionToken) &&
    Array.isArray(value.uploads) &&
    value.uploads.length === photoCount &&
    value.uploads.every(
      (upload) =>
        Number.isInteger(upload.fileIndex) &&
        upload.fileIndex >= 0 &&
        upload.fileIndex < photoCount &&
        typeof upload.path === 'string' &&
        typeof upload.token === 'string',
    ) &&
    new Set(value.uploads.map((upload) => upload.fileIndex)).size === photoCount
  )
}

export function SubmissionForm({
  whatsappNumber,
  locale = 'ka',
}: SubmissionFormProps) {
  const copy = getSubmissionFormCopy(locale)
  const formSchema = useMemo(
    () => createPublicSubmissionFormSchema(locale),
    [locale],
  )
  const [photos, setPhotos] = useState<SelectedPhoto[]>([])
  const [phase, setPhase] = useState<SubmissionPhase>('idle')
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [completedUploads, setCompletedUploads] = useState(0)
  const [successDetails, setSuccessDetails] = useState<SuccessDetails | null>(
    null,
  )
  const attemptKeyRef = useRef<string | null>(null)
  const uploadAttemptRef = useRef<UploadAttempt | null>(null)
  const submittingLockRef = useRef(false)
  const preparingLockRef = useRef(false)
  const formStartedRef = useRef(false)
  const photosRef = useRef<SelectedPhoto[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PublicSubmissionFormValues>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const isBusy =
    phase === 'preparing' ||
    phase === 'initializing' ||
    phase === 'uploading' ||
    phase === 'completing'
  const uploadProgress = photos.length
    ? Math.round((completedUploads / photos.length) * 100)
    : 0

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => {
        if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl)
      })
    }
  }, [])

  function markFormStarted() {
    if (formStartedRef.current) return
    formStartedRef.current = true
    trackMetaFormStarted()
    trackInternalEvent('form_started', {
      metadata: { source: 'landing_form', locale },
    })
  }

  function invalidateRecoverableAttempt() {
    if (phase !== 'error') return
    attemptKeyRef.current = null
    uploadAttemptRef.current = null
    setCompletedUploads(0)
    setSubmissionError(null)
    setPhase('idle')
    setPhotos((current) =>
      current.map((photo) => ({
        ...photo,
        status: 'ready',
        progress: 0,
        error: undefined,
      })),
    )
  }

  async function addPhotos(incomingFiles: File[]) {
    if (isBusy || preparingLockRef.current) return
    markFormStarted()
    invalidateRecoverableAttempt()
    setPhotoError(null)

    const existingFingerprints = new Set(
      photos.map((photo) => photo.sourceFingerprint),
    )
    const batchFingerprints = new Set<string>()
    const uniqueRawFiles = incomingFiles.filter((file) => {
      const fingerprint = createPhotoFingerprint(file)
      if (
        existingFingerprints.has(fingerprint) ||
        batchFingerprints.has(fingerprint)
      )
        return false
      batchFingerprints.add(fingerprint)
      return true
    })

    if (!uniqueRawFiles.length) {
      setPhotoError(copy.duplicatePhotos)
      return
    }
    if (photos.length + uniqueRawFiles.length > MAX_PHOTO_COUNT) {
      setPhotoError(copy.maxPhotos(MAX_PHOTO_COUNT))
      return
    }

    const rawError = validateRawPhotos(uniqueRawFiles)
    if (rawError) {
      setPhotoError(locale === 'ka' ? rawError : copy.invalidRawPhotos)
      return
    }

    preparingLockRef.current = true
    setPhase('preparing')
    try {
      const preparedPhotos = await preparePhotos(
        uniqueRawFiles.map((file) => withReliableMimeType(file)),
      )
      const preparedFiles = preparedPhotos.map((photo) => photo.file)
      const preparedError = validatePreparedPhotos(
        preparedFiles,
        photos.map((photo) => photo.file),
      )
      if (preparedError) {
        setPhotoError(
          locale === 'ka' ? preparedError : copy.invalidPreparedPhotos,
        )
        return
      }

      const selectedPhotos = preparedPhotos.map<SelectedPhoto>(
        (photo, index) => ({
          id: crypto.randomUUID(),
          file: photo.file,
          sourceFingerprint: createPhotoFingerprint(uniqueRawFiles[index]!),
          metadataSanitized: photo.metadataSanitized,
          previewUrl: canPreviewPhoto(photo.file)
            ? URL.createObjectURL(photo.file)
            : null,
          status: 'ready',
          progress: 0,
        }),
      )
      setPhotos((current) => [...current, ...selectedPhotos])
      trackInternalEvent('photo_added', {
        metadata: {
          addedCount: selectedPhotos.length,
          totalCount: photos.length + selectedPhotos.length,
        },
      })
    } catch (error) {
      setPhotoError(
        locale === 'ka'
          ? getPhotoPreparationErrorMessage(error)
          : copy.preparationFailed,
      )
    } finally {
      preparingLockRef.current = false
      setPhase('idle')
    }
  }

  function removePhoto(photoId: string) {
    if (isBusy) return
    invalidateRecoverableAttempt()
    setPhotos((current) => {
      const photo = current.find((item) => item.id === photoId)
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl)
      return current.filter((item) => item.id !== photoId)
    })
    setPhotoError(null)
  }

  function updatePhotoStatus(
    index: number,
    status: SelectedPhoto['status'],
    progress: number,
    error?: string,
  ) {
    setPhotos((current) =>
      current.map((photo, photoIndex) =>
        photoIndex === index ? { ...photo, status, progress, error } : photo,
      ),
    )
  }

  function createInitPayload(
    values: PublicSubmissionFormValues,
  ): SubmissionInitInput {
    const phone = normalizeGeorgianPhone(values.phone)
    if (!phone) throw new SubmissionError(copy.invalidPhone)

    return {
      ...getCampaignAttribution(),
      phone,
      sellerType: values.sellerType,
      customerName: optionalValue(values.customerName),
      vehicleModel: values.vehicleModel.trim(),
      vehicleYear: Number(values.vehicleYear),
      price: numericValue(values.price),
      priceCurrency: values.priceCurrency,
      mileage: values.mileage?.trim()
        ? numericValue(values.mileage)
        : undefined,
      engine: optionalValue(values.engine),
      transmission: optionalValue(values.transmission),
      location: optionalValue(values.location),
      additionalInfo: optionalValue(values.additionalInfo),
      consentGiven: true,
      website: values.website ?? '',
      files: photos.map((photo, index) => ({
        originalFilename: photo.file.name,
        mimeType: photo.file.type as AllowedImageMimeType,
        fileSize: photo.file.size,
        sortOrder: index,
      })),
    }
  }

  async function initializeSubmission(values: PublicSubmissionFormValues) {
    const idempotencyKey = attemptKeyRef.current ?? crypto.randomUUID()
    attemptKeyRef.current = idempotencyKey
    setPhase('initializing')

    const response = await fetch('/api/submissions/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(createInitPayload(values)),
    })
    const init = await parseSuccessfulResponse<InitResponse>(response, locale)
    if (!isValidInitResponse(init, photos.length)) {
      throw new SubmissionError(copy.initFailed)
    }

    const attempt: UploadAttempt = { init, uploadedIndexes: new Set() }
    uploadAttemptRef.current = attempt
    return attempt
  }

  async function uploadPhotos(attempt: UploadAttempt) {
    setPhase('uploading')
    const supabase = createBrowserSupabaseClient()
    const orderedUploads = [...attempt.init.uploads].sort(
      (a, b) => a.fileIndex - b.fileIndex,
    )
    const ambiguousFailures: number[] = []

    for (const upload of orderedUploads) {
      if (attempt.uploadedIndexes.has(upload.fileIndex)) continue
      const selectedPhoto = photos[upload.fileIndex]
      if (!selectedPhoto) throw new SubmissionError(copy.photosChanged)

      updatePhotoStatus(upload.fileIndex, 'uploading', 12)
      const { error } = await supabase.storage
        .from(SUBMISSION_BUCKET)
        .uploadToSignedUrl(upload.path, upload.token, selectedPhoto.file, {
          contentType: selectedPhoto.file.type,
          cacheControl: '3600',
        })

      if (error) {
        updatePhotoStatus(upload.fileIndex, 'error', 100, copy.uploadFailed)
        ambiguousFailures.push(upload.fileIndex)
        continue
      }

      attempt.uploadedIndexes.add(upload.fileIndex)
      updatePhotoStatus(upload.fileIndex, 'uploaded', 100)
      setCompletedUploads(attempt.uploadedIndexes.size)
    }

    if (!ambiguousFailures.length) return false

    // A mobile connection can lose the Storage response after the object was
    // committed. Let the server verify every immutable path before treating it
    // as a real partial failure; this also makes a retry recover from 409s.
    try {
      const completion = await completeSubmission(attempt)
      attempt.init.uploads.forEach((upload) =>
        updatePhotoStatus(upload.fileIndex, 'uploaded', 100),
      )
      attempt.init.uploads.forEach((upload) =>
        attempt.uploadedIndexes.add(upload.fileIndex),
      )
      setCompletedUploads(attempt.init.uploads.length)
      return completion
    } catch {
      throw new SubmissionError(copy.photoRetry(ambiguousFailures[0] + 1))
    }
  }

  async function completeSubmission(attempt: UploadAttempt) {
    setPhase('completing')
    const payload: SubmissionCompleteInput = {
      submissionId: attempt.init.submissionId,
      completionToken: attempt.init.completionToken,
      uploaded: [...attempt.init.uploads]
        .sort((a, b) => a.fileIndex - b.fileIndex)
        .map(({ fileIndex, path }) => ({ fileIndex, path })),
    }
    const response = await fetch('/api/submissions/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return parseSuccessfulResponse<SubmissionCompleteResponse>(response, locale)
  }

  async function submit(values: PublicSubmissionFormValues) {
    if (submittingLockRef.current || isBusy) return
    markFormStarted()

    if (photos.length < MIN_PHOTO_COUNT || photos.length > MAX_PHOTO_COUNT) {
      setPhotoError(
        photos.length < MIN_PHOTO_COUNT
          ? copy.minPhotos(MIN_PHOTO_COUNT)
          : copy.maxPhotos(MAX_PHOTO_COUNT),
      )
      document.getElementById('vehicle-photos')?.focus()
      return
    }

    submittingLockRef.current = true
    setSubmissionError(null)
    setPhotoError(null)

    try {
      const attempt =
        uploadAttemptRef.current ?? (await initializeSubmission(values))
      const completedDuringUploadRecovery = await uploadPhotos(attempt)
      const completion =
        completedDuringUploadRecovery || (await completeSubmission(attempt))

      const details: SuccessDetails = {
        publicReference: attempt.init.publicReference,
        vehicleModel: values.vehicleModel.trim(),
        photoCount: photos.length,
        resultUrl: completion.resultUrl,
      }
      trackMetaLeadOnce(details.publicReference, values.sellerType)
      setSuccessDetails(details)
      setPhase('success')
      attemptKeyRef.current = null
      uploadAttemptRef.current = null
      photos.forEach((photo) => {
        if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl)
      })
      setPhotos([])
    } catch (error) {
      setPhase('error')
      setSubmissionError(
        error instanceof SubmissionError ? error.message : copy.responseGeneric,
      )
    } finally {
      submittingLockRef.current = false
    }
  }

  function handleMeaningfulInput(event: FormEvent<HTMLFormElement>) {
    const target = event.target as
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    if (target.name && target.name !== 'website') markFormStarted()
  }

  if (phase === 'success' && successDetails) {
    return (
      <SubmissionSuccess
        {...successDetails}
        whatsappNumber={whatsappNumber}
        locale={locale}
      />
    )
  }

  return (
    <form
      noValidate
      aria-busy={isBusy}
      onInputCapture={handleMeaningfulInput}
      onChangeCapture={invalidateRecoverableAttempt}
      onSubmit={(event) => {
        void handleSubmit(submit, () => {
          setSubmissionError(copy.reviewFields)
        })(event)
      }}
      className="form-card"
    >
      <div className="border-graphite/12 flex items-start justify-between gap-5 border-b pb-6">
        <div className="min-w-0">
          <p className="text-graphite/65 text-[10px] font-extrabold tracking-[0.18em] uppercase">
            {copy.freeNoCard}
          </p>
          <h2 className="font-display text-graphite mt-2 text-3xl leading-tight font-bold tracking-[-0.05em] [overflow-wrap:anywhere] sm:text-4xl">
            {copy.formTitle}
          </h2>
        </div>
        <span className="bg-graphite text-amber grid size-11 shrink-0 place-items-center rounded-full">
          <Send aria-hidden="true" className="size-5" />
        </span>
      </div>

      <fieldset
        disabled={isBusy}
        className="mt-7 space-y-5 disabled:opacity-75"
      >
        <fieldset>
          <legend className="form-label">
            {copy.sellerLegend} <span aria-hidden="true">*</span>
          </legend>
          <div
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-required="true"
            aria-invalid={Boolean(errors.sellerType)}
            aria-describedby={
              errors.sellerType ? 'seller-type-error' : undefined
            }
          >
            <label className="group relative min-w-0 cursor-pointer">
              <input
                type="radio"
                value="private_seller"
                className="peer sr-only"
                {...register('sellerType')}
              />
              <span className="border-graphite/14 text-graphite/68 peer-checked:border-graphite peer-checked:bg-graphite peer-checked:text-ivory peer-focus-visible:ring-graphite flex min-h-12 items-center justify-center gap-2 border px-3 text-center text-xs font-bold transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 sm:text-sm">
                <UserRound aria-hidden="true" className="size-4 shrink-0" />
                <span className="min-w-0">{copy.privateSeller}</span>
              </span>
            </label>
            <label className="group relative min-w-0 cursor-pointer">
              <input
                type="radio"
                value="dealer"
                className="peer sr-only"
                {...register('sellerType')}
              />
              <span className="border-graphite/14 text-graphite/68 peer-checked:border-graphite peer-checked:bg-graphite peer-checked:text-ivory peer-focus-visible:ring-graphite flex min-h-12 items-center justify-center gap-2 border px-3 text-center text-xs font-bold transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 sm:text-sm">
                <Building2 aria-hidden="true" className="size-4 shrink-0" />
                <span className="min-w-0">{copy.dealer}</span>
              </span>
            </label>
          </div>
          {errors.sellerType ? (
            <p id="seller-type-error" role="alert" className="form-error">
              <AlertCircle aria-hidden="true" className="size-4 shrink-0" />{' '}
              {errors.sellerType.message}
            </p>
          ) : null}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="form-label">
              {copy.phone} <span aria-hidden="true">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+995 5XX XX XX XX"
              className="form-input"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              {...register('phone')}
            />
            {errors.phone ? (
              <p id="phone-error" role="alert" className="form-error">
                <AlertCircle aria-hidden="true" className="size-4 shrink-0" />{' '}
                {errors.phone.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="customerName" className="form-label">
              {copy.name}{' '}
              <span className="text-graphite/65 font-normal">
                ({copy.optional})
              </span>
            </label>
            <input
              id="customerName"
              type="text"
              autoComplete="name"
              placeholder={copy.namePlaceholder}
              className="form-input"
              aria-invalid={Boolean(errors.customerName)}
              aria-describedby={
                errors.customerName ? 'customer-name-error' : undefined
              }
              {...register('customerName')}
            />
            {errors.customerName ? (
              <p id="customer-name-error" role="alert" className="form-error">
                {errors.customerName.message}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="vehicleModel" className="form-label">
            {copy.makeModel} <span aria-hidden="true">*</span>
          </label>
          <input
            id="vehicleModel"
            type="text"
            placeholder={
              locale === 'en'
                ? 'e.g. Toyota Camry / Mercedes C200'
                : 'მაგ. Toyota Camry / Mercedes C200'
            }
            className="form-input"
            aria-invalid={Boolean(errors.vehicleModel)}
            aria-describedby={
              errors.vehicleModel ? 'vehicle-model-error' : undefined
            }
            {...register('vehicleModel')}
          />
          {errors.vehicleModel ? (
            <p id="vehicle-model-error" role="alert" className="form-error">
              <AlertCircle aria-hidden="true" className="size-4 shrink-0" />{' '}
              {errors.vehicleModel.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">
          <div>
            <label htmlFor="vehicleYear" className="form-label">
              {copy.year} <span aria-hidden="true">*</span>
            </label>
            <input
              id="vehicleYear"
              type="text"
              inputMode="numeric"
              placeholder="2021"
              maxLength={4}
              className="form-input"
              aria-invalid={Boolean(errors.vehicleYear)}
              aria-describedby={
                errors.vehicleYear ? 'vehicle-year-error' : undefined
              }
              {...register('vehicleYear')}
            />
            {errors.vehicleYear ? (
              <p id="vehicle-year-error" role="alert" className="form-error">
                {errors.vehicleYear.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="price" className="form-label">
              {copy.price} <span aria-hidden="true">*</span>
            </label>
            <input
              id="price"
              type="text"
              inputMode="decimal"
              placeholder="24 900"
              className="form-input"
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? 'price-error' : undefined}
              {...register('price')}
            />
            {errors.price ? (
              <p id="price-error" role="alert" className="form-error">
                {errors.price.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="priceCurrency" className="form-label">
              {copy.currency} <span aria-hidden="true">*</span>
            </label>
            <select
              id="priceCurrency"
              className="form-input"
              aria-invalid={Boolean(errors.priceCurrency)}
              aria-describedby={
                errors.priceCurrency ? 'price-currency-error' : undefined
              }
              {...register('priceCurrency')}
            >
              {VEHICLE_PRICE_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency === 'GEL' ? '₾ GEL' : '$ USD'}
                </option>
              ))}
            </select>
            {errors.priceCurrency ? (
              <p id="price-currency-error" role="alert" className="form-error">
                {errors.priceCurrency.message}
              </p>
            ) : null}
          </div>
        </div>

        <details className="optional-fields border-graphite/12 border-y py-1">
          <summary className="text-graphite flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold marker:hidden">
            {copy.additional}
            <span className="border-graphite/15 text-graphite/65 rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-[0.12em] uppercase">
              {copy.optional}
            </span>
          </summary>
          <div className="grid gap-5 pt-3 pb-5 sm:grid-cols-2">
            <div>
              <label htmlFor="mileage" className="form-label">
                {copy.mileage}
              </label>
              <input
                id="mileage"
                type="text"
                inputMode="numeric"
                placeholder="85 000"
                className="form-input"
                aria-invalid={Boolean(errors.mileage)}
                aria-describedby={errors.mileage ? 'mileage-error' : undefined}
                {...register('mileage')}
              />
              {errors.mileage ? (
                <p id="mileage-error" role="alert" className="form-error">
                  {errors.mileage.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="engine" className="form-label">
                {copy.engine}
              </label>
              <input
                id="engine"
                type="text"
                placeholder="2.0 Turbo"
                className="form-input"
                aria-invalid={Boolean(errors.engine)}
                aria-describedby={errors.engine ? 'engine-error' : undefined}
                {...register('engine')}
              />
              {errors.engine ? (
                <p id="engine-error" role="alert" className="form-error">
                  {errors.engine.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="transmission" className="form-label">
                {copy.transmission}
              </label>
              <select
                id="transmission"
                className="form-input appearance-none"
                {...register('transmission')}
              >
                <option value="">{copy.choose}</option>
                <option value="ავტომატიკა">{copy.automatic}</option>
                <option value="მექანიკა">{copy.manual}</option>
                <option value="ვარიატორი">{copy.cvt}</option>
                <option value="რობოტი">{copy.robot}</option>
              </select>
            </div>
            <div>
              <label htmlFor="location" className="form-label">
                {copy.location}
              </label>
              <input
                id="location"
                type="text"
                placeholder={copy.locationPlaceholder}
                className="form-input"
                aria-invalid={Boolean(errors.location)}
                aria-describedby={
                  errors.location ? 'location-error' : undefined
                }
                {...register('location')}
              />
              {errors.location ? (
                <p id="location-error" role="alert" className="form-error">
                  {errors.location.message}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="additionalInfo" className="form-label">
                {copy.additional}
              </label>
              <textarea
                id="additionalInfo"
                rows={4}
                placeholder={copy.detailsPlaceholder}
                className="form-input min-h-28 resize-y py-3"
                aria-invalid={Boolean(errors.additionalInfo)}
                aria-describedby={
                  errors.additionalInfo ? 'additional-info-error' : undefined
                }
                {...register('additionalInfo')}
              />
              {errors.additionalInfo ? (
                <p
                  id="additional-info-error"
                  role="alert"
                  className="form-error"
                >
                  {errors.additionalInfo.message}
                </p>
              ) : null}
            </div>
          </div>
        </details>

        <PhotoDropzone
          photos={photos}
          error={photoError}
          disabled={isBusy}
          preparing={phase === 'preparing'}
          locale={locale}
          onFilesSelected={(files) => void addPhotos(files)}
          onRemove={removePhoto}
        />

        <div className="sr-only" aria-hidden="true">
          <label htmlFor="website">{copy.website}</label>
          <input
            id="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register('website')}
          />
        </div>

        <div>
          <label htmlFor="consentGiven" className="consent-row">
            <input
              id="consentGiven"
              type="checkbox"
              className="peer sr-only"
              aria-invalid={Boolean(errors.consentGiven)}
              aria-describedby={
                errors.consentGiven ? 'consent-given-error' : undefined
              }
              {...register('consentGiven')}
            />
            <span className="consent-check" aria-hidden="true">
              <Check
                className="size-3 opacity-0 peer-checked:opacity-100"
                strokeWidth={3}
              />
            </span>
            <span>{copy.consent}</span>
          </label>
          {errors.consentGiven ? (
            <p
              id="consent-given-error"
              role="alert"
              className="form-error mt-2"
            >
              {errors.consentGiven.message}
            </p>
          ) : null}
        </div>
      </fieldset>

      {isBusy ? (
        <div className="mt-6" aria-live="polite">
          <div className="text-graphite/65 mb-2 flex items-center justify-between gap-3 text-xs font-semibold">
            <span>
              {phase === 'preparing'
                ? copy.preparing
                : phase === 'initializing'
                  ? copy.initializing
                  : phase === 'completing'
                    ? copy.completing
                    : copy.uploading(completedUploads, photos.length)}
            </span>
            <span className="font-mono">
              {phase === 'uploading' ? `${uploadProgress}%` : ''}
            </span>
          </div>
          <div className="bg-graphite/10 h-2 overflow-hidden rounded-full">
            <div
              className={`bg-amber h-full transition-[width] duration-500 ${phase !== 'uploading' ? 'animate-pulse' : ''}`}
              style={{
                width:
                  phase === 'initializing'
                    ? '8%'
                    : phase === 'completing'
                      ? '100%'
                      : `${uploadProgress}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {submissionError ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 border border-[#a8322f]/35 bg-[#a8322f]/8 p-4 text-sm leading-6 text-[#7e211f]"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-bold">{copy.errorTitle}</p>
            <p className="mt-1">{submissionError}</p>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isBusy}
        className="form-submit group mt-6"
      >
        <span>{copy.submit}</span>
        {isBusy ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <Send
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        )}
      </button>
      <p className="text-graphite/65 mt-3 flex items-center justify-center gap-2 text-center text-[11px] leading-5">
        <LockKeyhole aria-hidden="true" className="size-3.5" /> {copy.secure}
      </p>
    </form>
  )
}
