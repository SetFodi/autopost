import { describe, expect, it } from 'vitest'

import { parseResultCopy } from '@/lib/fulfillment/result-copy'

describe('parseResultCopy', () => {
  it('separates publish-ready copy into three language tabs', () => {
    const result = parseResultCopy(`AUTOPOST · READY-TO-PUBLISH COPY
AP-TEST

ქართული
ქართული ტექსტი
კონტაქტი: +995555123456

English
English copy
Contact: +995555123456

Русский
Русский текст
Контакт: +995555123456

#AutoPost #CarForSale #Georgia`)

    expect(result.map((item) => item.id)).toEqual(['ka', 'en', 'ru'])
    expect(result[0]?.text).toContain('ქართული ტექსტი')
    expect(result[1]?.text).toContain('English copy')
    expect(result[2]?.text).toContain('Русский текст')
    expect(result.every((item) => item.text.includes('#AutoPost'))).toBe(true)
  })

  it('keeps unstructured copy available as a single copyable block', () => {
    expect(parseResultCopy('Custom seller caption')).toEqual([
      {
        id: 'all',
        label: 'ყველა ტექსტი',
        shortLabel: 'ALL',
        text: 'Custom seller caption',
      },
    ])
  })
})
