'use client'

import {
  Check,
  Download,
  Film,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  GeneratedAssetKind,
  ResultAsset,
  ResultSnapshot,
} from '@/lib/fulfillment/types'

const KIND_LABELS: Record<GeneratedAssetKind, string> = {
  carousel_1: 'Carousel · 1',
  carousel_2: 'Carousel · 2',
  carousel_3: 'Carousel · 3',
  carousel_4: 'Carousel · 4',
  carousel_5: 'Carousel · 5',
  carousel_6: 'Carousel · 6',
  copy: 'ტექსტი · KA / EN / RU',
  package: 'სრული ZIP პაკეტი',
  reel: 'Reel · 9:16',
  square: 'Feed · 1:1',
  story_1: 'Story · 1',
  story_2: 'Story · 2',
  story_3: 'Story · 3',
}

function isGenerating(status: ResultSnapshot['status']) {
  return ['queued', 'generating_preview', 'generating_paid'].includes(status)
}

function AssetCard({ asset }: { asset: ResultAsset }) {
  const image = asset.mimeType.startsWith('image/')
  const video = asset.mimeType === 'video/mp4'
  const story = asset.kind.startsWith('story_')
  return (
    <article className="overflow-hidden border border-white/12 bg-white/[0.035]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.url}
          alt={KIND_LABELS[asset.kind]}
          className={
            story
              ? 'aspect-[9/16] max-h-[640px] w-full bg-black/30 object-contain'
              : 'aspect-square w-full bg-black/30 object-cover'
          }
        />
      ) : video ? (
        <video
          src={asset.url}
          controls
          playsInline
          preload="metadata"
          className="aspect-[9/16] max-h-[640px] w-full bg-black object-contain"
        />
      ) : (
        <div className="grid aspect-[16/8] place-items-center bg-black/30">
          <Download className="text-amber size-9" aria-hidden="true" />
        </div>
      )}
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="text-ivory text-sm font-bold">
            {KIND_LABELS[asset.kind]}
          </p>
          <p className="text-ivory/40 mt-1 truncate font-mono text-[10px]">
            {asset.filename}
          </p>
        </div>
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="text-amber hover:bg-amber hover:text-graphite grid size-11 shrink-0 place-items-center border border-current transition-colors"
          aria-label={`${KIND_LABELS[asset.kind]} გახსნა`}
        >
          <Download className="size-4" aria-hidden="true" />
        </a>
      </div>
    </article>
  )
}

