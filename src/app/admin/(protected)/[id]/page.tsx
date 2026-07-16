import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  CalendarDays,
  CarFront,
  CheckCircle2,
  CircleDollarSign,
  Clapperboard,
  Clock3,
  FileText,
  Gauge,
  Hash,
  Images,
  MapPin,
  Megaphone,
  Phone,
  Play,
  Send,
  Settings2,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react'

import { changeSubmissionStatusAction } from '@/app/admin/actions'
import { DeleteSubmissionControl } from '@/components/admin/delete-submission-control'
import { PendingButton } from '@/components/admin/pending-button'
import { PhotoGallery } from '@/components/admin/photo-gallery'
import { StatusBadge } from '@/components/admin/status-badge'
import { SubmissionEditor } from '@/components/admin/submission-editor'
import { WhatsAppWorkflow } from '@/components/admin/whatsapp-workflow'
import { requireAdmin } from '@/lib/admin/auth'
import { SELLER_TYPE_LABELS } from '@/lib/admin/constants'
import {
  formatAdminDate,
  formatMoney,
  formatVehiclePrice,
} from '@/lib/admin/format'
import { getAdminSubmission } from '@/lib/admin/queries'
import type { SubmissionStatus } from '@/lib/admin/types'

export const dynamic = 'force-dynamic'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type SubmissionDetailPageProps = {
  params: Promise<{ id: string }>
}

