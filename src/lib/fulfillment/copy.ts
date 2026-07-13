import type { CreativeSubmission } from '@/lib/fulfillment/types'

function details(submission: CreativeSubmission, separator: string) {
  return [
    submission.vehicle_year,
    submission.mileage === null
      ? null
      : `${new Intl.NumberFormat('en-US').format(submission.mileage)} km`,
    submission.engine,
    submission.transmission,
    submission.location,
  ]
    .filter(Boolean)
    .join(separator)
}

function price(submission: CreativeSubmission) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(submission.price)} ${submission.price_currency}`
}

export function createMarketingCopy(submission: CreativeSubmission) {
  const vehicle = `${submission.vehicle_year} ${submission.vehicle_model}`
  const facts = details(submission, ' · ')
  const optionalInfo = submission.additional_info?.trim()

  return [
    'AUTOPOST · READY-TO-PUBLISH COPY',
    submission.public_reference,
    '',
    'ქართული',
    `${vehicle} იყიდება. ფასი: ${price(submission)}.`,
    facts,
    optionalInfo || 'დეტალური ინფორმაციისთვის და სანახავად დაგვიკავშირდით.',
    `კონტაქტი: ${submission.phone}`,
    '',
    'English',
    `${vehicle} for sale. Price: ${price(submission)}.`,
    facts,
    optionalInfo || 'Message us for full details and to arrange a viewing.',
    `Contact: ${submission.phone}`,
    '',
    'Русский',
    `${vehicle} продаётся. Цена: ${price(submission)}.`,
    facts,
    optionalInfo ||
      'Напишите нам, чтобы узнать подробности и договориться о просмотре.',
    `Контакт: ${submission.phone}`,
    '',
    '#AutoPost #CarForSale #Georgia',
  ]
    .filter((line) => line !== null)
    .join('\n')
}
