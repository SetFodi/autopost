import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export function EditorialLink({
  href,
  index,
  title,
  description,
}: {
  href: string
  index: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group hover:border-amber/50 grid gap-5 border-t border-white/10 py-6 transition-colors sm:grid-cols-[4rem_1fr_auto] sm:items-start sm:py-8"
    >
      <span className="text-amber font-mono text-xs tracking-[0.16em]">
        {index}
      </span>
      <span>
        <strong className="font-display text-ivory group-hover:text-amber block text-xl tracking-[-0.035em] transition-colors sm:text-2xl">
          {title}
        </strong>
        <span className="text-ivory/45 mt-2 block max-w-2xl text-sm leading-7">
          {description}
        </span>
      </span>
      <ArrowUpRight
        aria-hidden="true"
        className="text-ivory/30 group-hover:text-amber size-5 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </Link>
  )
}
