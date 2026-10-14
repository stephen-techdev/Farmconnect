/**
 * UPI payment helpers.
 *
 * Builds the standard NPCI UPI intent URI. Scanning this with any UPI app
 * (GPay, PhonePe, Paytm, BHIM) opens a pre-filled payment screen.
 *
 * Format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>&tr=<ref>
 *
 * Note: there is no gateway here, so nothing is auto-verified. The customer
 * pays in their own UPI app and the store confirms receipt in the admin panel.
 */

export interface UpiDetails {
  /** Virtual Payment Address, e.g. farmconnect@okhdfcbank */
  vpa: string
  /** Payee name shown in the UPI app */
  payeeName: string
}

export function isValidVpa(vpa: string): boolean {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$/.test(vpa.trim())
}

/**
 * Build the UPI intent URI for an order.
 * Returns null when the VPA is missing or malformed, so callers can show a
 * "payment not configured" state instead of an unusable QR.
 */
export function buildUpiUri(opts: {
  vpa: string
  payeeName: string
  amount: number
  orderId?: string
  note?: string
}): string | null {
  const vpa = opts.vpa?.trim() ?? ''
  if (!isValidVpa(vpa)) return null

  // UPI apps are more reliable when the VPA's "@" stays literal, so encode
  // manually rather than via URLSearchParams (which turns it into %40).
  const enc = (v: string) => encodeURIComponent(v).replace(/%40/g, '@')

  const payeeName = (opts.payeeName?.trim() || 'FarmConnect').slice(0, 50)
  const parts = [`pa=${enc(vpa)}`, `pn=${enc(payeeName)}`, 'cu=INR']

  // UPI apps reject amounts with more than 2 decimals.
  const amount = Number(opts.amount)
  if (Number.isFinite(amount) && amount > 0) {
    parts.push(`am=${amount.toFixed(2)}`)
  }
  if (opts.orderId) parts.push(`tr=${enc(opts.orderId.slice(0, 40))}`)
  parts.push(`tn=${enc((opts.note || `FarmConnect order ${opts.orderId ?? ''}`).slice(0, 50))}`)

  return `upi://pay?${parts.join('&')}`
}

/** Random 6-digit code for a Cash on Delivery handover. */
export function generateCodCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return String(n).padStart(6, '0')
}