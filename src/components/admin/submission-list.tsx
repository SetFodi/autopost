import Link from 'next/link'
import {
  ArrowUpRight,
  CarFront,
  FilterX,
  Search,
  SlidersHorizontal,
} from 'lucide-react'

import { StatusBadge } from '@/components/admin/status-badge'
import { SELLER_TYPE_LABELS, STATUS_DETAILS } from '@/lib/admin/constants'
import { formatAdminDate, formatVehiclePrice } from '@/lib/admin/format'
import {
  SUBMISSION_STATUSES,
  SELLER_TYPES,
  type AdminDashboardFilters,
  type AdminSubmissionListItem,
} from '@/lib/admin/types'

type SubmissionListProps = {
  submissions: AdminSubmissionListItem[]
  filters: AdminDashboardFilters
  resultLimit: number
}

export function SubmissionList({
  submissions,
  filters,
  resultLimit,
}: SubmissionListProps) {
  const isFiltered =
    Boolean(filters.query) ||
    filters.status !== 'all' ||
    filters.sellerType !== 'all'

  return (
    <section
      aria-labelledby="submissions-title"
      className="overflow-hidden rounded-3xl border border-white/10 bg-[#151616] shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
    >
      <div className="border-b border-white/8 p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-orange-400 uppercase">
              Pipeline
            </p>
            <h2
              id="submissions-title"
              className="mt-1 text-xl font-bold text-stone-100"
            >
              განაცხადები
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              მხოლოდ სრულად ატვირთული განაცხადები · უახლესი პირველია
            </p>
          </div>

          <form
            action="/admin"
            method="get"
            role="search"
            className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_190px_190px_auto]"
          >
            <label className="relative block">
              <span className="sr-only">
                მოძებნეთ მანქანით, ნომრით ან კოდით
              </span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-500"
              />
              <input
                type="search"
                name="q"
                defaultValue={filters.query}
                maxLength={80}
                placeholder="მანქანა, ნომერი ან კოდი"
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black/25 pr-4 pl-10 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-orange-400/60 focus:ring-4 focus:ring-orange-400/10"
              />
            </label>

            <label className="relative block">
              <span className="sr-only">სტატუსის ფილტრი</span>
              <SlidersHorizontal
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-500"
              />
              <select
                name="status"
                defaultValue={filters.status}
                className="min-h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#111212] pr-8 pl-10 text-sm text-stone-200 outline-none focus:border-orange-400/60 focus:ring-4 focus:ring-orange-400/10"
              >
                <option value="all">ყველა სტატუსი</option>
                {SUBMISSION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_DETAILS[status].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="relative block">
              <span className="sr-only">გამყიდველის ტიპის ფილტრი</span>
              <CarFront
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-500"
              />
              <select
                name="sellerType"
                defaultValue={filters.sellerType}
                className="min-h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#111212] pr-8 pl-10 text-sm text-stone-200 outline-none focus:border-orange-400/60 focus:ring-4 focus:ring-orange-400/10"
              >
                <option value="all">ყველა გამყიდველი</option>
                {SELLER_TYPES.map((sellerType) => (
                  <option key={sellerType} value={sellerType}>
                    {SELLER_TYPE_LABELS[sellerType]}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="min-h-11 rounded-xl bg-stone-100 px-5 text-sm font-bold text-stone-950 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
            >
              გაფილტვრა
            </button>
          </form>
        </div>

        {isFiltered ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span>{submissions.length} შედეგი</span>
            <span aria-hidden="true">·</span>
            <Link
              href="/admin"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-stone-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-orange-400"
            >
              <FilterX aria-hidden="true" className="size-3.5" />
              ფილტრის გასუფთავება
            </Link>
          </div>
        ) : null}
      </div>

      {submissions.length === 0 ? (
        <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
              <CarFront aria-hidden="true" className="size-6 text-stone-500" />
            </span>
            <h3 className="mt-4 text-base font-bold text-stone-200">
              {isFiltered
                ? 'შესაბამისი განაცხადი ვერ მოიძებნა'
                : 'განაცხადები ჯერ არ არის'}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
              {isFiltered
                ? 'შეცვალეთ საძიებო სიტყვა ან სტატუსის ფილტრი.'
                : 'სრულად ატვირთული განაცხადები აქ ავტომატურად გამოჩნდება.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/8 text-[11px] font-bold tracking-[0.13em] text-stone-500 uppercase">
                  <th scope="col" className="px-5 py-4">
                    მანქანა
                  </th>
                  <th scope="col" className="px-4 py-4">
                    კონტაქტი
                  </th>
                  <th scope="col" className="px-4 py-4">
                    სტატუსი
                  </th>
                  <th scope="col" className="px-4 py-4">
                    ფასი
                  </th>
                  <th scope="col" className="px-4 py-4">
                    მიღებულია
                  </th>
                  <th scope="col" className="px-5 py-4 text-right">
                    გახსნა
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {submissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="group transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4 align-middle">
                      <p className="max-w-xs truncate text-sm font-bold text-stone-100">
                        {submission.vehicle_model}
                      </p>
                      <p className="mt-1 font-mono text-xs text-stone-500">
                        {submission.public_reference} ·{' '}
                        {submission.vehicle_year}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-stone-600">
                        {submission.seller_type
                          ? SELLER_TYPE_LABELS[submission.seller_type]
                          : 'გამყიდველი არ არის მითითებული'}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <p className="font-mono text-sm text-stone-300">
                        {submission.phone}
                      </p>
                      <p className="mt-1 max-w-44 truncate text-xs text-stone-600">
                        {submission.customer_name || 'სახელი არ არის'}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-4 py-4 align-middle text-sm font-semibold text-stone-300 tabular-nums">
                      {formatVehiclePrice(
                        submission.price,
                        submission.price_currency,
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle text-xs text-stone-500">
                      {formatAdminDate(submission.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right align-middle">
                      <Link
                        href={`/admin/${submission.id}`}
                        aria-label={`${submission.vehicle_model} განაცხადის გახსნა`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-bold text-stone-300 transition group-hover:border-orange-400/30 group-hover:text-orange-300 hover:bg-orange-400/5 focus-visible:outline-2 focus-visible:outline-orange-400"
                      >
                        დეტალები
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-white/8 md:hidden">
            {submissions.map((submission) => (
              <article key={submission.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-stone-100">
                      {submission.vehicle_model}
                    </p>
                    <p className="mt-1 font-mono text-xs text-stone-500">
                      {submission.public_reference} · {submission.vehicle_year}
                    </p>
                  </div>
                  <StatusBadge status={submission.status} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-white/8 bg-black/15 p-3">
                  <div>
                    <dt className="text-[11px] font-semibold text-stone-600">
                      ტელეფონი
                    </dt>
                    <dd className="mt-1 truncate font-mono text-xs text-stone-300">
                      {submission.phone}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold text-stone-600">
                      ფასი
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-stone-200 tabular-nums">
                      {formatVehiclePrice(
                        submission.price,
                        submission.price_currency,
                      )}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[11px] font-semibold text-stone-600">
                      გამყიდველი
                    </dt>
                    <dd className="mt-1 text-xs text-stone-400">
                      {submission.seller_type
                        ? SELLER_TYPE_LABELS[submission.seller_type]
                        : 'არ არის მითითებული'}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[11px] font-semibold text-stone-600">
                      მიღებულია
                    </dt>
                    <dd className="mt-1 text-xs text-stone-400">
                      {formatAdminDate(submission.created_at)}
                    </dd>
                  </div>
                </dl>

                <Link
                  href={`/admin/${submission.id}`}
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 text-sm font-bold text-stone-950 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
                >
                  განაცხადის გახსნა
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </article>
            ))}
          </div>

          {submissions.length === resultLimit ? (
            <p className="border-t border-white/8 px-5 py-3 text-center text-xs text-stone-600">
              ნაჩვენებია პირველი {resultLimit} შედეგი. გამოიყენეთ ძიება
              კონკრეტული განაცხადისთვის.
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}
