'use client'

import { Check, Clock3, Copy, MessageCircle, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { TrackedWhatsappLink } from '@/components/landing/tracked-whatsapp-link'

interface SubmissionSuccessProps {
  publicReference: string
  vehicleModel: string
  photoCount: number
  whatsappNumber?: string
}

function supportUrl(phone: string, reference: string) {
  const normalized = phone.replace(/\D/g, '')
  if (!normalized) return null
  const message = encodeURIComponent(
    `გამარჯობა! AutoPost-ის განაცხადთან დაკავშირებით მაქვს კითხვა. კოდი: ${reference}`,
  )
  return `https://wa.me/${normalized}?text=${message}`
}

export function SubmissionSuccess({
  publicReference,
  vehicleModel,
  photoCount,
  whatsappNumber,
}: SubmissionSuccessProps) {
  const [copied, setCopied] = useState(false)
  const resetTimerRef = useRef<number | null>(null)
  const whatsappUrl = whatsappNumber
    ? supportUrl(whatsappNumber, publicReference)
    : null

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(publicReference)
      setCopied(true)
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
      resetTimerRef.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="success-panel" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <span className="bg-amber text-graphite grid size-14 place-items-center rounded-full">
          <Check aria-hidden="true" className="size-7" strokeWidth={3} />
        </span>
        <span className="text-ivory/55 rounded-full border border-white/12 px-3 py-1.5 font-mono text-[10px] tracking-[0.13em]">
          SUBMISSION RECEIVED
        </span>
      </div>

      <h2 className="font-display text-ivory mt-9 text-4xl leading-[1.05] font-bold tracking-[-0.055em] sm:text-5xl">
        ფოტოები წარმატებით მივიღეთ
      </h2>
      <p className="text-ivory/64 mt-5 max-w-xl text-base leading-8">
        თქვენი ავტომობილის Preview მზად იქნება მაქსიმუმ 24 საათში და
        გამოგიგზავნით მითითებულ WhatsApp ნომერზე.
      </p>

      <dl className="mt-9 divide-y divide-white/10 border-y border-white/10">
        <div className="flex items-center justify-between gap-5 py-4">
          <dt className="text-ivory/55 text-xs">განაცხადის კოდი</dt>
          <dd className="text-amber flex min-w-0 items-center gap-2 font-mono text-sm font-bold">
            <span className="truncate">{publicReference}</span>
            <button
              type="button"
              onClick={copyReference}
              className="text-ivory/65 hover:border-amber/45 hover:text-amber grid size-11 shrink-0 place-items-center rounded-full border border-white/12"
              aria-label="განაცხადის კოდის კოპირება"
            >
              {copied ? (
                <Check aria-hidden="true" className="size-3.5" />
              ) : (
                <Copy aria-hidden="true" className="size-3.5" />
              )}
            </button>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-5 py-4">
          <dt className="text-ivory/55 text-xs">ავტომობილი</dt>
          <dd className="text-ivory max-w-[64%] text-right text-sm font-semibold">
            {vehicleModel}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-5 py-4">
          <dt className="text-ivory/55 text-xs">მიღებული ფოტოები</dt>
          <dd className="text-ivory text-sm font-semibold">{photoCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-5 py-4">
          <dt className="text-ivory/55 inline-flex items-center gap-2 text-xs">
            <Clock3 aria-hidden="true" className="size-3.5" /> მიწოდება
          </dt>
          <dd className="text-ivory text-sm font-semibold">
            მაქსიმუმ 24 საათში
          </dd>
        </div>
      </dl>

      <div className="text-ivory/55 mt-7 flex items-start gap-3 border border-white/10 bg-white/[0.035] p-4 text-xs leading-6">
        <ShieldCheck
          aria-hidden="true"
          className="text-amber mt-0.5 size-5 shrink-0"
        />
        ფოტოებს მხოლოდ თქვენი Preview-ს მოსამზადებლად გამოვიყენებთ და თანხმობის
        გარეშე საჯაროდ არ გამოვაქვეყნებთ.
      </div>

      {whatsappUrl ? (
        <TrackedWhatsappLink
          href={whatsappUrl}
          source="success_support"
          className="bg-amber text-graphite mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 text-sm font-extrabold transition-colors hover:bg-[#e1ff75]"
        >
          <MessageCircle aria-hidden="true" className="size-5" /> WhatsApp
          მხარდაჭერა
        </TrackedWhatsappLink>
      ) : null}
    </div>
  )
}
