import { describe, expect, it } from 'vitest'

import { formatVehiclePrice } from '@/lib/admin/format'

describe('vehicle price formatting', () => {
  it('keeps GEL and USD vehicle prices explicit', () => {
    expect(formatVehiclePrice(24_900, 'GEL')).toMatch(/24[\s,.]?900 GEL/)
    expect(formatVehiclePrice(24_900, 'USD')).toMatch(/24[\s,.]?900 USD/)
  })
})
