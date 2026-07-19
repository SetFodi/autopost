import type { MarketingGuide } from '@/lib/marketing/content'

export const frequentlyAskedQuestionsEn = [
  {
    question: 'How many photos should I upload?',
    answer:
      'You can upload a minimum of 3 and a maximum of 15 photos for your preview. For a stronger complete package, use 6–10 clear photos from different angles, including at least one interior photo.',
  },
  {
    question: 'Is the first preview really free?',
    answer:
      'Yes. Your first watermarked preview is free and no card is required. You only pay if you like the result and want the complete package without the watermark.',
  },
  {
    question: 'How long does processing take?',
    answer:
      'Processing starts automatically after upload and the preview appears on your private results page. Complex, incomplete, or low-quality material may require more time or better photos.',
  },
  {
    question: 'Does AutoPost publish the listing for me?',
    answer:
      'No. AutoPost prepares a Reel, Stories, carousel, square listing post, and sales copy. You download the finished files and decide where and when to publish them.',
  },
  {
    question: 'What is included in the complete package?',
    answer:
      'The complete package includes one vertical Reel, 3 Stories, a 6-slide carousel, one square listing post, and ready-to-use sales copy in Georgian, English, and Russian.',
  },
  {
    question: 'Will my photos become public?',
    answer:
      'No. Uploaded photos and private results pages are not indexed by search engines. We only use customer material in public examples with separate permission or an appropriate demo license.',
  },
  {
    question: 'Can I use photos taken on my phone?',
    answer:
      'Yes. AutoPost is designed for ordinary phone photos. Clear, well-lit images from several angles produce the strongest and most complete result.',
  },
  {
    question: 'Which vehicles does AutoPost support?',
    answer:
      'AutoPost works with any make and vehicle type, including sedans, SUVs, hatchbacks, sports cars, electric vehicles, vans, and commercial vehicles.',
  },
  {
    question: 'Can I correct the price or phone number?',
    answer:
      'If you notice a mistake, message us on WhatsApp and include your public submission reference. We can verify the details before the final package is generated.',
  },
] as const

