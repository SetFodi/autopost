export type ResultCopyLanguage = {
  id: 'ka' | 'en' | 'ru' | 'all'
  label: string
  shortLabel: string
  text: string
}

const LANGUAGE_MARKERS = [
  { id: 'ka' as const, label: 'ქართული', shortLabel: 'KA' },
  { id: 'en' as const, label: 'English', shortLabel: 'EN' },
  { id: 'ru' as const, label: 'Русский', shortLabel: 'RU' },
]

function cleanLines(lines: string[]) {
  return lines.join('\n').trim()
}

export function parseResultCopy(value: string): ResultCopyLanguage[] {
  const text = value.trim()
  if (!text) return []

  const lines = text.split(/\r?\n/)
  const markerIndexes = LANGUAGE_MARKERS.map(({ label }) =>
    lines.findIndex((line) => line.trim() === label),
  )

  if (markerIndexes.some((index) => index < 0)) {
    return [
      {
        id: 'all',
        label: 'ყველა ტექსტი',
        shortLabel: 'ALL',
        text,
      },
    ]
  }

  const hashtags = lines.filter((line) => line.trim().startsWith('#')).join(' ')

  return LANGUAGE_MARKERS.map((language, index) => {
    const start = markerIndexes[index]! + 1
    const end = markerIndexes[index + 1] ?? lines.length
    const body = cleanLines(
      lines.slice(start, end).filter((line) => !line.trim().startsWith('#')),
    )

    return {
      ...language,
      text: hashtags ? `${body}\n\n${hashtags}` : body,
    }
  })
}
