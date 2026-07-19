/**
 * Demo photography — path and vehicle identity always travel together.
 * Never hardcode a model name on a different image.
 */
export const demoAssets = {
  heroBefore: {
    src: '/demo/hero-before-v3.webp',
    alt: 'საილუსტრაციო საწყისი ფოტო — ტელეფონით ნაჩქარევად გადაღებული Hyundai Sonata საცხოვრებელ ეზოში',
    fileLabel: 'IMG_4821.JPG',
    objectPosition: 'object-center',
  },
  heroAfter: {
    src: '/demo/hero-after-v3.webp',
    alt: 'AutoPost-ის საილუსტრაციო შედეგი — იგივე Hyundai Sonata გასწორებული კომპოზიციითა და ბუნებრივი დამუშავებით',
    model: 'Hyundai Sonata',
    specs: '2020 · 72 000 კმ · 2.4 ბენზინი · თბილისი',
    price: '38 500 ₾',
    objectPosition: 'object-center',
  },

  sourceSonata: {
    src: '/demo/hero-before-v3.webp',
    alt: 'საილუსტრაციო საწყისი ფოტო — Hyundai Sonata საცხოვრებელ ეზოში',
    fileLabel: 'IMG_4821.JPG',
    model: 'Hyundai Sonata',
    objectPosition: 'object-center',
  },

  sourceToyota: {
    src: '/demo/before-toyota.jpg',
    alt: 'გამყიდველის ფოტო — Toyota Camry წვიმიან პარკინგზე, ღრუბლიან ამინდში',
    fileLabel: 'IMG_2403.JPG',
    model: 'Toyota Camry',
    objectPosition: 'object-[center_52%]',
  },
  sourceVw: {
    src: '/demo/source-hatchback-v2.jpg',
    alt: 'გამყიდველის ტელეფონის ფოტო — ვერცხლისფერი კომპაქტური ჰეტჩბექი კორპუსის სადგომზე',
    fileLabel: 'IMG_4816.JPG',
    model: 'Nissan Almera',
    objectPosition: 'object-center',
  },

  /** Format-native frames for deliverables + package output */
  reelAudi: {
    src: '/demo/format-reel-v2.jpg',
    alt: 'Reel — ლურჯი Kia Sportage რეალისტურ საქალაქო ფონზე, 9:16',
    model: 'Kia Sportage',
    format: 'REEL · 9:16',
    objectPosition: 'object-center',
    /** Native preview frame in the UI — height must be definite so the aspect ratio can resolve a width. */
    frameClass: 'aspect-[2/3] h-[19rem] sm:h-[22rem] mx-auto',
  },
  storyTesla: {
    src: '/demo/format-story-v2.jpg',
    alt: 'Story — თეთრი Toyota Corolla ბუნებრივ საცხოვრებელ გარემოში, 4:5',
    model: 'Toyota Corolla',
    format: 'STORY · 4:5',
    objectPosition: 'object-center',
    frameClass: 'aspect-[4/5] h-[16rem] sm:h-[19rem] mx-auto',
  },
  carouselPorsche: {
    src: '/demo/format-carousel-v2.jpg',
    alt: 'Carousel — ბროწეულისფერი Chevrolet Captiva ჩვეულებრივ საქალაქო გარემოში, 16:10',
    model: 'Chevrolet Captiva',
    format: 'CAROUSEL · 6 სლაიდი',
    objectPosition: 'object-center',
    frameClass: 'aspect-[16/10] w-full',
  },
  cardMercedes: {
    src: '/demo/format-card-v2.jpg',
    alt: 'კვადრატული ბარათი — ვერცხლისფერი Hyundai Accent რეალისტურ სადგომზე, 1:1',
    model: 'Hyundai Accent',
    format: '1:1',
    objectPosition: 'object-center',
    frameClass: 'aspect-square max-h-[18rem] w-full max-w-[18rem] mx-auto',
  },
} as const

export const demoSalesCopy = [
  {
    lang: 'KA',
    text: 'იყიდება Hyundai Sonata — მოვლილი, სუფთა ინტერიერით…',
  },
  {
    lang: 'EN',
    text: 'Hyundai Sonata for sale — well maintained and ready to drive…',
  },
  {
    lang: 'RU',
    text: 'Продаётся Hyundai Sonata — ухоженный и готовый к поездкам…',
  },
] as const