export function ResultExperience({
  initialSnapshot,
  token,
  paymentReturn,
}: {
  initialSnapshot: ResultSnapshot
  token: string
  paymentReturn: boolean
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/results/${encodeURIComponent(token)}`, {
      cache: 'no-store',
    })
    if (!response.ok) return
    const next = (await response.json()) as ResultSnapshot
    if (mountedRef.current) setSnapshot(next)
  }, [token])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!paymentReturn) return
    let cancelled = false
    void (async () => {
      const response = await fetch(
        `/api/results/${encodeURIComponent(token)}/payment-status`,
        { method: 'POST' },
      )
      if (!cancelled) {
        setMessage(
          response.ok
            ? 'გადახდის სტატუსი განახლდა.'
            : 'გადახდა მოწმდება — გვერდი ავტომატურად განახლდება.',
        )
        await refresh()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [paymentReturn, refresh, token])

  useEffect(() => {
    if (!isGenerating(snapshot.status)) return
    const interval = window.setInterval(() => void refresh(), 3_000)
    return () => window.clearInterval(interval)
  }, [refresh, snapshot.status])

  async function startCheckout() {
    if (checkoutBusy) return
    setCheckoutBusy(true)
    setMessage(null)
    try {
      const response = await fetch(
        `/api/results/${encodeURIComponent(token)}/checkout`,
        { method: 'POST' },
      )
      const payload = (await response.json()) as {
        checkoutUrl?: string
        error?: string
        paid?: boolean
      }
      if (!response.ok) throw new Error(payload.error || 'გადახდა ვერ დაიწყო.')
      if (payload.paid) {
        await refresh()
        return
      }
      if (!payload.checkoutUrl) throw new Error('გადახდის ბმული ვერ მოიძებნა.')
      window.location.assign(payload.checkoutUrl)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'გადახდა დროებით ვერ დაიწყო.',
      )
      setCheckoutBusy(false)
    }
  }

  const requiredPreviewKinds: GeneratedAssetKind[] = [
    'square',
    'story_1',
    'story_2',
    'story_3',
    'carousel_1',
    'carousel_2',
    'carousel_3',
    'carousel_4',
    'carousel_5',
    'carousel_6',
    'copy',
    'reel',
  ]
  const previewReady = requiredPreviewKinds.every((kind) =>
    snapshot.previewAssets.some((asset) => asset.kind === kind),
  )
  const packageReady =
    snapshot.status === 'ready' && snapshot.paidAssets.length > 0

  return (
    <main className="grain relative min-h-screen overflow-hidden bg-[#0c0b0a] text-[#f4eee4]">
      <div className="pointer-events-none absolute -top-40 left-[14%] size-[32rem] rounded-full bg-[#e8a03a]/10 blur-[140px]" />
      <header className="border-b border-white/10">
        <div className="site-container flex min-h-20 items-center justify-between gap-5">
          <Link href="/" className="group flex items-center gap-3">
            <span className="brand-mark">AP</span>
            <span className="text-lg font-extrabold tracking-[-0.04em]">
              AutoPost
            </span>
          </Link>
          <span className="text-ivory/45 border border-white/10 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em]">
            PRIVATE RESULT
          </span>
        </div>
      </header>

      <div className="site-container relative z-10 py-12 sm:py-16">
        <section className="grid items-end gap-9 border-b border-white/10 pb-12 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-amber font-mono text-[11px] tracking-[0.19em] uppercase">
              {snapshot.publicReference}
            </p>
            <h1 className="font-display mt-4 max-w-4xl text-[clamp(2.6rem,7vw,6.8rem)] leading-[0.94] font-black tracking-[-0.065em]">
              {snapshot.vehicleModel}
            </h1>
            <p className="text-ivory/48 mt-5 text-sm">
              {snapshot.vehicleYear} · ავტომატურად მომზადებული სოციალური პაკეტი
            </p>
          </div>
          <div className="flex items-center gap-3 border border-white/12 bg-white/[0.04] px-5 py-4">
            {isGenerating(snapshot.status) ? (
              <LoaderCircle
                className="text-amber size-5 animate-spin"
                aria-hidden="true"
              />
            ) : snapshot.status === 'failed' ? (
              <RefreshCw className="size-5 text-rose-300" aria-hidden="true" />
            ) : (
              <Check className="text-amber size-5" aria-hidden="true" />
            )}
            <div>
              <p className="text-sm font-bold">
                {snapshot.status === 'ready'
                  ? 'სრული პაკეტი მზადაა'
                  : snapshot.status === 'preview_ready'
                    ? 'Preview მზადაა'
                    : snapshot.status === 'failed'
                      ? 'დამუშავებას ხელახლა ვცდით'
                      : 'AutoPost ამზადებს მასალებს'}
              </p>
              <p className="text-ivory/40 mt-1 text-xs">
                გვერდი ავტომატურად განახლდება
              </p>
            </div>
          </div>
        </section>

        {message ? (
          <p className="mt-6 border border-[#e8a03a]/25 bg-[#e8a03a]/8 px-4 py-3 text-sm text-[#ffd492]">
            {message}
          </p>
        ) : null}

        <section className="py-12">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="section-kicker">Free preview</p>
              <h2 className="font-display text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                შენი მასალები
              </h2>
            </div>
            <p className="text-ivory/45 max-w-md text-sm leading-7">
              Preview ფაილები დაცულია watermark-ით. შეაფასე დიზაინი და გადაიხადე
              მხოლოდ თუ მოგწონს.
            </p>
          </div>

          {snapshot.previewAssets.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.previewAssets.map((asset) => (
                <AssetCard key={`${asset.kind}-${asset.url}`} asset={asset} />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid min-h-72 place-items-center border border-dashed border-white/14 bg-white/[0.025] p-8 text-center">
              <div>
                <Sparkles
                  className="text-amber mx-auto size-8"
                  aria-hidden="true"
                />
                <p className="mt-5 text-lg font-bold">Preview მზადდება</p>
                <p className="text-ivory/45 mt-2 text-sm leading-7">
                  ფოტოებს ვამუშავებთ, ვაწყობთ ფორმატებს და ვამზადებთ Reel-ს.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-0 border border-white/12 bg-[#151311] lg:grid-cols-[1.08fr_.92fr]">
          <div className="p-7 sm:p-10">
            <p className="text-amber font-mono text-[11px] tracking-[0.18em] uppercase">
              Publish-ready package
            </p>
            <h2 className="font-display mt-5 text-4xl font-black tracking-[-0.055em] sm:text-6xl">
              Watermark-ის გარეშე
            </h2>
            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
              {[
                [ImageIcon, 'Feed + 3× Story'],
                [Film, '9:16 Reel'],
                [ImageIcon, '6× Carousel'],
                [Download, 'KA / EN / RU copy'],
              ].map(([Icon, label]) => {
                const ItemIcon = Icon as typeof ImageIcon
                return (
                  <div
                    key={label as string}
                    className="flex items-center gap-3 border-t border-white/10 py-3"
                  >
                    <ItemIcon
                      className="text-amber size-4"
                      aria-hidden="true"
                    />
                    <span>{label as string}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="border-t border-white/10 bg-black/25 p-7 sm:p-10 lg:border-t-0 lg:border-l">
            {snapshot.paid ? (
              <>
                <div className="flex items-center gap-3 text-emerald-300">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                  <span className="text-sm font-bold">
                    გადახდა დადასტურებულია
                  </span>
                </div>
                <p className="mt-7 text-5xl font-black tracking-[-0.055em]">
                  {packageReady ? 'მზადაა' : 'მზადდება'}
                </p>
                {packageReady ? (
                  <div className="mt-7 space-y-3">
                    {snapshot.paidAssets.map((asset) => (
                      <a
                        key={asset.kind}
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:border-amber/50 flex min-h-12 items-center justify-between gap-4 border border-white/12 px-4 text-sm font-bold transition-colors"
                      >
                        {KIND_LABELS[asset.kind]}
                        <Download
                          className="text-amber size-4"
                          aria-hidden="true"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-ivory/50 mt-7 flex items-center gap-3 text-sm">
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    სუფთა ფაილები ავტომატურად იქმნება
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <span className="font-mono text-6xl font-semibold tracking-[-0.07em]">
                    14.90
                  </span>
                  <span className="text-amber mb-2 text-xl font-bold">₾</span>
                </div>
                <p className="text-ivory/45 mt-4 text-sm leading-7">
                  ერთჯერადი გადახდა. დადასტურების შემდეგ სუფთა ფაილები ამავე
                  გვერდზე ავტომატურად გაიხსნება.
                </p>
                <button
                  type="button"
                  onClick={() => void startCheckout()}
                  disabled={
                    checkoutBusy || !previewReady || !snapshot.checkoutAvailable
                  }
                  className="bg-amber text-graphite mt-7 flex min-h-14 w-full items-center justify-center gap-2 px-5 text-sm font-black transition hover:bg-[#ffbe5c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {checkoutBusy ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <LockKeyhole className="size-4" aria-hidden="true" />
                  )}
                  {!snapshot.checkoutAvailable
                    ? 'გადახდა მალე გააქტიურდება'
                    : previewReady
                      ? 'გადახდა და სრული პაკეტის მიღება'
                      : 'ჯერ დაელოდე Preview-ს'}
                </button>
                <p className="text-ivory/30 mt-4 text-center text-[11px]">
                  უსაფრთხო გადახდა TBC Checkout-ით
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