function DetailItem({
  label,
  value,
  icon,
  wide = false,
  mono = false,
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  wide?: boolean
  mono?: boolean
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border border-white/8 bg-black/15 p-4 ${wide ? 'sm:col-span-2' : ''}`}
    >
      <dt className="flex items-center gap-2 text-xs font-semibold text-stone-600">
        <span className="text-stone-500">{icon}</span>
        {label}
      </dt>
      <dd
        className={`mt-2 text-sm leading-6 break-words whitespace-pre-wrap text-stone-200 ${
          mono ? 'font-mono' : 'font-medium'
        }`}
      >
        {value || '—'}
      </dd>
    </div>
  )
}

const QUICK_ACTIONS: Array<{
  status: SubmissionStatus
  label: string
  pendingLabel: string
  icon: typeof Play
  className: string
}> = [
  {
    status: 'in_progress',
    label: 'დამუშავების დაწყება',
    pendingLabel: 'ინიშნება…',
    icon: Play,
    className:
      'border-amber-400/20 bg-amber-400/8 text-amber-100 hover:bg-amber-400/15',
  },
  {
    status: 'preview_ready',
    label: 'Preview მზადაა',
    pendingLabel: 'ინიშნება…',
    icon: Clapperboard,
    className:
      'border-orange-400/20 bg-orange-400/8 text-orange-100 hover:bg-orange-400/15',
  },
  {
    status: 'delivered',
    label: 'გაგზავნილად მონიშვნა',
    pendingLabel: 'ინიშნება…',
    icon: Send,
    className:
      'border-violet-400/20 bg-violet-400/8 text-violet-100 hover:bg-violet-400/15',
  },
  {
    status: 'converted',
    label: 'გადახდილად მონიშვნა',
    pendingLabel: 'ინიშნება…',
    icon: BadgeCheck,
    className:
      'border-emerald-400/20 bg-emerald-400/8 text-emerald-100 hover:bg-emerald-400/15',
  },
  {
    status: 'rejected',
    label: 'უარყოფა',
    pendingLabel: 'ინიშნება…',
    icon: Ban,
    className:
      'border-rose-400/20 bg-rose-400/8 text-rose-100 hover:bg-rose-400/15',
  },
]

export default async function SubmissionDetailPage({
  params,
}: SubmissionDetailPageProps) {
  await requireAdmin()
  const { id } = await params
  if (!UUID_PATTERN.test(id)) notFound()

  const submission = await getAdminSubmission(id)
  if (!submission) notFound()

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link
        href="/admin"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-stone-500 transition hover:bg-white/5 hover:text-stone-200 focus-visible:outline-2 focus-visible:outline-orange-400"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        ყველა განაცხადი
      </Link>

      <header className="mt-4 flex flex-col justify-between gap-5 border-b border-white/8 pb-7 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-[0.12em] text-orange-400 uppercase">
              {submission.public_reference}
            </span>
            <StatusBadge status={submission.status} />
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.035em] break-words text-stone-100 sm:text-4xl">
            {submission.vehicle_model}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
            <span>{submission.vehicle_year}</span>
            <span aria-hidden="true">·</span>
            <span>
              {formatVehiclePrice(submission.price, submission.price_currency)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{submission.photos.length} ფოტო</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            const missingDeliveryUrl =
              (action.status === 'delivered' ||
                action.status === 'converted') &&
              !submission.delivery_url?.trim()
            const missingPayment =
              action.status === 'converted' &&
              Number(submission.amount_paid ?? 0) <= 0
            const missingDeliveryLifecycle =
              action.status === 'converted' &&
              submission.status !== 'delivered' &&
              submission.status !== 'converted'
            return (
              <form
                key={action.status}
                action={changeSubmissionStatusAction.bind(
                  null,
                  submission.id,
                  action.status,
                )}
              >
                <PendingButton
                  disabled={
                    submission.status === action.status ||
                    missingDeliveryUrl ||
                    missingPayment ||
                    missingDeliveryLifecycle
                  }
                  pendingLabel={action.pendingLabel}
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-orange-400 ${action.className}`}
                >
                  <Icon aria-hidden="true" className="size-3.5" />
                  {action.label}
                </PendingButton>
              </form>
            )
          })}
        </div>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-[#151616] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-orange-400 uppercase">
                  Intake
                </p>
                <h2 className="mt-1 text-xl font-black text-stone-100">
                  განაცხადის მონაცემები
                </h2>
              </div>
              <CarFront aria-hidden="true" className="size-5 text-stone-600" />
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                label="საჯარო კოდი"
                value={submission.public_reference}
                mono
                icon={<Hash aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="მიღების დრო"
                value={formatAdminDate(submission.created_at)}
                icon={<CalendarDays aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="ტელეფონი / WhatsApp"
                value={submission.phone}
                mono
                icon={<Phone aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="მომხმარებელი"
                value={submission.customer_name}
                icon={<UserRound aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="თქვენ ვინ ხართ?"
                value={
                  submission.seller_type
                    ? SELLER_TYPE_LABELS[submission.seller_type]
                    : 'არ არის მითითებული'
                }
                icon={<Store aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="მანქანა"
                value={submission.vehicle_model}
                icon={<CarFront aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="წელი / ფასი"
                value={`${submission.vehicle_year} · ${formatVehiclePrice(
                  submission.price,
                  submission.price_currency,
                )}`}
                icon={
                  <CircleDollarSign aria-hidden="true" className="size-3.5" />
                }
              />
              <DetailItem
                label="გარბენი"
                value={
                  submission.mileage != null ? `${submission.mileage} კმ` : null
                }
                icon={<Gauge aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="ძრავი / ტრანსმისია"
                value={[submission.engine, submission.transmission]
                  .filter(Boolean)
                  .join(' · ')}
                icon={<Settings2 aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="მდებარეობა"
                value={submission.location}
                icon={<MapPin aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="თანხმობა"
                value={
                  submission.consent_given ? (
                    <span className="inline-flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 aria-hidden="true" className="size-4" />
                      მიღებულია
                    </span>
                  ) : (
                    'არ არის მიღებული'
                  )
                }
                icon={<ShieldCheck aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="დამატებითი ინფორმაცია"
                value={submission.additional_info}
                wide
                icon={<FileText aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="კამპანიის წყარო"
                value={
                  [submission.utm_source, submission.utm_medium]
                    .filter(Boolean)
                    .join(' / ') || 'ორგანული / უცნობი'
                }
                wide
                icon={<Megaphone aria-hidden="true" className="size-3.5" />}
              />
              <DetailItem
                label="UTM დეტალები"
                value={[
                  submission.utm_campaign
                    ? `campaign: ${submission.utm_campaign}`
                    : null,
                  submission.utm_content
                    ? `content: ${submission.utm_content}`
                    : null,
                  submission.utm_term ? `term: ${submission.utm_term}` : null,
                ]
                  .filter(Boolean)
                  .join('\n')}
                wide
                mono
                icon={<Hash aria-hidden="true" className="size-3.5" />}
              />
            </dl>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#151616] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-orange-400 uppercase">
                  Source media
                </p>
                <h2 className="mt-1 text-xl font-black text-stone-100">
                  ატვირთული ფოტოები
                </h2>
              </div>
              <p className="inline-flex items-center gap-2 text-xs text-stone-600">
                <Images aria-hidden="true" className="size-3.5" />
                {submission.photos.length} ფაილი · ბმული მოქმედებს 1 საათი
              </p>
            </div>
            <PhotoGallery photos={submission.photos} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-[#151616] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-bold tracking-[0.16em] text-orange-400 uppercase">
                Workflow
              </p>
              <h2 className="mt-1 text-xl font-black text-stone-100">
                სტატუსი და ჩანაწერები
              </h2>
            </div>
            <SubmissionEditor submission={submission} />
          </section>

          <section className="overflow-hidden rounded-3xl border border-[#25D366]/15 bg-[#141816] shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <div className="border-b border-white/8 bg-[#25D366]/5 p-4 sm:p-6">
              <p className="text-xs font-bold tracking-[0.16em] text-[#63e493] uppercase">
                Delivery
              </p>
              <h2 className="mt-1 text-xl font-black text-stone-100">
                WhatsApp მიწოდება
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                ჩასვით Drive-ის ბმული, გადაამოწმეთ ტექსტი და გახსენით WhatsApp.
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <WhatsAppWorkflow
                submissionId={submission.id}
                phone={submission.phone}
                vehicleModel={submission.vehicle_model}
                initialDeliveryUrl={submission.delivery_url ?? ''}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#151616] p-4 sm:p-6">
            <h2 className="text-sm font-black text-stone-200">
              მიწოდებისა და გადახდის ჩანაწერი
            </h2>
            <dl className="mt-4 space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
                <dt className="inline-flex items-center gap-2 text-xs text-stone-600">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  მიწოდებულია
                </dt>
                <dd className="text-right text-xs font-semibold text-stone-300">
                  {formatAdminDate(submission.delivered_at)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
                <dt className="inline-flex items-center gap-2 text-xs text-stone-600">
                  <BadgeCheck aria-hidden="true" className="size-3.5" />
                  კონვერტირებულია
                </dt>
                <dd className="text-right text-xs font-semibold text-stone-300">
                  {formatAdminDate(submission.converted_at)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs text-stone-600">ჩაწერილი თანხა</dt>
                <dd className="text-lg font-black text-emerald-300 tabular-nums">
                  {formatMoney(submission.amount_paid)}
                </dd>
              </div>
            </dl>
          </section>

          <DeleteSubmissionControl
            submissionId={submission.id}
            publicReference={submission.public_reference}
          />
        </aside>
      </div>
    </main>
  )
}
