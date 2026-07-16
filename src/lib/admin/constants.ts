import type { SellerType, SubmissionStatus } from '@/lib/admin/types'

export const SELLER_TYPE_LABELS: Record<SellerType, string> = {
  private_seller: 'პირადი გამყიდველი',
  dealer: 'ავტოდილერი',
}

export const STATUS_DETAILS: Record<
  SubmissionStatus,
  {
    label: string
    description: string
    className: string
    dotClassName: string
  }
> = {
  new: {
    label: 'ახალი',
    description: 'ჯერ არ დამუშავებულა',
    className: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
    dotClassName: 'bg-sky-300',
  },
  in_progress: {
    label: 'მუშავდება',
    description: 'მასალები მზადდება',
    className: 'border-amber-400/25 bg-amber-400/10 text-amber-100',
    dotClassName: 'bg-amber-300',
  },
  preview_ready: {
    label: 'Preview მზადაა',
    description: 'შეიძლება გაგზავნა',
    className: 'border-orange-400/30 bg-orange-400/10 text-orange-100',
    dotClassName: 'bg-orange-400',
  },
  delivered: {
    label: 'გაგზავნილი',
    description: 'Preview მიწოდებულია',
    className: 'border-violet-400/25 bg-violet-400/10 text-violet-100',
    dotClassName: 'bg-violet-300',
  },
  converted: {
    label: 'გადახდილი',
    description: 'სრული პაკეტი შეძენილია',
    className: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100',
    dotClassName: 'bg-emerald-300',
  },
  rejected: {
    label: 'უარყოფილი',
    description: 'განაცხადი დახურულია',
    className: 'border-rose-400/25 bg-rose-400/10 text-rose-100',
    dotClassName: 'bg-rose-300',
  },
}
