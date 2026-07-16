'use client'

import { useState, type ChangeEvent, type DragEvent } from 'react'
import Image from 'next/image'
import {
  AlertCircle,
  Check,
  FileImage,
  ImagePlus,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react'

import type { SelectedPhoto } from '@/components/forms/photo-types'
import { formatBytes } from '@/components/forms/photo-utils'
import {
  MAX_FILE_SIZE_BYTES,
  MAX_PHOTO_COUNT,
  MAX_TOTAL_UPLOAD_SIZE_BYTES,
  MIN_PHOTO_COUNT,
} from '@/lib/validation/submission'

interface PhotoDropzoneProps {
  photos: SelectedPhoto[]
  error: string | null
  disabled: boolean
  preparing: boolean
  onFilesSelected: (files: File[]) => void
  onRemove: (photoId: string) => void
}

export function PhotoDropzone({
  photos,
  error,
  disabled,
  preparing,
  onFilesSelected,
  onRemove,
}: PhotoDropzoneProps) {
  const [dragging, setDragging] = useState(false)

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length) onFilesSelected(files)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    const files = Array.from(event.dataTransfer.files)
    if (files.length) onFilesSelected(files)
  }

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <label htmlFor="vehicle-photos" className="form-label">
            ავტომობილის ფოტოები <span aria-hidden="true">*</span>
          </label>
          <p
            id="vehicle-photos-help"
            className="text-graphite/65 mt-1 text-xs leading-5"
          >
            {MIN_PHOTO_COUNT}–{MAX_PHOTO_COUNT} ფოტო · თითოეული მაქს.{' '}
            {formatBytes(MAX_FILE_SIZE_BYTES)} · ჯამში{' '}
            {formatBytes(MAX_TOTAL_UPLOAD_SIZE_BYTES)}
            <span className="mt-1 block">
              ატვირთვამდე ბრაუზერი ხელახლა ქმნის ფოტოს და შლის EXIF/GPS
              მონაცემებს. HEIC/HEIF მიიღება მხოლოდ უსაფრთხო გარდაქმნისას.
            </span>
          </p>
        </div>
        <span className="text-graphite/65 shrink-0 font-mono text-xs font-bold">
          {photos.length} / {MAX_PHOTO_COUNT}
        </span>
      </div>

      <div
        className={`dropzone ${dragging ? 'dropzone-active' : ''} ${error ? 'dropzone-error' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setDragging(false)
        }}
        onDrop={handleDrop}
      >
        <input
          id="vehicle-photos"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
          multiple
          disabled={disabled}
          onChange={handleInput}
          className="peer sr-only"
          aria-describedby={`vehicle-photos-help${error ? ' vehicle-photos-error' : ''}`}
          aria-invalid={Boolean(error)}
        />
        <label
          htmlFor="vehicle-photos"
          className={`peer-focus-visible:ring-graphite flex min-h-40 cursor-pointer flex-col items-center justify-center px-5 py-8 text-center outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}
        >
          <span className="bg-graphite text-amber grid size-12 place-items-center rounded-full">
            {preparing ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
            ) : dragging ? (
              <UploadCloud aria-hidden="true" className="size-5" />
            ) : (
              <ImagePlus aria-hidden="true" className="size-5" />
            )}
          </span>
          <span className="text-graphite mt-4 text-sm font-bold">
            {preparing
              ? 'ფოტოები მზადდება…'
              : dragging
                ? 'ჩამოაგდე ფოტოები აქ'
                : 'აირჩიე ფოტოები'}
          </span>
          <span className="text-graphite/65 mt-1 text-xs leading-5">
            ან გადმოიტანე ამ ველში · JPG, PNG, WEBP, HEIC
          </span>
        </label>
      </div>

      {error ? (
        <p id="vehicle-photos-error" role="alert" className="form-error mt-2">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{' '}
          {error}
        </p>
      ) : null}

      {photos.length ? (
        <ul
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"
          aria-label="არჩეული ფოტოები"
        >
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="border-graphite/14 relative overflow-hidden border bg-[#d8d9d1]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#c9cbc3]">
                {photo.previewUrl ? (
                  <Image
                    src={photo.previewUrl}
                    alt={`არჩეული ფოტო ${index + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 45vw, 180px"
                    className="object-contain"
                  />
                ) : (
                  <div className="text-graphite/65 grid h-full place-items-center">
                    <FileImage aria-hidden="true" className="size-9" />
                    <span className="absolute bottom-2 text-[9px] font-bold tracking-[0.12em]">
                      HEIC / HEIF
                    </span>
                  </div>
                )}

                <span className="bg-graphite/90 text-ivory absolute top-2 left-2 grid size-6 place-items-center rounded-full font-mono text-[10px] font-bold">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(photo.id)}
                  disabled={disabled}
                  className="bg-graphite/90 text-ivory absolute top-2 right-2 grid size-11 place-items-center rounded-full transition-colors hover:bg-[#a8322f] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`${index + 1}-ე ფოტოს წაშლა`}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>

                {photo.status !== 'ready' ? (
                  <div className="bg-graphite/88 text-ivory absolute inset-x-0 bottom-0 p-2 text-[10px]">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5">
                        {photo.status === 'uploading' ? (
                          <LoaderCircle
                            aria-hidden="true"
                            className="text-amber size-3 animate-spin"
                          />
                        ) : null}
                        {photo.status === 'uploaded' ? (
                          <Check
                            aria-hidden="true"
                            className="text-amber size-3"
                          />
                        ) : null}
                        {photo.status === 'error' ? (
                          <AlertCircle
                            aria-hidden="true"
                            className="size-3 text-[#ff8a85]"
                          />
                        ) : null}
                        {photo.status === 'uploading'
                          ? 'იტვირთება'
                          : photo.status === 'uploaded'
                            ? 'ატვირთულია'
                            : 'ვერ აიტვირთა'}
                      </span>
                      <span>{photo.progress}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/15">
                      <div
                        className={`h-full transition-[width] duration-300 ${photo.status === 'error' ? 'bg-[#ff8a85]' : 'bg-amber'}`}
                        style={{ width: `${photo.progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="text-graphite/65 flex items-center justify-between gap-2 px-2.5 py-2 text-[10px]">
                <span className="min-w-0 truncate">{photo.file.name}</span>
                <span className="shrink-0 font-mono">
                  {formatBytes(photo.file.size)}
                </span>
              </div>
              {photo.metadataSanitized ? (
                <p className="text-graphite/60 flex items-center gap-1.5 px-2.5 pb-2 text-[9px] font-bold tracking-[0.06em] uppercase">
                  <ShieldCheck aria-hidden="true" className="size-3" />
                  EXIF/GPS წაშლილია
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
