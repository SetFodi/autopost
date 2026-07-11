/**
 * Demo photography — path and vehicle identity always travel together.
 * Never hardcode a model name on a different image.
 */
export const demoAssets = {
  heroBefore: {
    src: '/demo/before-mercedes.jpg',
    alt: 'გამყიდველის ტელეფონით გადაღებული ფოტო — იგივე Mercedes-AMG GT R ეზოში, მკვეთრ შუადღის მზეზე',
    fileLabel: 'IMG_2417.JPG',
    objectPosition: 'object-[center_62%]',
  },
  heroAfter: {
    src: '/demo/after-mercedes.jpg',
    alt: 'AutoPost-ის მზა სარეკლამო კადრი — Mercedes-AMG GT R',
    model: 'Mercedes-AMG GT R',
    specs: '2020 · 28 000 კმ · ბენზინი · თბილისი',
    price: '$118,500',
    objectPosition: 'object-[center_55%]',
  },

  sourceToyota: {
    src: '/demo/before-toyota.jpg',
    alt: 'გამყიდველის ფოტო — Toyota Camry წვიმიან პარკინგზე, ღრუბლიან ამინდში',
    fileLabel: 'IMG_2403.JPG',
    model: 'Toyota Camry',
    objectPosition: 'object-[center_52%]',
  },
  sourceVw: {
    src: '/demo/before-vw.jpg',
    alt: 'გამყიდველის ღამის ფოტო — Volkswagen Polo ტროტუართან, ტელეფონის კადრი',
    fileLabel: 'IMG_2409.JPG',
    model: 'Volkswagen Polo',
    objectPosition: 'object-[center_55%]',
  },

  /** Format-native frames for deliverables + package output */
  reelAudi: {
    src: '/demo/format-reel.jpg',
    alt: 'Reel — Audi RS6 Avant, 9:16',
    model: 'Audi RS6 Avant',
    format: 'REEL · 9:16',
    objectPosition: 'object-[center_55%]',
    /** Native preview frame in the UI — height must be definite so the aspect ratio can resolve a width. */
    frameClass: 'aspect-[9/14] h-[19rem] sm:h-[22rem] mx-auto',
  },
  storyTesla: {
    src: '/demo/format-story.jpg',
    alt: 'Story — Tesla Model 3, 4:5',
    model: 'Tesla Model 3',
    format: 'STORY · 4:5',
    objectPosition: 'object-[center_80%]',
    frameClass: 'aspect-[4/5] h-[16rem] sm:h-[19rem] mx-auto',
  },
  carouselPorsche: {
    src: '/demo/format-carousel.jpg',
    alt: 'Carousel — Porsche Panamera Turbo, 16:10',
    model: 'Porsche Panamera',
    format: 'CAROUSEL · 6 სლაიდი',
    objectPosition: 'object-[center_48%]',
    frameClass: 'aspect-[16/10] w-full',
  },
  cardMercedes: {
    src: '/demo/format-card.jpg',
    alt: 'კვადრატული ბარათი — Mercedes-AMG GT R, 1:1',
    model: 'Mercedes-AMG GT R',
    format: '1:1',
    objectPosition: 'object-[center_52%]',
    frameClass: 'aspect-square max-h-[18rem] w-full max-w-[18rem] mx-auto',
  },
} as const

export const demoSalesCopy = [
  {
    lang: 'KA',
    text: 'იყიდება Mercedes-AMG GT R — იდეალურ მდგომარეობაში…',
  },
  {
    lang: 'EN',
    text: 'Mercedes-AMG GT R for sale — excellent condition…',
  },
  {
    lang: 'RU',
    text: 'Продаётся Mercedes-AMG GT R — отличное состояние…',
  },
] as const
