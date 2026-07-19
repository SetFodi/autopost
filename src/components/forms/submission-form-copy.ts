import type { AppLocale } from '@/lib/i18n'

const copy = {
  ka: {
    response429:
      'ცოტა ხანში კიდევ სცადე. ამ ნომრიდან ბევრი მოთხოვნა დაფიქსირდა.',
    response413: 'ფოტოების ზომა დასაშვებ ზღვარს აჭარბებს.',
    responseGeneric:
      'განაცხადის გაგზავნა დროებით ვერ მოხერხდა. შეყვანილი ინფორმაცია ფორმაში დარჩა — გთხოვ, ხელახლა სცადო.',
    duplicatePhotos: 'არჩეული ფოტოები უკვე დამატებულია.',
    maxPhotos: (count: number) => `შეგიძლია ატვირთო მაქსიმუმ ${count} ფოტო.`,
    invalidRawPhotos:
      'არჩეული ფოტოებიდან ერთ-ერთის ფორმატი ან ზომა დასაშვები არ არის.',
    invalidPreparedPhotos:
      'ფოტოების მომზადების შემდეგ ზომის ლიმიტი გადაჭარბდა.',
    preparationFailed:
      'ფოტოების უსაფრთხოდ მომზადება ვერ დასრულდა. სცადე თავიდან.',
    invalidPhone: 'შეიყვანე მოქმედი ქართული მობილურის ნომერი.',
    initFailed: 'ატვირთვის სესიის დაწყება ვერ მოხერხდა. გთხოვ, ხელახლა სცადო.',
    photosChanged: 'ფოტოების სია შეიცვალა. გთხოვ, თავიდან სცადო.',
    uploadFailed: 'ატვირთვა ვერ დასრულდა',
    photoRetry: (index: number) =>
      `${index}-ე ფოტო ვერ აიტვირთა. უკვე ატვირთული ფოტოები შენახულია — სცადე ხელახლა.`,
    minPhotos: (count: number) =>
      `Preview-სთვის საჭიროა მინიმუმ ${count} ფოტო.`,
    reviewFields: 'შეამოწმე მონიშნული ველები და ხელახლა სცადე.',
    freeNoCard: 'უფასო · ბარათის გარეშე',
    formTitle: 'გამოგვიგზავნე მანქანა',
    sellerLegend: 'თქვენ ვინ ხართ?',
    privateSeller: 'პირადი გამყიდველი',
    dealer: 'ავტოდილერი',
    phone: 'ტელეფონი ან WhatsApp',
    name: 'სახელი',
    optional: 'არასავალდებულო',
    namePlaceholder: 'მაგ. ნიკა',
    makeModel: 'ავტომობილის მარკა და მოდელი',
    year: 'გამოშვების წელი',
    price: 'ფასი',
    currency: 'ვალუტა',
    additional: 'დამატებითი ინფორმაცია',
    mileage: 'გარბენი',
    engine: 'ძრავი',
    transmission: 'ტრანსმისია',
    choose: 'აირჩიე',
    automatic: 'ავტომატიკა',
    manual: 'მექანიკა',
    cvt: 'ვარიატორი',
    robot: 'რობოტი',
    location: 'მდებარეობა',
    locationPlaceholder: 'მაგ. თბილისი',
    detailsPlaceholder:
      'კომპლექტაცია, მდგომარეობა ან სხვა მნიშვნელოვანი დეტალი',
    website: 'ვებსაიტი',
    consent:
      'ვეთანხმები, რომ ატვირთული მასალა გამოყენებული იქნება მხოლოდ ჩემი Preview-ს მოსამზადებლად და საჯაროდ არ გამოქვეყნდება ჩემი თანხმობის გარეშე.',
    preparing: 'ფოტოები მზადდება…',
    initializing: 'უსაფრთხო ატვირთვა იწყება…',
    completing: 'განაცხადი სრულდება…',
    uploading: (done: number, total: number) => `იტვირთება ${done} / ${total}`,
    errorTitle: 'ატვირთვა ვერ დასრულდა',
    submit: 'მიიღე უფასო Preview',
    secure: 'ფოტოები დაცულად იტვირთება და საჯაროდ არ ჩანს.',
  },
  en: {
    response429: 'Please try again shortly. Too many requests were received.',
    response413: 'The photos exceed the allowed upload size.',
    responseGeneric:
      'We could not send your request right now. Your information is still in the form—please try again.',
    duplicatePhotos: 'Those photos have already been added.',
    maxPhotos: (count: number) => `You can upload up to ${count} photos.`,
    invalidRawPhotos:
      'One or more photos use an unsupported format or exceed the size limit.',
    invalidPreparedPhotos: 'The prepared photos exceed the total upload limit.',
    preparationFailed:
      'We could not safely prepare those photos. Please try again.',
    invalidPhone: 'Enter a valid Georgian mobile number.',
    initFailed: 'We could not start the secure upload. Please try again.',
    photosChanged: 'The photo list changed. Please start again.',
    uploadFailed: 'Upload failed',
    photoRetry: (index: number) =>
      `Photo ${index} could not be uploaded. Your completed uploads were saved—please retry.`,
    minPhotos: (count: number) =>
      `At least ${count} photos are required for a preview.`,
    reviewFields: 'Review the highlighted fields and try again.',
    freeNoCard: 'FREE · NO CARD REQUIRED',
    formTitle: 'Send us your car',
    sellerLegend: 'Who are you?',
    privateSeller: 'Private seller',
    dealer: 'Car dealer',
    phone: 'Phone or WhatsApp',
    name: 'Name',
    optional: 'optional',
    namePlaceholder: 'e.g. Alex',
    makeModel: 'Vehicle make and model',
    year: 'Model year',
    price: 'Price',
    currency: 'Currency',
    additional: 'Additional information',
    mileage: 'Mileage',
    engine: 'Engine',
    transmission: 'Transmission',
    choose: 'Choose',
    automatic: 'Automatic',
    manual: 'Manual',
    cvt: 'CVT',
    robot: 'Automated manual',
    location: 'Location',
    locationPlaceholder: 'e.g. Tbilisi',
    detailsPlaceholder: 'Trim, condition, or any other important details',
    website: 'Website',
    consent:
      'I agree that my uploaded material will only be used to prepare my preview and will not be published without my consent.',
    preparing: 'Preparing photos…',
    initializing: 'Starting secure upload…',
    completing: 'Completing your request…',
    uploading: (done: number, total: number) => `Uploading ${done} / ${total}`,
    errorTitle: 'Upload could not be completed',
    submit: 'Get a free preview',
    secure: 'Photos are uploaded securely and remain private.',
  },
} as const

export function getSubmissionFormCopy(locale: AppLocale) {
  return copy[locale]
}
