const GEORGIAN_MOBILE_PATTERN = /^\+9955\d{8}$/

export function isNormalizedGeorgianMobile(phone: string) {
  return GEORGIAN_MOBILE_PATTERN.test(phone)
}

export function isValidDeliveryUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false

  try {
    const url = new URL(trimmed)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function buildDeliveryMessage(
  vehicleModel: string,
  deliveryUrl: string,
) {
  const model = vehicleModel.trim() || 'ავტომობილი'
  const link = deliveryUrl.trim() || '[Drive link]'

  return `გამარჯობა! თქვენი ${model}-ს Preview მზადაა 👇 ${link}\n\nთუ მოგეწონებათ, სრულ პაკეტს watermark-ის გარეშე გამოგიგზავნით — ფასი 14.90₾.\n\nკითხვები თუ გაქვთ, აქვე მომწერეთ.`
}

export function buildWhatsAppUrl(phone: string, message: string) {
  if (!isNormalizedGeorgianMobile(phone)) return null

  return `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(message)}`
}
