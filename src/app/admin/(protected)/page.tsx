import { DashboardKpis } from '@/components/admin/dashboard-kpis'
import { SubmissionList } from '@/components/admin/submission-list'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminDashboardData } from '@/lib/admin/queries'
import {
  SELLER_TYPES,
  SUBMISSION_STATUSES,
  type AdminDashboardFilters,
  type SellerType,
  type SubmissionStatus,
} from '@/lib/admin/types'

export const dynamic = 'force-dynamic'

type DashboardPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    sellerType?: string | string[]
    status?: string | string[]
  }>
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export default async function AdminDashboardPage({
  searchParams,
}: DashboardPageProps) {
  await requireAdmin()
  const params = await searchParams
  const requestedStatus = firstValue(params.status)
  const status = SUBMISSION_STATUSES.includes(
    requestedStatus as SubmissionStatus,
  )
    ? (requestedStatus as SubmissionStatus)
    : 'all'
  const requestedSellerType = firstValue(params.sellerType)
  const sellerType = SELLER_TYPES.includes(requestedSellerType as SellerType)
    ? (requestedSellerType as SellerType)
    : 'all'
  const filters: AdminDashboardFilters = {
    query: firstValue(params.q).trim().slice(0, 80),
    sellerType,
    status,
  }
  const { stats, submissions, resultLimit } =
    await getAdminDashboardData(filters)

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-orange-400 uppercase">
            Operations overview
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-stone-100 sm:text-4xl">
            განაცხადების მართვა
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-stone-500 sm:text-right">
          აქ ჩანს მხოლოდ დასრულებული ატვირთვები — მიტოვებული ან ნაწილობრივი
          მოთხოვნები მეტრიკებში არ ხვდება.
        </p>
      </div>

      <div className="space-y-5">
        <DashboardKpis stats={stats} />
        <SubmissionList
          submissions={submissions}
          filters={filters}
          resultLimit={resultLimit}
        />
      </div>
    </main>
  )
}
