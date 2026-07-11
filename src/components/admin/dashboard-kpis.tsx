import {
  BadgeCheck,
  Banknote,
  Clapperboard,
  Files,
  Inbox,
  Send,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import { formatMoney } from '@/lib/admin/format'
import type { AdminDashboardStats } from '@/lib/admin/types'

export function DashboardKpis({ stats }: { stats: AdminDashboardStats }) {
  const items: Array<{
    label: string
    value: string
    icon: LucideIcon
    accent: string
  }> = [
    {
      label: 'სულ განაცხადი',
      value: String(stats.total),
      icon: Files,
      accent: 'text-stone-200',
    },
    {
      label: 'ახალი',
      value: String(stats.new),
      icon: Inbox,
      accent: 'text-sky-300',
    },
    {
      label: 'მუშავდება',
      value: String(stats.inProgress),
      icon: Wrench,
      accent: 'text-amber-300',
    },
    {
      label: 'Preview მზადაა',
      value: String(stats.previewReady),
      icon: Clapperboard,
      accent: 'text-orange-300',
    },
    {
      label: 'გაგზავნილი',
      value: String(stats.delivered),
      icon: Send,
      accent: 'text-violet-300',
    },
    {
      label: 'გადახდილი',
      value: String(stats.converted),
      icon: BadgeCheck,
      accent: 'text-emerald-300',
    },
    {
      label: 'შემოსავალი',
      value: formatMoney(stats.revenue),
      icon: Banknote,
      accent: 'text-emerald-300',
    },
  ]

  return (
    <section aria-labelledby="overview-title">
      <h2 id="overview-title" className="sr-only">
        მიმოხილვა
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <article
              key={item.label}
              className={`relative overflow-hidden rounded-2xl border border-white/8 bg-[#171818] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.2)] ${
                index === items.length - 1 ? 'col-span-2 md:col-span-1' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs leading-5 font-medium text-stone-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-stone-100 tabular-nums">
                    {item.value}
                  </p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-black/20">
                  <Icon
                    aria-hidden="true"
                    className={`size-4 ${item.accent}`}
                  />
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
