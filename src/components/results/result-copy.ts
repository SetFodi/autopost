import type { AppLocale } from '@/lib/i18n'

const resultCopy = {
  ka: {
    paymentUpdated: 'გადახდის სტატუსი განახლდა.',
    paymentChecking: 'გადახდა მოწმდება — გვერდი ავტომატურად განახლდება.',
    checkoutFailed: 'გადახდა ვერ დაიწყო.',
    checkoutLinkMissing: 'გადახდის ბმული ვერ მოიძებნა.',
    checkoutTemporary: 'გადახდა დროებით ვერ დაიწყო.',
    home: '/',
    studio: 'Private content studio',
    cleanFiles: 'Clean files',
    previewMode: 'Preview mode',
    resultDesk: 'Result desk',
    heading: 'შენი კონტენტ-პაკეტი',
    visualAssets: (count: number) => `${count} ვიზუალური მასალა`,
    ready: 'სრული პაკეტი მზადაა',
    previewReady: 'Preview მზადაა',
    retrying: 'დამუშავებას ხელახლა ვცდით',
    generating: 'AutoPost ამზადებს მასალებს',
    autoRefresh: 'გვერდი ავტომატურად განახლდება',
    sectionNav: 'შედეგების სექციები',
    reelTitle: 'Reel ვიდეო',
    reelDescription:
      '9:16 ვიდეო პირდაპირ აქვე ნახე — სრული კადრები, რბილი მოძრაობა და მობილურისთვის მზად ფორმატი.',
    motionTitle: 'ნახე მოძრაობაში',
    motionDescription:
      'Play ღილაკით შეაფასე მთელი ვიდეო. დიდ ფანჯარაში გახსნისას შეგიძლია სრულ ეკრანზეც ნახო, ხოლო ჩამოტვირთვა ცალკე ღილაკიდანაა ხელმისაწვდომი.',
    enlarge: 'დიდ ფანჯარაში ნახვა',
    downloadVideo: 'ვიდეოს ჩამოტვირთვა',
    storiesDescription:
      'სამი ვერტიკალური Story ცალკე სერიად — თითოეულზე დაჭერით იხსნება სუფთა, სრული preview.',
    carouselTitle: 'Carousel პოსტები',
    carouselDescription:
      'ექვსი თანმიმდევრული 1:1 სლაიდი ერთ ხაზში — გვერდი მოკლე რჩება, სერია კი მარტივად დასათვალიერებელია.',
    postDescription:
      'მთავარი 1:1 განცხადება Feed-ისთვის — ერთი მკაფიო კადრი, ფასი და საკონტაქტო ინფორმაცია.',
    postOpen: 'Instagram Post-ის დიდ ფანჯარაში გახსნა',
    postTitle: 'მთავარი გასაყიდი კადრი',
    postBody:
      'სრული ფოტო ყოველთვის ჩანს; განსხვავებული პროპორციები რბილი ფონით ივსება და მანქანის მნიშვნელოვანი დეტალები აღარ იჭრება.',
    downloadPost: 'Post-ის ჩამოტვირთვა',
    copyTitle: 'ტექსტი სამ ენაზე',
    copyDescription:
      'არავითარი .txt ფაილის ძებნა — აირჩიე ენა, წაიკითხე და ერთი ღილაკით დააკოპირე.',
    paidHeading: 'სუფთა ფაილები შენია',
    upsellHeading: 'მოგწონს? აიღე სრული პაკეტი',
    reelItem: '1× Reel ვიდეო',
    paidConfirmed: 'გადახდა დადასტურებულია',
    downloadPackage: 'სრული ZIP პაკეტის ჩამოტვირთვა',
    generatingClean: 'სუფთა ფაილები ავტომატურად იქმნება',
    oneTimePayment:
      'ერთჯერადი გადახდა. სუფთა ფაილები ამავე გვერდზე ავტომატურად გაიხსნება.',
    paymentSoon: 'გადახდა მალე გააქტიურდება',
    payAndUnlock: 'გადახდა და სრული პაკეტის მიღება',
    waitForPreview: 'ჯერ დაელოდე Preview-ს',
    secureTbc: 'უსაფრთხო გადახდა TBC Checkout-ით',
  },
  en: {
    paymentUpdated: 'Payment status updated.',
    paymentChecking:
      'Payment is being verified—the page will update automatically.',
    checkoutFailed: 'Payment could not be started.',
    checkoutLinkMissing: 'The payment link could not be found.',
    checkoutTemporary: 'Payment is temporarily unavailable. Please try again.',
    home: '/en',
    studio: 'Private content studio',
    cleanFiles: 'Clean files',
    previewMode: 'Preview mode',
    resultDesk: 'Result desk',
    heading: 'Your content kit',
    visualAssets: (count: number) =>
      `${count} visual asset${count === 1 ? '' : 's'}`,
    ready: 'Your complete kit is ready',
    previewReady: 'Your preview is ready',
    retrying: 'We are retrying the processing',
    generating: 'AutoPost is preparing your content',
    autoRefresh: 'This page updates automatically',
    sectionNav: 'Result sections',
    reelTitle: 'Reel video',
    reelDescription:
      'Watch the complete 9:16 video here: full vehicle frames, smooth motion, and a mobile-ready format.',
    motionTitle: 'See it in motion',
    motionDescription:
      'Use Play to review the complete video. Open the larger viewer for full-screen playback or use the separate download link to save it.',
    enlarge: 'Open larger viewer',
    downloadVideo: 'Download video',
    storiesDescription:
      'Three vertical Stories in one swipeable set. Open any frame to view the complete image without cropping.',
    carouselTitle: 'Carousel posts',
    carouselDescription:
      'Six sequential square slides in one horizontal gallery, keeping the page compact and the full series easy to review.',
    postDescription:
      'Your main square feed listing with one clear vehicle image, price, and contact information.',
    postOpen: 'Open Instagram Post in larger viewer',
    postTitle: 'Your main sales image',
    postBody:
      'The complete source photo remains visible. Different proportions use a soft background so important vehicle details are not cropped.',
    downloadPost: 'Download post',
    copyTitle: 'Sales copy in three languages',
    copyDescription:
      'No text-file download required. Choose a language, review the caption, and copy it with one button.',
    paidHeading: 'Your clean files are ready',
    upsellHeading: 'Like the preview? Unlock the complete kit',
    reelItem: '1× Reel video',
    paidConfirmed: 'Payment confirmed',
    downloadPackage: 'Download complete ZIP package',
    generatingClean: 'Clean files are being generated automatically',
    oneTimePayment:
      'One-time payment. The clean files unlock automatically on this page.',
    paymentSoon: 'Payment will be available soon',
    payAndUnlock: 'Pay and unlock the complete kit',
    waitForPreview: 'Wait for the preview first',
    secureTbc: 'Secure payment through TBC Checkout',
  },
} as const

export function getResultCopy(locale: AppLocale) {
  return resultCopy[locale]
}
