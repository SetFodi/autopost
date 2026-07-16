import { ShieldAlert } from 'lucide-react'

export function CampaignMediaUnavailable({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      className={`border-amber/35 bg-amber/[0.055] text-ivory flex min-h-56 items-center justify-center border px-6 py-10 text-center ${className}`}
    >
      <div className="max-w-lg">
        <span className="border-amber/35 text-amber mx-auto grid size-12 place-items-center rounded-full border">
          <ShieldAlert aria-hidden="true" className="size-5" />
        </span>
        <p className="text-amber mt-5 font-mono text-[10px] font-semibold tracking-[0.2em] uppercase">
          Campaign media not configured
        </p>
        <p className="font-display mt-3 text-xl font-bold tracking-[-0.03em] sm:text-2xl">
          რეალური კამპანიის მაგალითი ჯერ არ არის ჩართული
        </p>
        <p className="text-ivory/52 mt-3 text-sm leading-7">
          ეს production ვერსია განზრახ არ აჩვენებს სატესტო ან stock ფოტოებს.
          კამპანიის გაშვებამდე დაამატეთ რეალური ტრანსფორმაცია და გაუშვით{' '}
          <span className="text-ivory font-mono">pnpm campaign:check</span>.
        </p>
      </div>
    </div>
  )
}
