import { useEffect, useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { toDataURL } from 'qrcode'
import { buildUpiUri } from '../lib/upi'

export interface PaymentState {
  orderId: string
  total: number
  method: 'cod' | 'upi'
  code: string
  upiId: string
  payeeName: string
}

/**
 * Post-checkout payment page.
 *
 * The 6-digit code is generated in the browser and carried in router state,
 * so this screen works without any extra database columns. The UPI QR encodes
 * this exact order amount.
 */
export default function Payment() {
  const location = useLocation()
  const state = location.state as PaymentState | null
  const [qr, setQr] = useState('')
  const [qrError, setQrError] = useState('')

  const upiUri = state
    ? buildUpiUri({
        vpa: state.upiId,
        payeeName: state.payeeName,
        amount: state.total,
        orderId: state.orderId,
      })
    : null

  useEffect(() => {
    if (!upiUri) return
    let cancelled = false
    toDataURL(upiUri, { width: 260, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => { if (!cancelled) setQr(url) })
      .catch((e) => { if (!cancelled) setQrError(e?.message || 'Could not generate the QR code.') })
    return () => { cancelled = true }
  }, [upiUri])

  // Direct navigation / refresh with no router state.
  if (!state) return <Navigate to="/" replace />

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-3)', paddingBottom: 'var(--sp-4)', maxWidth: 560 }}>
      <div className="section-header">
        <h2><i className="fa-solid fa-circle-check text-primary" /> Order Confirmed</h2>
        <p>Order #{state.orderId.slice(0, 8).toUpperCase()} &middot; ₹{state.total.toFixed(2)}</p>
      </div>

      <div className="card" style={{ padding: 'var(--sp-2)', textAlign: 'center', marginBottom: 'var(--sp-2)' }}>
        <h3 style={{ marginBottom: '0.25rem' }}>Your Verification Code</h3>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          Keep this code. Show it at pickup or when paying.
        </p>
        <div
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            letterSpacing: '0.4rem',
            fontFamily: 'ui-monospace, monospace',
            color: 'var(--primary-600)',
            background: 'var(--input-bg)',
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            margin: '0.75rem auto',
            maxWidth: 300,
          }}
        >
          {state.code}
        </div>
      </div>

      {state.method === 'cod' ? (
        <div className="card" style={{ padding: 'var(--sp-2)', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>
            <i className="fa-solid fa-money-bill-wave text-primary" /> Cash on Delivery
          </h3>
          <p style={{ fontSize: '0.95rem' }}>
            Pay <strong>₹{state.total.toFixed(2)}</strong> in cash when your order arrives.
          </p>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            The delivery agent confirms your code before handing over the order.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--sp-2)', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>
            <i className="fa-solid fa-qrcode text-primary" /> Pay Online
          </h3>

          {!upiUri ? (
            <>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.75rem', color: 'var(--accent-600)' }} />
              <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>Online payment is not set up yet</p>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Please contact us to arrange payment.
              </p>
            </>
          ) : (
            <>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                Scan the QR to pay <strong>₹{state.total.toFixed(2)}</strong>
              </p>

              {/* White backdrop keeps the QR high-contrast and scannable in dark mode. */}
              <div
                style={{
                  display: 'inline-block',
                  padding: 12,
                  background: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  margin: '0.75rem 0',
                }}
              >
                {qr ? (
                  <img
                    src={qr}
                    alt={`UPI payment QR for order ${state.orderId}`}
                    width={230}
                    height={230}
                    style={{ display: 'block' }}
                  />
                ) : (
                  <div style={{ width: 230, height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    {qrError ? (
                      <span style={{ color: '#dc2626', fontSize: '0.85rem', padding: 12 }}>{qrError}</span>
                    ) : (
                      <i className="fa-solid fa-spinner fa-spin" />
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <a className="btn btn-primary" href={upiUri} style={{ textDecoration: 'none' }}>
                  <i className="fa-solid fa-mobile-screen" /> Pay with UPI App
                </a>
              </div>

              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'var(--input-bg)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>UPI ID</p>
                <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '1rem', fontWeight: 700, wordBreak: 'break-all', margin: 0 }}>
                  {state.upiId}
                </p>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '0.6rem' }}
                  onClick={() => navigator.clipboard?.writeText(state.upiId)}
                >
                  <i className="fa-regular fa-copy" /> Copy UPI ID
                </button>
              </div>

              <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.9rem' }}>
                Payments are not verified automatically. We confirm your transfer shortly.
              </p>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
          Continue Shopping
        </Link>
        <Link to="/track-order" className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>
          <i className="fa-solid fa-truck" /> Track Order
        </Link>
      </div>
    </div>
  )
}