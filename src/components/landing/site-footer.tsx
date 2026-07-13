import Link from 'next/link'
import { ExternalLink, MessageCircle } from 'lucide-react'

import { TrackedWhatsappLink } from '@/components/landing/tracked-whatsapp-link'

function whatsappHref(phone: string) {
  const normalized = phone.replace(/\D/g, '')
  return normalized ? `https://wa.me/${normalized}` : null
}

export function SiteFooter() {
  const operator = process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim()
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim()
  const whatsapp = phone ? whatsappHref(phone) : null

  return (
    <footer className="border-t border-white/[0.07] bg-[#090807] py-12 sm:py-16">
      <div className="site-container">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="brand-mark size-9 text-[11px]">AP</span>
              <span className="text-ivory text-xl font-extrabold tracking-[-0.04em]">
                AutoPost
              </span>
            </div>
            <p className="text-ivory/48 mt-5 max-w-md text-sm leading-7">
              AutoPost-ს მართავს რეალური ქართული გუნდი. კითხვების შემთხვევაში
              მოგვწერეთ WhatsApp-ზე ან Facebook-ზე.
            </p>
            {operator ? (
              <p className="text-ivory/45 mt-3 text-xs">
                ოპერატორი: {operator}
              </p>
            ) : null}
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:justify-self-end">
            <div>
              <p className="text-ivory/40 text-xs font-bold tracking-[0.16em] uppercase">
                AutoPost
              </p>
              <nav
                aria-label="AutoPost-ის გვერდები"
                className="text-ivory/58 mt-4 flex flex-col items-start gap-3 text-sm"
              >
                <Link className="nav-link" href="/examples">
                  მაგალითები
                </Link>
                <Link className="nav-link" href="/how-it-works">
                  როგორ მუშაობს
                </Link>
                <Link className="nav-link" href="/pricing">
                  ფასი
                </Link>
                <Link className="nav-link" href="/faq">
                  კითხვები
                </Link>
              </nav>
            </div>
            <div>
              <p className="text-ivory/40 text-xs font-bold tracking-[0.16em] uppercase">
                ინფორმაცია
              </p>
              <nav
                aria-label="სამართლებრივი გვერდები"
                className="text-ivory/58 mt-4 flex flex-col items-start gap-3 text-sm"
              >
                <Link className="nav-link" href="/privacy">
                  კონფიდენციალურობა
                </Link>
                <Link className="nav-link" href="/terms">
                  წესები და პირობები
                </Link>
                <Link className="nav-link" href="/about">
                  ჩვენს შესახებ
                </Link>
                <Link className="nav-link" href="/guides">
                  გზამკვლევები
                </Link>
              </nav>
            </div>
            {(whatsapp || facebookUrl) && (
              <div>
                <p className="text-ivory/40 text-xs font-bold tracking-[0.16em] uppercase">
                  დაგვიკავშირდი
                </p>
                <div className="text-ivory/58 mt-4 flex flex-col items-start gap-3 text-sm">
                  {whatsapp ? (
                    <TrackedWhatsappLink
                      href={whatsapp}
                      source="footer"
                      className="nav-link inline-flex items-center gap-2"
                    >
                      <MessageCircle
                        aria-hidden="true"
                        className="text-amber size-4"
                      />
                      WhatsApp{phone ? ` · ${phone}` : ''}
                    </TrackedWhatsappLink>
                  ) : null}
                  {facebookUrl ? (
                    <a
                      className="nav-link inline-flex items-center gap-2"
                      href={facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink
                        aria-hidden="true"
                        className="text-amber size-4"
                      />{' '}
                      Facebook
                    </a>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-ivory/40 mt-12 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AutoPost. ყველა უფლება დაცულია.</p>
          <p className="font-mono tracking-[0.14em]">
            FOR CARS · BUILT IN GEORGIA
          </p>
        </div>
      </div>
    </footer>
  )
}
