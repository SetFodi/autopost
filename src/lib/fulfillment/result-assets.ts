import type { GeneratedAssetKind } from '@/lib/fulfillment/types'

export const RESULT_KIND_LABELS: Record<GeneratedAssetKind, string> = {
  carousel_1: 'Carousel · 1',
  carousel_2: 'Carousel · 2',
  carousel_3: 'Carousel · 3',
  carousel_4: 'Carousel · 4',
  carousel_5: 'Carousel · 5',
  carousel_6: 'Carousel · 6',
  copy: 'Caption · KA / EN / RU',
  package: 'სრული ZIP პაკეტი',
  reel: 'Reel · 9:16',
  square: 'Instagram Post · 1:1',
  story_1: 'Story · 1',
  story_2: 'Story · 2',
  story_3: 'Story · 3',
}

export const REQUIRED_PREVIEW_KINDS: GeneratedAssetKind[] = [
  'square',
  'story_1',
  'story_2',
  'story_3',
  'carousel_1',
  'carousel_2',
  'carousel_3',
  'carousel_4',
  'carousel_5',
  'carousel_6',
  'copy',
  'reel',
]
