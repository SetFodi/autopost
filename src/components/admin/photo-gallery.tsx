/* Private, expiring Supabase URLs are intentionally rendered without Next's image proxy. */
/* eslint-disable @next/next/no-img-element */

import { ExternalLink, ImageOff } from 'lucide-react'

import { formatFileSize } from '@/lib/admin/format'
import type { AdminSubmissionPhoto } from '@/lib/admin/types'

export function PhotoGallery({ photos }: { photos: AdminSubmissionPhoto[] }) {
  if (photos.length === 0) {
    return (
      <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 text-center">
        <div>
          <ImageOff
            aria-hidden="true"
            className="mx-auto size-6 text-stone-600"
          />
          <p className="mt-3 text-sm font-semibold text-stone-400">
            ფოტოები ვერ მოიძებნა
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {photos.map((photo, index) => (
        <figure
          key={photo.id}
          className="group overflow-hidden rounded-2xl border border-white/10 bg-black/20"
        >
          {photo.signed_url ? (
            <a
              href={photo.signed_url}
              target="_blank"
              rel="noreferrer"
              className="relative block aspect-[4/3] overflow-hidden bg-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
              aria-label={`ფოტო ${index + 1}-ის სრულ ზომაში გახსნა`}
            >
              <img
                src={photo.signed_url}
                alt={`${index + 1}. ${photo.original_filename}`}
                loading={index < 4 ? 'eager' : 'lazy'}
                decoding="async"
                className="size-full object-contain transition duration-300 group-hover:scale-[1.015]"
              />
              <span className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg border border-white/15 bg-black/65 text-white opacity-0 backdrop-blur-sm transition group-focus-within:opacity-100 group-hover:opacity-100">
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </span>
            </a>
          ) : (
            <div className="grid aspect-[4/3] place-items-center bg-stone-900">
              <ImageOff aria-hidden="true" className="size-5 text-stone-600" />
            </div>
          )}
          <figcaption className="p-3">
            <p className="truncate text-xs font-semibold text-stone-300">
              {index + 1}. {photo.original_filename}
            </p>
            <p className="mt-1 text-[11px] text-stone-600">
              {photo.mime_type} · {formatFileSize(photo.file_size)}
            </p>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
