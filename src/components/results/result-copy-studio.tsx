'use client'

import { Check, Clipboard, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { parseResultCopy } from '@/lib/fulfillment/result-copy'

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
  if (!copied) throw new Error('clipboard_unavailable')
}

export function ResultCopyStudio({ copyText }: { copyText: string | null }) {
  const languages = useMemo(() => parseResultCopy(copyText ?? ''), [copyText])
  const [activeId, setActiveId] = useState<string>('ka')
  const [feedback, setFeedback] = useState('')
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeLanguage =
    languages.find((language) => language.id === activeId) ?? languages[0]

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    },
    [],
  )

  async function handleCopy(value: string) {
    try {
      await copyToClipboard(value)
      setFeedback('ტექსტი დაკოპირდა')
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
      feedbackTimerRef.current = setTimeout(() => setFeedback(''), 1_800)
    } catch {
      setFeedback('კოპირება ვერ მოხერხდა')
    }
  }

  return (
    <div className="grid gap-0 lg:grid-cols-[13rem_1fr]">
      <div className="border-b border-white/10 bg-black/20 p-4 lg:border-r lg:border-b-0 lg:p-5">
        <p className="text-ivory/35 font-mono text-[9px] tracking-[0.15em] uppercase">
          აირჩიე ენა
        </p>
        <div className="mt-3 flex gap-2 lg:flex-col">
          {languages.length > 0
            ? languages.map((language) => (
                <button
                  key={language.id}
                  type="button"
                  onClick={() => setActiveId(language.id)}
                  className={`flex min-h-11 flex-1 items-center justify-between gap-3 border px-3 text-left text-xs font-bold transition lg:flex-none ${
                    activeLanguage?.id === language.id
                      ? 'border-amber/50 bg-amber/10 text-amber'
                      : 'text-ivory/50 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span>{language.label}</span>
                  <span className="font-mono text-[9px] opacity-55">
                    {language.shortLabel}
                  </span>
                </button>
              ))
            : ['KA', 'EN', 'RU'].map((label) => (
                <span
                  key={label}
                  className="text-ivory/25 flex min-h-11 flex-1 items-center border border-white/8 px-3 font-mono text-[9px] lg:flex-none"
                >
                  {label}
                </span>
              ))}
        </div>
      </div>

      <div className="min-w-0 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-amber font-mono text-[9px] tracking-[0.16em] uppercase">
              Ready to paste
            </p>
            <p className="mt-1 text-sm font-bold">
              {activeLanguage?.label ?? 'Caption მზადდება'}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              activeLanguage ? void handleCopy(activeLanguage.text) : undefined
            }
            disabled={!activeLanguage}
            className="text-amber hover:bg-amber hover:text-graphite inline-flex min-h-11 shrink-0 items-center gap-2 border border-current px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="ტექსტის კოპირება"
          >
            {feedback === 'ტექსტი დაკოპირდა' ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Clipboard className="size-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {feedback === 'ტექსტი დაკოპირდა' ? 'დაკოპირდა' : 'კოპირება'}
            </span>
          </button>
        </div>

        <div className="mt-4 min-h-64 border border-white/10 bg-[#090807] p-4 sm:p-5">
          {activeLanguage ? (
            <pre className="text-ivory/75 font-sans text-sm leading-7 whitespace-pre-wrap">
              {activeLanguage.text}
            </pre>
          ) : (
            <div className="text-ivory/35 flex min-h-52 items-center justify-center gap-3 text-sm">
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
              გაყიდვის ტექსტი მზადდება
            </div>
          )}
        </div>
        <p aria-live="polite" className="text-ivory/35 mt-3 min-h-4 text-xs">
          {feedback || 'ღილაკი აკოპირებს მხოლოდ არჩეულ ენას.'}
        </p>
      </div>
    </div>
  )
}
