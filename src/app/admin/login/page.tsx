import { redirect } from 'next/navigation'
import { LockKeyhole, ShieldCheck } from 'lucide-react'

import { LoginForm } from '@/components/admin/login-form'
import { getAdminConfigurationIssue, getCurrentAdmin } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

type LoginPageProps = {
  searchParams: Promise<{ reason?: string | string[] }>
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const configurationIssue = getAdminConfigurationIssue()
  const admin = configurationIssue ? null : await getCurrentAdmin()
  if (admin) redirect('/admin')

  const params = await searchParams
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/60 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-14rem] left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-orange-500/[0.055] blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-5 flex items-center justify-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-orange-400/25 bg-orange-400/10">
            <LockKeyhole
              aria-hidden="true"
              className="size-4 text-orange-300"
            />
          </span>
          <p className="text-lg font-black tracking-tight text-stone-100">
            AutoPost
          </p>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-stone-500 uppercase">
            Admin
          </span>
        </div>

        <section className="rounded-[1.75rem] border border-white/10 bg-[#171818] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.48)] sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-orange-400 uppercase">
                Private access
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-stone-100">
                ადმინისტრაციის პანელი
              </h1>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                შესვლა შეუძლია მხოლოდ წინასწარ განსაზღვრულ ადმინისტრატორს.
              </p>
            </div>
            <ShieldCheck
              aria-hidden="true"
              className="mt-1 size-6 shrink-0 text-stone-600"
            />
          </div>

          {reason === 'unauthorized' ? (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm leading-6 text-rose-200"
            >
              ამ ანგარიშს ადმინისტრატორის წვდომა არ აქვს. შედით ნებადართული
              ელფოსტით.
            </div>
          ) : null}

          {configurationIssue ? (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/8 px-4 py-3 text-sm leading-6 text-amber-100"
            >
              <strong className="block">კონფიგურაცია არასრულია</strong>
              <span className="mt-1 block font-mono text-xs text-amber-200/70">
                {process.env.NODE_ENV === 'production'
                  ? 'დაუკავშირდით ოპერატორს.'
                  : configurationIssue}
              </span>
            </div>
          ) : null}

          <LoginForm disabled={Boolean(configurationIssue)} />
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-stone-700">
          რეგისტრაცია გამორთულია · სესია დაცულია Supabase Auth-ით
        </p>
      </div>
    </main>
  )
}
