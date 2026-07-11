import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileCheck2 } from 'lucide-react'

import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader } from '@/components/landing/site-header'

export const metadata: Metadata = {
  title: 'წესები და პირობები | AutoPost',
  description:
    'AutoPost-ის უფასო Preview-სა და 14.90₾-იანი სრული პაკეტის ძირითადი პირობები.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
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
              <FileCheck2 aria-hidden="true" className="size-6" />
            </span>
            <h1 className="font-display text-ivory mt-7 text-[clamp(2.7rem,7vw,5.8rem)] leading-[1.02] font-bold tracking-[-0.06em] [overflow-wrap:anywhere]">
              წესები და პირობები
            </h1>
            <p className="text-ivory/55 mt-5 text-sm">
              ბოლო განახლება: 11 ივლისი, 2026
            </p>
          </div>

          <div className="legal-copy pt-4 pb-10 sm:pb-16">
            <p>
              AutoPost არის validation-stage სერვისი, რომელიც მომხმარებლის მიერ
              მოწოდებული ავტომობილის ფოტოებიდან ხელით ამზადებს გასაყიდ კონტენტს.
              ფორმის გაგზავნით მომხმარებელი ადასტურებს, რომ გაეცნო ქვემოთ
              მოცემულ ძირითად პირობებს.
            </p>

            <h2>უფასო Preview</h2>
            <p>
              პირველი Preview უფასოა და შეიძლება შეიცავდეს თვალსაჩინო წყლის
              ნიშანს. ის მომხმარებელს ეგზავნება WhatsApp-ზე, ჩვეულებრივ მაქსიმუმ
              24 საათში. ეს ვადა საორიენტაციო მომსახურების ვადაა და შეიძლება
              შეიცვალოს, თუ მიღებული მასალა არასრულია ან დამატებით დაზუსტებას
              საჭიროებს.
            </p>

            <h2>სრული პაკეტი და ფასი</h2>
            <p>
              სრული პაკეტის ფასი არის{' '}
              <strong className="text-ivory">14.90₾</strong>. გადახდა
              მოთხოვნილია მხოლოდ მაშინ, თუ მომხმარებელს Preview მოეწონა და სურს
              წყლის ნიშნის გარეშე მომზადებული Reel, 3 Story, 6-სლაიდიანი
              carousel, მთავარი კვადრატული ბარათი და გაყიდვის ტექსტი ქართულ,
              ინგლისურ და რუსულ ენებზე. ონლაინ გადახდა ამ MVP-ში არ ხორციელდება.
            </p>

            <h2>გაყიდვის შედეგი</h2>
            <p>
              AutoPost ამზადებს სარეკლამო მასალას, თუმცა არ იძლევა ავტომობილის
              გაყიდვის, კონკრეტული რაოდენობის ნახვის, შეტყობინების ან სხვა
              კომერციული შედეგის გარანტიას. შედეგზე გავლენას ახდენს ფასი,
              ავტომობილის მდგომარეობა, განთავსების არხი, ბაზარი და სხვა
              ფაქტორები.
            </p>

            <h2>ფოტოების გამოყენების უფლება</h2>
            <p>
              ფოტოების ატვირთვით მომხმარებელი ადასტურებს, რომ აქვს მათი
              გამოყენებისა და AutoPost-ისთვის დამუშავების უფლება. დაუშვებელია
              სხვისი მასალის ატვირთვა სათანადო ნებართვის გარეშე ან ისეთი მასალის
              გაგზავნა, რომელიც მესამე პირის უფლებებს არღვევს.
            </p>

            <h2>გამოქვეყნება</h2>
            <p>
              ამ ვერსიაში AutoPost მომხმარებლის სახელით არაფერს აქვეყნებს
              Facebook-ზე, Instagram-ზე, TikTok-ზე, MyAuto-ზე ან სხვა
              პლატფორმაზე. მომხმარებელი იღებს მზა ფაილებს და თავად ირჩევს სად,
              როდის და რა პირობებით განათავსოს ისინი.
            </p>

            <h2>მასალის ხარისხი</h2>
            <p>
              საბოლოო შედეგის ხარისხი დამოკიდებულია ატვირთული ფოტოებისა და
              ინფორმაციის ხარისხზე. ბუნდოვანი, ძალიან მუქი, არასრული ან სხვა
              ავტომობილის ამსახველი ფოტოები შეიძლება არ იყოს საკმარისი კარგი
              Preview-სთვის; ასეთ შემთხვევაში გუნდი მომხმარებელს დამატებით
              მასალას სთხოვს.
            </p>

            <h2>კომუნიკაცია</h2>
            <p>
              განაცხადთან დაკავშირებული კომუნიკაცია მიმდინარეობს მომხმარებლის
              მიერ მითითებულ WhatsApp ნომერზე. მხარდაჭერისთვის შესაძლებელია
              AutoPost-ის ოფიციალური WhatsApp ან Facebook არხის გამოყენება, თუ
              შესაბამისი ბმული საიტზეა გამოქვეყნებული.
            </p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  )
}
