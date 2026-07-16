import { describe, expect, it } from 'vitest'

import {
  buildDeliveryMessage,
  buildWhatsAppUrl,
  isNormalizedGeorgianMobile,
  isValidDeliveryUrl,
} from '@/lib/admin/whatsapp'

describe('WhatsApp delivery workflow', () => {
  it('builds the exact Georgian message with the model and Drive URL', () => {
    expect(
      buildDeliveryMessage(
        'BMW 330i',
        'https://drive.google.com/drive/folders/example',
      ),
    ).toBe(
      'გამარჯობა! თქვენი BMW 330i-ს Preview მზადაა 👇\n' +
        'https://drive.google.com/drive/folders/example\n\n' +
        'თუ მოგეწონებათ, სრულ პაკეტს watermark-ის გარეშე გამოგიგზავნით — ფასი 14.90₾.\n\n' +
        'კითხვები თუ გაქვთ, აქვე მომწერეთ.',
    )
  })

  it('encodes Georgian text and line breaks in a wa.me URL', () => {
    const message = buildDeliveryMessage('Toyota RAV4', 'https://example.com/p')
    const url = buildWhatsAppUrl('+995555123456', message)
    expect(url).toBe(
      `https://wa.me/995555123456?text=${encodeURIComponent(message)}`,
    )
  })

  it('fails gracefully for a non-normalized phone', () => {
    expect(buildWhatsAppUrl('555 12 34 56', 'გამარჯობა')).toBeNull()
    expect(isNormalizedGeorgianMobile('555 12 34 56')).toBe(false)
  })

  it('accepts only complete http(s) delivery URLs', () => {
    expect(isValidDeliveryUrl('https://drive.google.com/folder')).toBe(true)
    expect(isValidDeliveryUrl('http://localhost:3000/preview')).toBe(true)
    expect(isValidDeliveryUrl('javascript:alert(1)')).toBe(false)
    expect(isValidDeliveryUrl('drive.google.com/folder')).toBe(false)
    expect(isValidDeliveryUrl('')).toBe(false)
  })
})
