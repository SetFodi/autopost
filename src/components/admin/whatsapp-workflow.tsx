'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import {
  Check,
  Clipboard,
  ExternalLink,
  Link2,
  MessageCircle,
  Phone,
  RotateCcw,
  Save,
  TriangleAlert,
} from 'lucide-react'

import { saveDeliveryUrlAction } from '@/app/admin/actions'
import { PendingButton } from '@/components/admin/pending-button'
import {
  buildDeliveryMessage,
  buildWhatsAppUrl,
  isNormalizedGeorgianMobile,
  isValidDeliveryUrl,
} from '@/lib/admin/whatsapp'
import type { AdminActionState } from '@/lib/admin/types'

const INITIAL_STATE: AdminActionState = { kind: 'idle', message: '' }

type WhatsAppWorkflowProps = {
  submissionId: string
  phone: string
  vehicleModel: string
  initialDeliveryUrl: string
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const element = document.createElement('textarea')
  element.value = value
  element.style.position = 'fixed'
  element.style.opacity = '0'
  document.body.appendChild(element)
  element.select()
  const copied = document.execCommand('copy')
  element.remove()
  if (!copied) throw new Error('Clipboard unavailable')
}

export function WhatsAppWorkflow({
  submissionId,
  phone,
  vehicleModel,
  initialDeliveryUrl,
}: WhatsAppWorkflowProps) {
  const [deliveryUrl, setDeliveryUrl] = useState(initialDeliveryUrl)
  const [savedDeliveryUrl, setSavedDeliveryUrl] = useState(
    initialDeliveryUrl.trim(),
  )
  const [message, setMessage] = useState(() =>
    buildDeliveryMessage(vehicleModel, initialDeliveryUrl),
  )
  const [feedback, setFeedback] = useState('')
  const [saveState, saveAction] = useActionState(
    saveDeliveryUrlAction,
    INITIAL_STATE,
  )
  const pendingSaveUrlRef = useRef(initialDeliveryUrl.trim())
  const phoneIsValid = isNormalizedGeorgianMobile(phone)
  const deliveryUrlIsValid = isValidDeliveryUrl(deliveryUrl)
  const deliveryUrlIsSaved = deliveryUrl.trim() === savedDeliveryUrl
  const whatsAppUrl = buildWhatsAppUrl(phone, message)
  const finalMessageIsReady =
    deliveryUrlIsValid && deliveryUrlIsSaved && Boolean(message.trim())
  const canOpenWhatsApp = Boolean(whatsAppUrl && finalMessageIsReady)

  useEffect(() => {
    if (saveState.kind === 'success') {
      setSavedDeliveryUrl(pendingSaveUrlRef.current)
    }
  }, [saveState])

  function handleDeliveryUrlChange(nextValue: string) {
    const previousLink = deliveryUrl.trim() || '[Drive link]'
    const nextLink = nextValue.trim() || '[Drive link]'

    setDeliveryUrl(nextValue)
    setMessage((current) =>
      current.includes(previousLink)
        ? current.replace(previousLink, nextLink)
        : current,
    )
  }

  async function handleCopy(value: string, successMessage: string) {
    try {
      await copyToClipboard(value)
      setFeedback(successMessage)
    } catch {
      setFeedback('კოპირება ვერ მოხერხდა — მონიშნეთ ტექსტი ხელით.')
    }
  }

  return (
    <div className="space-y-5">
      <form
        action={saveAction}
        className="space-y-2"
        onSubmit={() => {
          pendingSaveUrlRef.current = deliveryUrl.trim()
        }}
      >
        <input type="hidden" name="id" value={submissionId} />
        <label
          htmlFor="delivery-url"
          className="text-sm font-bold text-stone-200"
        >
          Drive / Preview ბმული
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-stone-500"
            />
            <input
              id="delivery-url"
              name="deliveryUrl"
              type="url"
              maxLength={2_000}
              value={deliveryUrl}
              onChange={(event) => handleDeliveryUrlChange(event.target.value)}
              placeholder="https://drive.google.com/..."
              className="min-h-12 w-full rounded-xl border border-white/10 bg-black/20 pr-4 pl-11 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-[#25D366]/50 focus:ring-4 focus:ring-[#25D366]/10"
            />
          </div>
          <PendingButton
            pendingLabel="ინახება…"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-stone-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#25D366]"
          >
            <Save aria-hidden="true" className="size-4" />
            ბმულის შენახვა
          </PendingButton>
        </div>
        <div aria-live="polite" className="min-h-5">
          {saveState.message ? (
            <p
              className={`text-xs ${saveState.kind === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}
            >
              {saveState.message}
            </p>
          ) : null}
        </div>
      </form>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="delivery-message"
            className="text-sm font-bold text-stone-200"
          >
            გასაგზავნი ტექსტი
          </label>
          <button
            type="button"
            onClick={() =>
              setMessage(buildDeliveryMessage(vehicleModel, deliveryUrl))
            }
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-stone-500 transition hover:bg-white/5 hover:text-stone-300 focus-visible:outline-2 focus-visible:outline-orange-400"
          >
            <RotateCcw aria-hidden="true" className="size-3.5" />
            შაბლონის აღდგენა
          </button>
        </div>
        <textarea
          id="delivery-message"
          rows={8}
          maxLength={4_000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full resize-y rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm leading-7 text-stone-200 outline-none focus:border-[#25D366]/50 focus:ring-4 focus:ring-[#25D366]/10"
        />
        <p className="text-xs text-stone-600">
          ტექსტი შეგიძლიათ შეცვალოთ. ბმულის ცვლილება არსებულ შაბლონშიც
          განახლდება.
        </p>
      </div>

      {!phoneIsValid ? (
        <div className="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/8 p-3 text-sm text-amber-100">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          ნომერი არ არის შენახული ნორმალიზებულ ქართულ ფორმატში. WhatsApp-ის
          გახსნა გამორთულია.
        </div>
      ) : !deliveryUrlIsValid ? (
        <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm text-stone-400">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-orange-400"
          />
          WhatsApp-ის გახსნამდე ჩასვით და შეინახეთ მიწოდების ბმული.
        </div>
      ) : !deliveryUrlIsSaved ? (
        <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm text-stone-400">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-orange-400"
          />
          ბმული შეცვლილია — WhatsApp-ის გახსნამდე შეინახეთ.
        </div>
      ) : !message.trim() ? (
        <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm text-stone-400">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-orange-400"
          />
          გასაგზავნი ტექსტი ცარიელია. აღადგინეთ შაბლონი ან ჩაწერეთ მესიჯი.
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => void handleCopy(phone, 'ნომერი დაკოპირდა.')}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-stone-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-orange-400"
        >
          <Phone aria-hidden="true" className="size-4" />
          ნომრის კოპირება
        </button>
        <button
          type="button"
          disabled={!finalMessageIsReady}
          onClick={() => void handleCopy(message, 'მესიჯი დაკოპირდა.')}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-stone-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-orange-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/5"
        >
          <Clipboard aria-hidden="true" className="size-4" />
          მესიჯის კოპირება
        </button>
        {canOpenWhatsApp && whatsAppUrl ? (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-black text-[#071d0f] transition hover:bg-[#32e576] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            WhatsApp-ის გახსნა
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#25D366]/20 px-4 text-sm font-black text-[#71a985]"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            WhatsApp-ის გახსნა
          </span>
        )}
      </div>

      <div aria-live="polite" aria-atomic="true" className="min-h-5">
        {feedback ? (
          <p className="inline-flex items-center gap-2 text-xs text-stone-400">
            {feedback.includes('დაკოპირდა') ? (
              <Check aria-hidden="true" className="size-3.5 text-emerald-300" />
            ) : null}
            {feedback}
          </p>
        ) : null}
      </div>
    </div>
  )
}