export const marketingGuidesEn: readonly MarketingGuide[] = [
  {
    slug: 'how-to-sell-a-car-faster',
    eyebrow: 'A practical car-selling plan',
    title: 'How to sell a car faster: 8 practical steps',
    description:
      'From realistic pricing and better photos to clear replies: a practical plan for creating a more convincing car listing.',
    readingMinutes: 7,
    intro:
      'Selling faster does not mean hiding faults or accepting the first low offer. It means removing uncertainty for a serious buyer: use a realistic price, show the vehicle clearly, provide accurate details, and make the next step easy.',
    sections: [
      {
        heading: '1. Start with a realistic market price',
        paragraphs: [
          'Compare vehicles with the same model year, engine, mileage, trim, and condition. Do not anchor your price to the most expensive listing; look at the realistic middle of the market.',
          'If your price is higher, explain why with concrete value such as a documented service history, recent maintenance, new tires, a rare trim, or important factory options.',
        ],
      },
      {
        heading: '2. Make the first photo answer the main question',
        paragraphs: [
          'A buyer should immediately understand what vehicle is for sale and its apparent condition. A clean front three-quarter angle usually works best because it shows the full car and gives the listing a clear focal point.',
        ],
        bullets: [
          'Keep the entire vehicle inside the frame.',
          'Choose a background that does not hide the silhouette.',
          'Avoid shooting directly into strong sunlight.',
          'Remove unrelated people and distracting objects from the frame.',
        ],
      },
      {
        heading: '3. Show the complete vehicle, not only its best angle',
        paragraphs: [
          'A trustworthy listing includes the front, rear, both sides, interior, dashboard, trunk, wheels, and important details. Clearly showing known imperfections reduces wasted calls and unpleasant surprises during inspection.',
        ],
      },
      {
        heading: '4. Write a specific listing title',
        paragraphs: [
          'Combine the make, model, year, and one meaningful differentiator. “2021 Toyota RAV4 Hybrid — full service history” tells the buyer more than a vague emotional headline.',
        ],
      },
      {
        heading: '5. Structure the description around buyer questions',
        paragraphs: [
          'Start with core specifications, then describe condition and maintenance history, and finish with the sale terms and contact method. Short sections are easier to scan on a phone.',
        ],
        bullets: [
          'Year, engine, transmission, and mileage.',
          'Condition and most recent maintenance.',
          'The most valuable trim and equipment highlights.',
          'Price, location, and the best time to contact you.',
        ],
      },
      {
        heading: '6. Keep every platform consistent',
        paragraphs: [
          'A different price on Facebook and MyAuto quickly damages trust. Update every channel together and use one primary contact number across the listing, images, and caption.',
        ],
      },
      {
        heading: '7. Reply quickly and precisely',
        paragraphs: [
          'A buyer is often comparing several similar cars. A concise answer and a specific inspection time make it easier to move from browsing to a real appointment.',
        ],
      },
      {
        heading: '8. Improve the listing using real buyer behavior',
        paragraphs: [
          'If the listing gets views but no messages, review the price and first photo. If buyers repeat the same question, add the answer to the description. If every conversation starts with a discount request, explain the vehicle’s value more clearly.',
        ],
        note: 'AutoPost prepares the visual package and three-language sales copy automatically, but accurate vehicle information and a realistic price always remain the seller’s responsibility.',
      },
    ],
  },
  {
    slug: 'how-to-take-car-photos-for-sale',
    eyebrow: 'A practical photo checklist',
    title: 'How to take better car photos for a sale listing',
    description:
      'Angles, lighting, interior shots, and details: a simple phone-photography checklist for a stronger vehicle listing.',
    readingMinutes: 6,
    intro:
      'You do not need an expensive camera. A clean vehicle, soft light, and a consistent sequence of angles matter far more. This checklist helps buyers understand the car clearly and trust what they see.',
    sections: [
      {
        heading: 'Prepare the car and location',
        paragraphs: [
          'Wash the vehicle, clean the interior, and remove personal items. Choose a safe, quiet location with a simple background. An open parking area works better than a crowded yard.',
        ],
      },
      {
        heading: 'Photograph in soft light',
        paragraphs: [
          'Morning, late afternoon, or an overcast day reduces harsh shadows and glare. Strong midday sun often hides interior details and creates distracting reflections on the paint.',
        ],
      },
      {
        heading: 'Capture the essential exterior angles',
        paragraphs: [
          'Keep the camera around vehicle height and leave a little space around the car. Walk closer instead of using digital zoom, which can reduce image quality.',
        ],
        bullets: [
          'Front three-quarter view for the main photo.',
          'Rear three-quarter view.',
          'Straight front and straight rear views.',
          'Driver and passenger sides.',
          'Wheels, tires, lights, and important exterior details.',
        ],
      },
      {
        heading: 'Photograph the interior clearly',
        paragraphs: [
          'Open the door and frame the steering wheel, dashboard, and center console together. Clean the screens and dashboard. Turn the car on only if you want the mileage and indicators to be visible.',
        ],
        bullets: [
          'Front seats and dashboard.',
          'Rear seats.',
          'Mileage and central display.',
          'Trunk or cargo space.',
          'Notable features and trim details.',
        ],
      },
      {
        heading: 'Show known imperfections',
        paragraphs: [
          'A clear photo of a scratch or damaged area builds trust and reduces surprises. Take one wider photo for context and one close photo so the scale is easy to understand.',
        ],
      },
      {
        heading: 'Review every image before uploading',
        paragraphs: [
          'Open each photo full-screen. Retake any image where the vehicle is accidentally cropped, the focus is soft, or glare hides an important detail.',
        ],
        note: 'AutoPost requires at least 3 photos, but 6–10 varied, sharp images produce a more complete Story and carousel package.',
      },
    ],
  },
  {
    slug: 'how-to-write-a-car-listing',
    eyebrow: 'Description structure and examples',
    title: 'How to write a car listing that buyers trust',
    description:
      'What to include, what to remove, and how to structure a vehicle description so buyers find answers quickly.',
    readingMinutes: 6,
    intro:
      'A good car listing is neither a one-line claim nor an endless history. Its job is to answer the important questions early, establish trust, and attract the right buyer before an inspection.',
    sections: [
      {
        heading: 'Use the first two sentences well',
        paragraphs: [
          'Begin with what is for sale, its condition, and the main reason it deserves attention. For example: “2021 Toyota RAV4 Hybrid with a documented service history. The vehicle is mechanically sound and used daily.”',
        ],
      },
      {
        heading: 'Separate the core specifications',
        paragraphs: [
          'Technical details are easier to read as a short list. Include only information you know is accurate and verify every number before publishing.',
        ],
        bullets: [
          'Exact model and model year.',
          'Engine and fuel type.',
          'Transmission and drivetrain.',
          'Mileage.',
          'Location and price.',
        ],
      },
      {
        heading: 'Explain condition and maintenance history',
        paragraphs: [
          '“Perfect condition” is weak without evidence. Recent service work, replaced parts, tire condition, and documented history are more useful and believable.',
        ],
      },
      {
        heading: 'Highlight only meaningful equipment',
        paragraphs: [
          'Do not list every button. Focus on equipment buyers care about for this model: safety systems, cameras, heated seats, adaptive cruise control, a panoramic roof, or premium audio.',
        ],
      },
      {
        heading: 'Avoid language that reduces trust',
        paragraphs: [
          'Excessive capital letters, repeated exclamation marks, and unsupported promises make a listing feel less credible. Do not hide known faults; accurate disclosure reduces wasted calls and inspections.',
        ],
        bullets: [
          '“URGENT!!!” without useful context.',
          'Equipment copied from a different vehicle.',
          'Missing price or location.',
          'Vague claims about mechanical condition.',
        ],
      },
      {
        heading: 'Finish with a clear next step',
        paragraphs: [
          'State where the car can be viewed, how buyers should contact you, and when you reply. For example: “Available to view in Tbilisi by appointment. Message on WhatsApp or call between 10:00 and 20:00.”',
        ],
        note: 'AutoPost turns the same vehicle details into Georgian, English, and Russian sales copy, so you do not need to rewrite the listing by hand.',
      },
    ],
  },
]

export function getMarketingGuideEn(slug: string) {
  return marketingGuidesEn.find((guide) => guide.slug === slug)
}
