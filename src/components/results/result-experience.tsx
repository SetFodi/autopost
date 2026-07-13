'use client'

import {
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Download,
  Film,
  Images,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Square,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ResultAssetCard } from '@/components/results/result-asset-card'
import { ResultAssetDialog } from '@/components/results/result-asset-dialog'
import { ResultCopyStudio } from '@/components/results/result-copy-studio'
import { ResultEmptyOutput } from '@/components/results/result-empty-output'
import { ResultImagePreview } from '@/components/results/result-image-preview'
import { ResultSectionHeading } from '@/components/results/result-section-heading'
import { REQUIRED_PREVIEW_KINDS } from '@/lib/fulfillment/result-assets'
import type { ResultAsset, ResultSnapshot } from '@/lib/fulfillment/types'

function isGenerating(status: ResultSnapshot['status']) {
  return ['queued', 'generating_preview', 'generating_paid'].includes(status)
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
  const [activeAsset, setActiveAsset] = useState<ResultAsset | null>(null)
  const [activeAssetGroup, setActiveAssetGroup] = useState<ResultAsset[]>([])
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

  function openAsset(asset: ResultAsset, group: ResultAsset[]) {
    setActiveAssetGroup(group)
    setActiveAsset(asset)
  }

  const paidVisuals = snapshot.paidAssets.filter(
    (asset) => asset.kind !== 'copy' && asset.kind !== 'package',
  )
  const usePaidAssets = snapshot.status === 'ready' && paidVisuals.length > 0
  const visibleAssets = usePaidAssets
    ? snapshot.paidAssets
    : snapshot.previewAssets
  const visualAssets = visibleAssets.filter(
    (asset) => asset.kind !== 'copy' && asset.kind !== 'package',
  )
  const reel = visibleAssets.find((asset) => asset.kind === 'reel') ?? null
  const stories = visibleAssets.filter((asset) =>
    asset.kind.startsWith('story_'),
  )
  const carousel = visibleAssets.filter((asset) =>
    asset.kind.startsWith('carousel_'),
  )
  const square = visibleAssets.find((asset) => asset.kind === 'square') ?? null
  const packageAsset = snapshot.paidAssets.find(
    (asset) => asset.kind === 'package',
  )
  const previewReady = REQUIRED_PREVIEW_KINDS.every((kind) =>
    snapshot.previewAssets.some((asset) => asset.kind === kind),
  )
  const readyCount = REQUIRED_PREVIEW_KINDS.filter((kind) =>
    snapshot.previewAssets.some((asset) => asset.kind === kind),
  ).length
  const packageReady = snapshot.status === 'ready' && Boolean(packageAsset)

  return (
    <main className="grain relative min-h-screen overflow-hidden bg-[#0c0b0a] text-[#f4eee4]">
      <div className="pointer-events-none absolute -top-52 left-[9%] size-[36rem] rounded-full bg-[#e8a03a]/10 blur-[150px]" />
      <div className="pointer-events-none absolute top-[42rem] right-[-16rem] size-[34rem] rounded-full bg-[#7f3f12]/10 blur-[160px]" />

      <header className="relative z-30 border-b border-white/10 bg-[#0c0b0a]/88 backdrop-blur-xl">
        <div className="site-container flex min-h-18 items-center justify-between gap-5">
          <Link href="/" className="group flex items-center gap-3">
            <span className="brand-mark">AP</span>
            <span className="text-base font-extrabold tracking-[-0.04em] sm:text-lg">
              AutoPost
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-ivory/40 hidden font-mono text-[9px] tracking-[0.13em] uppercase sm:inline">
              Private content studio
            </span>
            <span className="flex items-center gap-2 border border-white/10 px-3 py-2 font-mono text-[9px] tracking-[0.12em] uppercase">
              <span className="bg-amber size-1.5 rounded-full shadow-[0_0_0_4px_rgb(232_160_58/0.1)]" />
              {usePaidAssets ? 'Clean files' : 'Preview mode'}
            </span>
          </div>
        </div>
      </header>

      <div className="site-container relative z-10 pt-9 pb-20 sm:pt-12">
        <section className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-end">
          <div>
            <p className="text-amber font-mono text-[10px] tracking-[0.2em] uppercase">
              {snapshot.publicReference} · Result desk
            </p>
            <h1 className="font-display mt-5 max-w-4xl text-[clamp(2.7rem,7vw,6rem)] leading-[0.92] font-black tracking-[-0.065em]">
              შენი კონტენტ-
              <span className="text-amber">პაკეტი</span>
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-lg font-bold sm:text-xl">
                {snapshot.vehicleModel}
              </p>
              <span className="text-ivory/20">/</span>
              <p className="text-ivory/45 text-sm">{snapshot.vehicleYear}</p>
              <span className="text-ivory/20">/</span>
              <p className="text-ivory/45 text-sm">
                {visualAssets.length} ვიზუალური მასალა
              </p>
            </div>
          </div>

          <div className="border border-white/12 bg-white/[0.035] p-5">
            <div className="flex items-start gap-3">
              {isGenerating(snapshot.status) ? (
                <LoaderCircle
                  className="text-amber mt-0.5 size-5 animate-spin"
                  aria-hidden="true"
                />
              ) : snapshot.status === 'failed' ? (
                <RefreshCw
                  className="mt-0.5 size-5 text-rose-300"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2
                  className="text-amber mt-0.5 size-5"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {snapshot.status === 'ready'
                    ? 'სრული პაკეტი მზადაა'
                    : snapshot.status === 'preview_ready'
                      ? 'Preview მზადაა'
                      : snapshot.status === 'failed'
                        ? 'დამუშავებას ხელახლა ვცდით'
                        : 'AutoPost ამზადებს მასალებს'}
                </p>
                <p className="text-ivory/35 mt-1 text-xs">
                  გვერდი ავტომატურად განახლდება
                </p>
              </div>
              <span className="text-amber font-mono text-xs">
                {readyCount}/{REQUIRED_PREVIEW_KINDS.length}
              </span>
            </div>
            <div className="mt-5 h-1 overflow-hidden bg-white/8">
              <div
                className="bg-amber h-full transition-[width] duration-500"
                style={{
                  width: `${Math.round((readyCount / REQUIRED_PREVIEW_KINDS.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        </section>

        {message ? (
          <p className="mt-5 border border-[#e8a03a]/25 bg-[#e8a03a]/8 px-4 py-3 text-sm text-[#ffd492]">
            {message}
          </p>
        ) : null}

        <nav
          className="result-scroll sticky top-0 z-20 -mx-4 mt-6 flex gap-2 overflow-x-auto border-y border-white/10 bg-[#0c0b0a]/92 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:px-0"
          aria-label="შედეგების სექციები"
        >
          {[
            ['#video', Film, 'Reel', reel ? '1' : '0'],
            ['#stories', Smartphone, 'Stories', String(stories.length)],
            ['#carousel', Images, 'Carousel', String(carousel.length)],
            ['#post', Square, 'Post', square ? '1' : '0'],
            ['#copy', Clipboard, 'Copy', snapshot.copyText ? '3' : '0'],
          ].map(([href, Icon, label, count]) => {
            const NavIcon = Icon as typeof Film
            return (
              <a
                key={href as string}
                href={href as string}
                className="text-ivory/55 hover:border-amber/35 hover:text-ivory flex min-h-10 shrink-0 items-center gap-2 border border-white/10 px-3 text-xs font-bold transition-colors"
              >
                <NavIcon className="text-amber size-3.5" aria-hidden="true" />
                {label as string}
                <span className="text-ivory/30 font-mono text-[9px]">
                  {count as string}
                </span>
              </a>
            )
          })}
        </nav>

        <div className="mt-8 space-y-6">
          <section
            id="video"
            className="scroll-mt-24 overflow-hidden border border-white/10 bg-white/[0.025]"
          >
            <ResultSectionHeading
              number="01"
              eyebrow="Motion output"
              title="Reel ვიდეო"
              description="9:16 ვიდეო პირდაპირ აქვე ნახე — სრული კადრები, რბილი მოძრაობა და მობილურისთვის მზად ფორმატი."
              count={reel ? '1 VIDEO · 9:16' : 'PROCESSING'}
              icon={Film}
            />
            {reel ? (
              <div className="grid gap-0 lg:grid-cols-[minmax(18rem,27rem)_1fr]">
                <div className="grid place-items-center border-b border-white/10 bg-black/30 p-4 sm:p-6 lg:border-r lg:border-b-0">
                  <video
                    src={reel.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-[9/16] max-h-[42rem] w-auto max-w-full bg-black object-contain shadow-[0_35px_90px_rgb(0_0_0/0.55)]"
                  />
                </div>
                <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                  <div>
                    <p className="text-amber font-mono text-[10px] tracking-[0.18em] uppercase">
                      Video / Social ready
                    </p>
                    <h3 className="font-display mt-4 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                      ნახე მოძრაობაში
                    </h3>
                    <p className="text-ivory/45 mt-4 max-w-xl text-sm leading-7">
                      Play ღილაკით შეაფასე მთელი ვიდეო. დიდ ფანჯარაში გახსნისას
                      შეგიძლია სრულ ეკრანზეც ნახო, ხოლო ჩამოტვირთვა ცალკე
                      ღილაკიდანაა ხელმისაწვდომი.
                    </p>
                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                      {[
                        '1080 × 1920',
                        'Instagram Reel',
                        'Mobile-first',
                        'MP4',
                      ].map((item) => (
                        <div
                          key={item}
                          className="text-ivory/55 border-t border-white/10 py-3 font-mono text-[10px] tracking-[0.1em]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openAsset(reel, [reel])}
                      className="bg-amber text-graphite inline-flex min-h-12 items-center gap-2 px-4 text-xs font-black transition hover:bg-[#ffbe5c]"
                    >
                      <Maximize2 className="size-4" aria-hidden="true" />
                      დიდ ფანჯარაში ნახვა
                    </button>
                    <a
                      href={reel.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ivory/65 hover:border-amber/45 hover:text-ivory inline-flex min-h-12 items-center gap-2 border border-white/12 px-4 text-xs font-bold transition-colors"
                    >
                      <Download
                        className="text-amber size-4"
                        aria-hidden="true"
                      />
                      ვიდეოს ჩამოტვირთვა
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <ResultEmptyOutput label="Reel ვიდეო" />
            )}
          </section>

          <section
            id="stories"
            className="scroll-mt-24 overflow-hidden border border-white/10 bg-white/[0.025]"
          >
            <ResultSectionHeading
              number="02"
              eyebrow="Vertical set"
              title="Instagram Stories"
              description="სამი ვერტიკალური Story ცალკე სერიად — თითოეულზე დაჭერით იხსნება სუფთა, სრული preview."
              count={`${stories.length} / 3 STORIES`}
              icon={Smartphone}
            />
            {stories.length > 0 ? (
              <div className="result-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto p-5 sm:p-7">
                {stories.map((asset, index) => (
                  <ResultAssetCard
                    key={`${asset.kind}-${asset.url}`}
                    asset={asset}
                    index={index}
                    variant="story"
                    onOpen={() => openAsset(asset, stories)}
                  />
                ))}
                <div className="text-ivory/25 hidden min-w-48 flex-1 items-end justify-end p-4 text-right font-mono text-[9px] leading-5 tracking-[0.12em] uppercase lg:flex">
                  Swipe the set
                  <br />
                  or open any frame
                  <ArrowRight
                    className="text-amber ml-3 size-4"
                    aria-hidden="true"
                  />
                </div>
              </div>
            ) : (
              <ResultEmptyOutput label="Stories" />
            )}
          </section>

          <section
            id="carousel"
            className="scroll-mt-24 overflow-hidden border border-white/10 bg-white/[0.025]"
          >
            <ResultSectionHeading
              number="03"
              eyebrow="Swipe gallery"
              title="Carousel პოსტები"
              description="ექვსი თანმიმდევრული 1:1 სლაიდი ერთ ხაზში — გვერდი მოკლე რჩება, სერია კი მარტივად დასათვალიერებელია."
              count={`${carousel.length} / 6 SLIDES`}
              icon={Images}
            />
            {carousel.length > 0 ? (
              <div className="result-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto p-5 sm:p-7">
                {carousel.map((asset, index) => (
                  <ResultAssetCard
                    key={`${asset.kind}-${asset.url}`}
                    asset={asset}
                    index={index}
                    variant="square"
                    onOpen={() => openAsset(asset, carousel)}
                  />
                ))}
              </div>
            ) : (
              <ResultEmptyOutput label="Carousel" />
            )}
          </section>

          <section
            id="post"
            className="scroll-mt-24 overflow-hidden border border-white/10 bg-white/[0.025]"
          >
            <ResultSectionHeading
              number="04"
              eyebrow="Feed output"
              title="Instagram Post"
              description="მთავარი 1:1 განცხადება Feed-ისთვის — ერთი მკაფიო კადრი, ფასი და საკონტაქტო ინფორმაცია."
              count={square ? '1 POST · 1:1' : 'PROCESSING'}
              icon={Square}
            />
            {square ? (
              <div className="grid gap-0 lg:grid-cols-[minmax(18rem,36rem)_1fr]">
                <button
                  type="button"
                  onClick={() => openAsset(square, [square])}
                  className="group relative aspect-square overflow-hidden border-b border-white/10 bg-black/30 lg:border-r lg:border-b-0"
                  aria-label="Instagram Post-ის დიდ ფანჯარაში გახსნა"
                  aria-haspopup="dialog"
                >
                  <ResultImagePreview
                    asset={square}
                    className="transition duration-500 group-hover:scale-[1.015]"
                  />
                  <span className="group-hover:border-amber/50 group-hover:text-amber absolute top-4 right-4 grid size-11 place-items-center border border-white/15 bg-black/55 text-white/70 backdrop-blur transition">
                    <Maximize2 className="size-4" aria-hidden="true" />
                  </span>
                </button>
                <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                  <div>
                    <p className="text-amber font-mono text-[10px] tracking-[0.18em] uppercase">
                      Primary feed creative
                    </p>
                    <h3 className="font-display mt-4 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                      მთავარი გასაყიდი კადრი
                    </h3>
                    <p className="text-ivory/45 mt-4 max-w-xl text-sm leading-7">
                      სრული ფოტო ყოველთვის ჩანს; განსხვავებული პროპორციები რბილი
                      ფონით ივსება და მანქანის მნიშვნელოვანი დეტალები აღარ
                      იჭრება.
                    </p>
                  </div>
                  <a
                    href={square.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-amber text-graphite mt-8 inline-flex min-h-12 w-fit items-center gap-2 px-4 text-xs font-black transition hover:bg-[#ffbe5c]"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Post-ის ჩამოტვირთვა
                  </a>
                </div>
              </div>
            ) : (
              <ResultEmptyOutput label="Instagram Post" />
            )}
          </section>

          <section
            id="copy"
            className="scroll-mt-24 overflow-hidden border border-white/10 bg-white/[0.025]"
          >
            <ResultSectionHeading
              number="05"
              eyebrow="Sales caption"
              title="ტექსტი სამ ენაზე"
              description="არავითარი .txt ფაილის ძებნა — აირჩიე ენა, წაიკითხე და ერთი ღილაკით დააკოპირე."
              count="KA · EN · RU"
              icon={Clipboard}
            />
            <ResultCopyStudio copyText={snapshot.copyText} />
          </section>
        </div>

        <section className="mt-8 overflow-hidden border border-white/12 bg-[#151311]">
          <div className="grid lg:grid-cols-[1fr_24rem]">
            <div className="p-6 sm:p-9 lg:p-11">
              <p className="text-amber font-mono text-[10px] tracking-[0.18em] uppercase">
                Publish-ready package
              </p>
              <h2 className="font-display mt-4 max-w-3xl text-4xl font-black tracking-[-0.055em] sm:text-5xl">
                {snapshot.paid
                  ? 'სუფთა ფაილები შენია'
                  : 'მოგწონს? აიღე სრული პაკეტი'}
              </h2>
              <div className="mt-7 grid gap-3 text-sm sm:grid-cols-2 lg:max-w-3xl">
                {[
                  [Film, '1× Reel ვიდეო'],
                  [Smartphone, '3× Instagram Story'],
                  [Images, '6× Carousel slide'],
                  [Clipboard, 'KA / EN / RU copy'],
                ].map(([Icon, label]) => {
                  const ItemIcon = Icon as typeof Film
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

            <div className="border-t border-white/10 bg-black/25 p-6 sm:p-8 lg:border-t-0 lg:border-l">
              {snapshot.paid ? (
                <>
                  <div className="flex items-center gap-3 text-emerald-300">
                    <ShieldCheck className="size-5" aria-hidden="true" />
                    <span className="text-sm font-bold">
                      გადახდა დადასტურებულია
                    </span>
                  </div>
                  {packageReady && packageAsset ? (
                    <a
                      href={packageAsset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-amber text-graphite mt-7 flex min-h-14 w-full items-center justify-center gap-2 px-5 text-sm font-black transition hover:bg-[#ffbe5c]"
                    >
                      <PackageCheck className="size-4" aria-hidden="true" />
                      სრული ZIP პაკეტის ჩამოტვირთვა
                    </a>
                  ) : (
                    <div className="text-ivory/50 mt-7 flex items-center gap-3 border border-white/10 p-4 text-sm">
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
                    <span className="font-mono text-5xl font-semibold tracking-[-0.07em]">
                      14.90
                    </span>
                    <span className="text-amber mb-1.5 text-xl font-bold">
                      ₾
                    </span>
                  </div>
                  <p className="text-ivory/45 mt-3 text-sm leading-6">
                    ერთჯერადი გადახდა. სუფთა ფაილები ამავე გვერდზე ავტომატურად
                    გაიხსნება.
                  </p>
                  <button
                    type="button"
                    onClick={() => void startCheckout()}
                    disabled={
                      checkoutBusy ||
                      !previewReady ||
                      !snapshot.checkoutAvailable
                    }
                    className="bg-amber text-graphite mt-6 flex min-h-14 w-full items-center justify-center gap-2 px-5 text-sm font-black transition hover:bg-[#ffbe5c] disabled:cursor-not-allowed disabled:opacity-40"
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
                  <p className="text-ivory/25 mt-3 text-center text-[10px]">
                    უსაფრთხო გადახდა TBC Checkout-ით
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <ResultAssetDialog
        activeAsset={activeAsset}
        assets={activeAssetGroup}
        onClose={() => setActiveAsset(null)}
        onSelect={setActiveAsset}
      />
    </main>
  )
}
