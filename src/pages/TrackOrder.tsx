import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  customer_name: string
}

export default function TrackOrder() {
  const { showToast } = useToast()
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!orderId) { showToast('Enter an order ID', 'error'); return }
    setLoading(true)
    setOrder(null)
    setItems([])

    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()

    if (error || !data) {
      showToast('Order not found', 'error')
      setLoading(false)
      return
    }

    setOrder(data)
    const { data: itemData } = await supabase.from('order_items').select('*').eq('order_id', orderId)
    setItems(itemData || [])
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    pending: 'badge-amber',
    processing: 'badge-blue',
    shipped: 'badge-blue',
    delivered: 'badge-green',
    cancelled: 'badge-red',
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-2)', paddingBottom: 'var(--sp-4)' }}>
      <div className="section-header">
        <h2><i className="fa-solid fa-truck text-primary" /> Track Your Order</h2>
        <p>Enter your order ID to check the status</p>
      </div>

      <form onSubmit={handleSearch} style={{ maxWidth: 500, margin: '0 auto var(--sp-2)' }}>
        <div className="filter-bar">
          <input
            className="form-input search-input"
            placeholder="Enter Order ID..."
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-magnifying-glass" /> Track</>}
          </button>
        </div>
      </form>

      {order && (
        <div className="card" style={{ padding: 'var(--sp-2)', maxWidth: 600, margin: '0 auto' }}>
          <div className="flex justify-between items-center mb-2">
            <h3 style={{ fontWeight: 700 }}>Order #{order.id.slice(0, 8)}</h3>
            <span className={`badge ${statusColors[order.status] || 'badge-amber'}`}>{order.status}</span>
          </div>
          <p className="text-muted mb-1">Placed on: {new Date(order.created_at).toLocaleDateString()}</p>
          <p className="text-muted mb-2">Customer: {order.customer_name || 'Guest'}</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.product_name}</td>
                    <td>{i.quantity}</td>
                    <td>₹{i.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'right', marginTop: 'var(--sp-1)' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-600)' }}>
              Total: ₹{order.total.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
