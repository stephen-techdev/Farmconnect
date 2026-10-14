import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'
import { useToast } from '../../context/ToastContext'
import PaymentPanel from '../../components/PaymentPanel'
import { isValidVpa } from '../../lib/upi'

const navItems = [
  { to: '/admin', icon: 'fa-gauge-high', label: 'Dashboard' },
  { to: '/admin/products', icon: 'fa-box', label: 'Products' },
  { to: '/admin/categories', icon: 'fa-tags', label: 'Categories' },
  { to: '/admin/orders', icon: 'fa-clipboard-list', label: 'Orders' },
  { to: '/admin/customers', icon: 'fa-users', label: 'Customers' },
  { to: '/admin/payments', icon: 'fa-indian-rupee-sign', label: 'Payments' },
  { to: '/admin/reports', icon: 'fa-chart-line', label: 'Reports' },
  { to: '/admin/settings', icon: 'fa-gear', label: 'Settings' },
]

export default function AdminPayments() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [schemaError, setSchemaError] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const vpa = settings.upi_id || ''
  const payeeName = settings.upi_payee_name || 'FarmConnect'
  const vpaValid = isValidVpa(vpa)

  useEffect(() => {
    async function load() {
      const [settingsRes, ordersRes] = await Promise.all([
        supabase.from('settings').select('*'),
        supabase
          .from('orders')
          .select('*')
          .not('payment_method', 'is', null)
          .order('created_at', { ascending: false }),
      ])

      const map: Record<string, string> = {}
      ;(settingsRes.data || []).forEach((s: any) => { map[s.key] = s.value })
      setSettings(map)

      // 42703 = the payment columns exist in the app but not in the database yet.
      if (ordersRes.error) {
        setSchemaError(ordersRes.error.message)
      } else {
        setOrders(ordersRes.data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (vpa && !vpaValid) {
      showToast('That UPI ID does not look valid. Example: name@bank', 'error')
      return
    }
    setSaving(true)
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        supabase
          .from('settings')
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' }),
      ),
    )
    setSaving(false)
    showToast('Payment settings saved!')
  }

  /** Confirm a payment: marks the order paid and stamps the time. */
  async function markPaid(order: any) {
    setBusyId(order.id)
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        paid_at: now,
        cod_confirmed_at: order.payment_method === 'cod' ? now : null,
      })
      .eq('id', order.id)

    if (!error) {
      await supabase
        .from('payments')
        .update({ status: 'paid' })
        .eq('order_id', order.id)
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, payment_status: 'paid', paid_at: now, cod_confirmed_at: order.payment_method === 'cod' ? now : null }
            : o,
        ),
      )
      showToast(
        order.payment_method === 'cod'
          ? `COD code ${order.cod_code} confirmed`
          : 'Payment confirmed',
      )
    } else {
      showToast(`Could not update: ${error.message}`, 'error')
    }
    setBusyId(null)
  }

  async function markFailed(order: any) {
    setBusyId(order.id)
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('id', order.id)
    if (!error) {
      await supabase.from('payments').update({ status: 'failed' }).eq('order_id', order.id)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, payment_status: 'failed' } : o)))
      showToast('Marked as not received')
    } else {
      showToast(`Could not update: ${error.message}`, 'error')
    }
    setBusyId(null)
  }

  const pending = orders.filter((o) => o.payment_status === 'pending')
  const codPending = pending.filter((o) => o.payment_method === 'cod')
  const upiPending = pending.filter((o) => o.payment_method === 'upi')
  const settled = orders.filter((o) => o.payment_status !== 'pending')

  const collected = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total || 0), 0)

  return (
    <AdminLayout navItems={navItems} title="Payments">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', alignItems: 'start', marginBottom: 'var(--sp-2)' }}>
        <div className="card" style={{ padding: 'var(--sp-2)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
            <i className="fa-solid fa-qrcode text-primary" /> UPI / Online Payment QR
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 'var(--sp-1)' }}>
            Enter your UPI ID. Every customer sees a QR generated for their own order amount,
            so they cannot pay the wrong sum.
          </p>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">UPI ID (VPA)</label>
              <input
                className="form-input"
                placeholder="yourname@okicicibank"
                value={vpa}
                onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
              />
              {vpa && !vpaValid && (
                <p className="form-error">Looks invalid. Expected format: name@bank</p>
              )}
              {vpaValid && <p className="text-muted" style={{ fontSize: '0.78rem' }}>Valid UPI ID.</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Payee Name</label>
              <input
                className="form-input"
                placeholder="FarmConnect"
                value={payeeName}
                onChange={(e) => setSettings({ ...settings, upi_payee_name: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-save" /> Save Payment Details</>}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: 'var(--sp-2)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-1)' }}>QR Preview</h3>
          <PaymentPanel method="upi" amount={100} orderId="PREVIEW" upi={{ vpa, payeeName }} />
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--sp-1)', marginBottom: 'var(--sp-2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--sp-1)', padding: 'var(--sp-1)' }}>
          <div className="stat-card"><span className="stat-label">Collected</span><span className="stat-value">₹{collected.toFixed(2)}</span></div>
          <div className="stat-card"><span className="stat-label">COD to confirm</span><span className="stat-value">{codPending.length}</span></div>
          <div className="stat-card"><span className="stat-label">UPI to verify</span><span className="stat-value">{upiPending.length}</span></div>
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : schemaError ? (
        <div className="card" style={{ padding: 'var(--sp-3)' }}>
          <div className="empty-state">
            <i className="fa-solid fa-database" />
            <h3>Payment columns not applied yet</h3>
            <p style={{ maxWidth: 520, margin: '0 auto' }}>
              Run <code>supabase/migrations/20260729094500_016_payment_methods.sql</code> to add
              the payment columns this section reads.
            </p>
            <p className="form-error" style={{ marginTop: '0.75rem' }}>{schemaError}</p>
          </div>
        </div>
      ) : (
        <>
          {codPending.length > 0 && (
            <div className="card" style={{ padding: 'var(--sp-1)', marginBottom: 'var(--sp-2)' }}>
              <h3 style={{ fontWeight: 700, padding: 'var(--sp-1)' }}>
                <i className="fa-solid fa-money-bill-wave text-primary" /> Cash on Delivery - codes to confirm
              </h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Code</th><th>Customer</th><th>Amount</th><th>Placed</th><th>Actions</th></tr></thead>
                  <tbody>
                    {codPending.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: '0.1rem' }}>
                          {o.cod_code || '------'}
                        </td>
                        <td>{o.customer_name || o.customer_email || 'N/A'}</td>
                        <td>₹{Number(o.total || 0).toFixed(2)}</td>
                        <td>{o.created_at ? new Date(o.created_at).toLocaleString() : 'N/A'}</td>
                        <td>
                          <button className="btn btn-sm btn-primary" disabled={busyId === o.id} onClick={() => markPaid(o)}>
                            {busyId === o.id ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />} Confirm &amp; Paid
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {upiPending.length > 0 && (
            <div className="card" style={{ padding: 'var(--sp-1)', marginBottom: 'var(--sp-2)' }}>
              <h3 style={{ fontWeight: 700, padding: 'var(--sp-1)' }}>
                <i className="fa-solid fa-mobile-screen text-primary" /> Online payments to verify
              </h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>UPI Ref</th><th>Placed</th><th>Actions</th></tr></thead>
                  <tbody>
                    {upiPending.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontSize: '0.8rem' }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                        <td>{o.customer_name || o.customer_email || 'N/A'}</td>
                        <td>₹{Number(o.total || 0).toFixed(2)}</td>
                        <td>{o.upi_ref || <span className="text-muted">not supplied</span>}</td>
                        <td>{o.created_at ? new Date(o.created_at).toLocaleString() : 'N/A'}</td>
                        <td>
                          <button className="btn btn-sm btn-primary" disabled={busyId === o.id} onClick={() => markPaid(o)}>
                            {busyId === o.id ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />} Received
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ marginLeft: '0.375rem' }}
                            disabled={busyId === o.id}
                            onClick={() => markFailed(o)}
                          >
                            Not received
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 'var(--sp-1)' }}>
            <h3 style={{ fontWeight: 700, padding: 'var(--sp-1)' }}>
              <i className="fa-solid fa-clock-rotate-left text-primary" /> Payment history
            </h3>
            {settled.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--sp-2)' }}>
                <i className="fa-solid fa-receipt" /><h3>No settled payments yet</h3>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Order</th><th>Customer</th><th>Method</th><th>Amount</th><th>Status</th><th>Paid</th></tr></thead>
                  <tbody>
                    {settled.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontSize: '0.8rem' }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                        <td>{o.customer_name || o.customer_email || 'N/A'}</td>
                        <td>{o.payment_method === 'cod' ? 'COD' : 'UPI'}</td>
                        <td>₹{Number(o.total || 0).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${o.payment_status === 'paid' ? 'badge-green' : 'badge-red'}`}>
                            {o.payment_status}
                          </span>
                        </td>
                        <td>{o.paid_at ? new Date(o.paid_at).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}