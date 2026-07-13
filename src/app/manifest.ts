import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AutoPost — მანქანის პროფესიონალური რეკლამა',
    short_name: 'AutoPost',
    description:
      'მანქანის ფოტოებიდან Reel, Story, carousel, პოსტი და გაყიდვის ტექსტი სამ ენაზე.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c0b0a',
    theme_color: '#0c0b0a',
    lang: 'ka',
    categories: ['automotive', 'business', 'photo'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
