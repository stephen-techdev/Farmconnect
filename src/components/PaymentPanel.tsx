import { useEffect, useState } from 'react'
import { toDataURL } from 'qrcode'
import { buildUpiUri, type UpiDetails } from '../lib/upi'

interface Props {
  method: 'cod' | 'upi'
  amount: number
  orderId: string
  codCode?: string | null
  upi: UpiDetails
  onSaveUpiRef?: (ref: string) => void | Promise<void>
  savedUpiRef?: string
}

/**
 * Shown right after an order is placed.
 * COD  -> the 6-digit code the customer presents at pickup.
 * UPI  -> a QR encoding this exact order amount, plus a "Pay with UPI app" link.
 */
export default function PaymentPanel({
  method,
  amount,
  orderId,
  codCode,
  upi,
  onSaveUpiRef,
  savedUpiRef = '',
}: Props) {
  const [qr, setQr] = useState<string>('')
  const [qrError, setQrError] = useState<string>('')
  const [ref, setRef] = useState(savedUpiRef)
  const [saving, setSaving] = useState(false)

  const upiUri = buildUpiUri({
    vpa: upi.vpa,
    payeeName: upi.payeeName,
    amount,
    orderId,
  })

  useEffect(() => {
    if (method !== 'upi' || !upiUri) return
    let cancelled = false
    setQrError('')
    toDataURL(upiUri, { width: 240, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => { if (!cancelled) setQr(url) })
      .catch((err) => {
        if (!cancelled) setQrError(err?.message || 'Could not generate the QR code.')
      })
    return () => { cancelled = true }
  }, [method, upiUri])

  if (method === 'cod') {
    return (
      <div className="card" style={{ padding: 'var(--sp-2)', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>
          <i className="fa-solid fa-money-bill-wave text-primary" /> Cash on Delivery
        </h3>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
          Pay <strong>₹{amount.toFixed(2)}</strong> in cash when your order arrives.
        </p>

        <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0.75rem 0 0.25rem' }}>
          Show this code at pickup
        </p>
        <div
          style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            letterSpacing: '0.35rem',
            fontFamily: 'ui-monospace, monospace',
            background: 'var(--input-bg)',
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            margin: '0 auto',
            maxWidth: 280,
          }}
        >
          {codCode || '------'}
        </div>
        <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
          The delivery agent will confirm this code before handing over your order.
        </p>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 'var(--sp-2)', textAlign: 'center' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>
        <i className="fa-solid fa-qrcode text-primary" /> Online Payment
      </h3>

      {!upiUri ? (
        <div style={{ padding: 'var(--sp-2)' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.75rem', color: 'var(--accent-600)' }} />
          <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>Online payment is not set up yet</p>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Please choose Cash on Delivery, or contact us to pay another way.
          </p>
        </div>
      ) : (
        <>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Scan to pay <strong>₹{amount.toFixed(2)}</strong>
          </p>

          <div style={{ display: 'inline-block', padding: 10, background: '#fff', borderRadius: 'var(--radius-md)', margin: '0.75rem 0' }}>
            {qr ? (
              <img src={qr} alt={`UPI payment QR for ₹${amount.toFixed(2)}`} width={220} height={220} />
            ) : (
              <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {qrError ? (
                  <span style={{ color: '#dc2626', fontSize: '0.85rem', padding: 12 }}>{qrError}</span>
                ) : (
                  <i className="fa-solid fa-spinner fa-spin" style={{ color: '#64748b' }} />
                )}
              </div>
            )}
          </div>

          <div>
            <a className="btn btn-primary" href={upiUri} style={{ textDecoration: 'none' }}>
              <i className="fa-solid fa-mobile-screen" /> Pay with UPI app
            </a>
          </div>

          <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0.75rem 0 0.25rem' }}>
            Or pay to <strong>{upi.vpa}</strong>
          </p>

          {onSaveUpiRef && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <input
                className="form-input"
                style={{ maxWidth: 220, textAlign: 'center' }}
                placeholder="UPI transaction ID (optional)"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
              <button
                className="btn btn-outline"
                disabled={saving}
                onClick={async () => {
                  setSaving(true)
                  await onSaveUpiRef(ref.trim())
                  setSaving(false)
                }}
              >
                {saving ? <i className="fa-solid fa-spinner fa-spin" /> : 'Submit'}
              </button>
            </div>
          )}
          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.75rem' }}>
            Payments are not verified automatically. We confirm your transfer and update the order shortly.
          </p>
        </>
      )}
    </div>
  )
}