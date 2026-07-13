import type { LucideIcon } from 'lucide-react'

export function ResultSectionHeading({
  count,
  description,
  eyebrow,
  icon: Icon,
  number,
  title,
}: {
  count: string
  description: string
  eyebrow: string
  icon: LucideIcon
  number: string
  title: string
}) {
  return (
    <div className="grid gap-5 border-b border-white/10 p-5 sm:p-7 lg:grid-cols-[auto_1fr_auto] lg:items-end">
      <div className="text-amber/45 font-mono text-xs tracking-[0.18em]">
        {number}
      </div>
      <div>
        <div className="text-amber flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] uppercase">
          <Icon className="size-3.5" aria-hidden="true" />
          {eyebrow}
        </div>
        <h2 className="font-display mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
          {title}
        </h2>
        <p className="text-ivory/45 mt-2 max-w-2xl text-sm leading-6">
          {description}
        </p>
      </div>
      <span className="text-ivory/45 w-fit border border-white/10 px-3 py-2 font-mono text-[10px] tracking-[0.12em] uppercase">
        {count}
      </span>
    </div>
  )
}
