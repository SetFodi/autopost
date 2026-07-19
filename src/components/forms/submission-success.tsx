'use client'

import {
  ArrowRight,
  Check,
  Copy,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { TrackedWhatsappLink } from '@/components/landing/tracked-whatsapp-link'
import type { AppLocale } from '@/lib/i18n'

interface SubmissionSuccessProps {
  publicReference: string
  vehicleModel: string
  photoCount: number
  resultUrl: string
  whatsappNumber?: string
  locale?: AppLocale
}

function supportUrl(phone: string, reference: string, locale: AppLocale) {
  const normalized = phone.replace(/\D/g, '')
  if (!normalized) return null
  const message = encodeURIComponent(
    locale === 'en'
      ? `Hello! I have a question about my AutoPost request. Reference: ${reference}`
      : `გამარჯობა! AutoPost-ის განაცხადთან დაკავშირებით მაქვს კითხვა. კოდი: ${reference}`,
  )
  return `https://wa.me/${normalized}?text=${message}`
}

export function SubmissionSuccess({
  publicReference,
  vehicleModel,
  photoCount,
  resultUrl,
  whatsappNumber,
  locale = 'ka',
}: SubmissionSuccessProps) {
  const english = locale === 'en'
  const [copied, setCopied] = useState(false)
  const resetTimerRef = useRef<number | null>(null)
  const whatsappUrl = whatsappNumber
    ? supportUrl(whatsappNumber, publicReference, locale)
    : null
  const localizedResultUrl =
    locale === 'en'
      ? `${resultUrl}${resultUrl.includes('?') ? '&' : '?'}lang=en`
      : resultUrl

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
          {english ? 'SUBMISSION RECEIVED' : 'განაცხადი მიღებულია'}
        </span>
      </div>

      <h2 className="font-display text-ivory mt-9 text-4xl leading-[1.05] font-bold tracking-[-0.055em] sm:text-5xl">
        {english
          ? 'AutoPost is preparing your preview'
          : 'AutoPost უკვე ამზადებს Preview-ს'}
      </h2>
      <p className="text-ivory/64 mt-5 max-w-xl text-base leading-8">
        {english
          ? 'Your private results page is ready and processing started automatically. Open it now—your preview will appear there as soon as it is ready.'
          : 'გვერდი შექმნილია და დამუშავება ავტომატურად დაიწყო. გახსენი პირადი შედეგის გვერდი — Preview იქვე გამოჩნდება მზადებისთანავე.'}
      </p>

      <dl className="mt-9 divide-y divide-white/10 border-y border-white/10">
        <div className="flex items-center justify-between gap-5 py-4">
          <dt className="text-ivory/55 text-xs">
            {english ? 'Reference' : 'განაცხადის კოდი'}
          </dt>
          <dd className="text-amber flex min-w-0 items-center gap-2 font-mono text-sm font-bold">
            <span className="truncate">{publicReference}</span>
            <button
              type="button"
              onClick={copyReference}
              className="text-ivory/65 hover:border-amber/45 hover:text-amber grid size-11 shrink-0 place-items-center rounded-full border border-white/12"
              aria-label={
                english
                  ? 'Copy submission reference'
                  : 'განაცხადის კოდის კოპირება'
              }
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
          <dt className="text-ivory/55 text-xs">
            {english ? 'Vehicle' : 'ავტომობილი'}
          </dt>
          <dd className="text-ivory max-w-[64%] text-right text-sm font-semibold">
            {vehicleModel}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-5 py-4">
          <dt className="text-ivory/55 text-xs">
            {english ? 'Photos received' : 'მიღებული ფოტოები'}
          </dt>
          <dd className="text-ivory text-sm font-semibold">{photoCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-5 py-4">
          <dt className="text-ivory/55 inline-flex items-center gap-2 text-xs">
            <LoaderCircle
              aria-hidden="true"
              className="size-3.5 animate-spin"
            />{' '}
            {english ? 'Status' : 'სტატუსი'}
          </dt>
          <dd className="text-ivory text-sm font-semibold">
            {english ? 'Automatic processing' : 'ავტომატური დამუშავება'}
          </dd>
        </div>
      </dl>

      <div className="text-ivory/55 mt-7 flex items-start gap-3 border border-white/10 bg-white/[0.035] p-4 text-xs leading-6">
        <ShieldCheck
          aria-hidden="true"
          className="text-amber mt-0.5 size-5 shrink-0"
        />
        {english
          ? 'We only use your photos to prepare your preview and never publish them without your consent.'
          : 'ფოტოებს მხოლოდ თქვენი Preview-ს მოსამზადებლად გამოვიყენებთ და თანხმობის გარეშე საჯაროდ არ გამოვაქვეყნებთ.'}
      </div>

      <a
        href={localizedResultUrl}
        className="bg-amber text-graphite mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 px-5 text-sm font-extrabold transition-colors hover:bg-[#e1ff75]"
      >
        {english ? 'Open private results' : 'პირადი შედეგის გახსნა'}
        <ArrowRight aria-hidden="true" className="size-5" />
      </a>

      {whatsappUrl ? (
        <TrackedWhatsappLink
          href={whatsappUrl}
          source="success_support"
          className="text-ivory/70 mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 border border-white/12 px-5 text-sm font-bold transition-colors hover:border-white/25 hover:text-white"
        >
          <MessageCircle aria-hidden="true" className="size-5" /> WhatsApp{' '}
          {english ? 'support' : 'მხარდაჭერა'}
        </TrackedWhatsappLink>
      ) : null}
    </div>
  )
}
