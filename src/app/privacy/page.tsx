import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader } from '@/components/landing/site-header'

export const metadata: Metadata = {
  title: 'კონფიდენციალურობის პოლიტიკა | AutoPost',
  description:
    'როგორ აგროვებს და იყენებს AutoPost საკონტაქტო ინფორმაციასა და ავტომობილის ფოტოებს Preview-ს მოსამზადებლად.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  const operator =
    process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || 'AutoPost-ის ოპერატორი'
  const contact =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim() ||
    'AutoPost-ის ოფიციალური WhatsApp ან Facebook არხი'

  return (
    <>
      <SiteHeader />
      <main className="min-h-[70vh] py-16 sm:py-24">
        <article className="site-container max-w-4xl">
          <Link
            href="/"
            className="text-amber inline-flex items-center gap-2 text-xs font-bold hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> მთავარ გვერდზე
            დაბრუნება
          </Link>

          <div className="mt-10 border-b border-white/10 pb-10 sm:mt-14 sm:pb-14">
            <span className="border-amber/35 text-amber grid size-12 place-items-center border">
              <ShieldCheck aria-hidden="true" className="size-6" />
            </span>
            <h1 className="font-display text-ivory mt-7 text-[clamp(2.7rem,7vw,5.8rem)] leading-[1.02] font-bold tracking-[-0.06em] [overflow-wrap:anywhere]">
              კონფიდენციალურობის პოლიტიკა
            </h1>
            <p className="text-ivory/55 mt-5 text-sm">
              ბოლო განახლება: 11 ივლისი, 2026
            </p>
          </div>

          <div className="legal-copy pt-4 pb-10 sm:pb-16">
            <p>
              ეს გვერდი მოკლედ განმარტავს, რა ინფორმაციას იღებს {operator}{' '}
              AutoPost-ის უფასო Preview-ს მოსამზადებლად და როგორ ვიყენებთ მას.
              ვაგროვებთ მომხმარებლის მიერ ფორმაში მითითებულ ინფორმაციას და
              უსაფრთხოებისა და ფუნქციონირებისთვის აუცილებელ შეზღუდულ ტექნიკურ
              მონაცემებს.
            </p>

            <h2>რა ინფორმაციას ვაგროვებთ</h2>
            <ul>
              <li>ტელეფონის ან WhatsApp ნომერს;</li>
              <li>სახელს, თუ მომხმარებელი მის მითითებას გადაწყვეტს;</li>
              <li>
                ავტომობილის ძირითად მონაცემებს — მოდელს, წელს, ფასსა და
                დამატებით აღწერას;
              </li>
              <li>მომხმარებლის მიერ ატვირთულ ავტომობილის ფოტოებს;</li>
              <li>
                განაცხადის ტექნიკურ მონაცემებს, რომლებიც საჭიროა უსაფრთხოებისა
                და ბოროტად გამოყენების პრევენციისთვის.
              </li>
            </ul>

            <h2>რატომ გვჭირდება ტელეფონის ნომერი</h2>
            <p>
              ნომერს ვიყენებთ განაცხადის დასაკავშირებლად და წყლის ნიშნით დაცული
              Preview-ს WhatsApp-ზე გამოსაგზავნად. ამ MVP-ში მომხმარებლის
              ანგარიში არ იქმნება და ნომერი არ გამოიყენება არასაჭირო სარეკლამო
              შეტყობინებებისთვის.
            </p>

            <h2>რატომ გვჭირდება ავტომობილის ფოტოები</h2>
            <p>
              ფოტოები გამოიყენება მხოლოდ მოთხოვნილი Reel-ის, Story დიზაინების,
              carousel-ის, კვადრატული ბარათისა და ტექსტის Preview-ს ხელით
              მოსამზადებლად. შესაძლებელია შეიქმნას წყლის ნიშნით დაცული წინასწარი
              ვერსია, რათა მომხმარებელმა შედეგი გადახდამდე შეაფასოს.
            </p>

            <h2>ანალიტიკა</h2>
            <p>
              სერვისის გასაუმჯობესებლად ვითვლით ისეთ ტექნიკურ მოვლენებს,
              როგორებიცაა გვერდის ნახვა, ფორმის დაწყება და დასრულებული
              განაცხადი. ანალიტიკის მოვლენებში ტელეფონის ნომერს, სახელსა და
              ფოტოებს არ ვინახავთ. თუ Meta Pixel ჩართულია, ჩვენი კოდი იძახებს
              PageView, FormStarted და, წარმატებული განაცხადის შემდეგ, Lead
              მოვლენებს; Lead-ს ვუმატებთ მხოლოდ სერვისის ზოგად სახელსა და
              კატეგორიას. Meta-ს მოვლენებს არ ვუმატებთ ფორმის ველების
              მნიშვნელობებს, ტელეფონის ნომერს, სახელს, ფოტოებს ან განაცხადის
              კოდს. ამასთან, Meta-ს Pixel ტექნოლოგიამ შეიძლება Meta-ს საკუთარი
              კონფიდენციალურობის პოლიტიკის შესაბამისად დაამუშაოს გვერდისა და
              ბრაუზერის ტექნიკური მონაცემები, IP მისამართი, cookie-ები ან
              მსგავსი იდენტიფიკატორები.
            </p>

            <h2>გამოქვეყნება და გაზიარება</h2>
            <p>
              ატვირთულ ფოტოებსა და მომზადებულ მასალას მომხმარებლის ცალკე
              თანხმობის გარეშე საჯაროდ არ ვაქვეყნებთ. სამუშაოს შესასრულებლად
              მასალაზე წვდომა შეიძლება ჰქონდეს მხოლოდ AutoPost-ის შესაბამის
              გუნდს და ტექნიკურ სერვისებს, რომლებშიც მონაცემები უსაფრთხოდ
              ინახება ან მიეწოდება მომხმარებელს.
            </p>

            <h2>შენახვა და წაშლის მოთხოვნა</h2>
            <p>
              ინფორმაციას ვინახავთ იმდენ ხანს, რამდენიც საჭიროა Preview-ს
              მომზადებისა და განაცხადთან დაკავშირებული კომუნიკაციისთვის.
              მომხმარებელს შეუძლია მოითხოვოს თავისი განაცხადისა და ატვირთული
              მასალის წაშლა. მოთხოვნის იდენტიფიცირებისთვის შეიძლება დაგვჭირდეს
              განაცხადის კოდი ან გამოყენებული ტელეფონის ნომრის დადასტურება.
            </p>

            <h2>როგორ დაგვიკავშირდე</h2>
            <p>
              ინფორმაციის, შესწორების ან წაშლის მოთხოვნისთვის დაგვიკავშირდი:{' '}
              <strong className="text-ivory">{contact}</strong>. გთხოვ, მიუთითო
              განაცხადის საჯარო კოდი, თუ ის გაქვს.
            </p>

            <p className="border-amber bg-amber/[0.055] mt-10 border-l-2 px-5 py-4 text-xs">
              ეს მოკლე პოლიტიკა აღწერს AutoPost-ის მიმდინარე validation MVP-ს.
              სერვისის ფუნქციების ან დამუშავების პროცესის მნიშვნელოვანი
              ცვლილების შემთხვევაში ტექსტიც განახლდება.
            </p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  )
}
