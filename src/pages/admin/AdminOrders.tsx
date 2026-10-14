import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'
import { useToast } from '../../context/ToastContext'

const navItems = [
  { to: '/admin', icon: 'fa-gauge-high', label: 'Dashboard' },
  { to: '/admin/products', icon: 'fa-box', label: 'Products' },
  { to: '/admin/categories', icon: 'fa-tags', label: 'Categories' },
  { to: '/admin/orders', icon: 'fa-clipboard-list', label: 'Orders' },
  { to: '/admin/customers', icon: 'fa-users', label: 'Customers' },
  { to: '/admin/reports', icon: 'fa-chart-line', label: 'Reports' },
  { to: '/admin/settings', icon: 'fa-gear', label: 'Settings' },
]

interface Order { id: string; status: string; total_amount: number; created_at: string; customer_name: string; customer_phone: string }

export default function AdminOrders() {
  const { showToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [items, setItems] = useState<any[]>([])

  function load() {
    setLoading(true)
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    query.then(({ data }) => {
      setOrders(data || [])
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [filter])

  async function viewOrder(o: Order) {
    setSelected(o)
    const { data } = await supabase.from('order_items').select('*').eq('order_id', o.id)
    setItems(data || [])
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) showToast('Failed to update status', 'error')
    else { showToast('Order status updated'); load(); if (selected?.id === id) setSelected({ ...selected, status }) }
  }

  const statusColors: Record<string, string> = {
    pending: 'badge-amber', processing: 'badge-blue', shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red',
  }

  return (
    <AdminLayout navItems={navItems} title="Order Management">
      <div className="filter-bar mb-2">
        <select className="form-select" style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? <div className="spinner-wrap"><div className="spinner" /></div> : orders.length === 0 ? (
        <div className="card" style={{ padding: 'var(--sp-3)' }}>
          <div className="empty-state"><i className="fa-solid fa-clipboard" /><h3>No orders found</h3></div>
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--sp-1)' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id.slice(0, 8)}</td>
                    <td>{o.customer_name || 'Guest'}</td>
                    <td>₹{o.total_amount}</td>
                    <td><span className={`badge ${statusColors[o.status] || 'badge-amber'}`}>{o.status}</span></td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td><button className="btn btn-sm btn-outline" onClick={() => viewOrder(o)}><i className="fa-solid fa-eye" /> View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order #{selected.id.slice(0, 8)}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="modal-body">
              <p><strong>Customer:</strong> {selected.customer_name || 'Guest'}</p>
              <p><strong>Phone:</strong> {selected.customer_phone || 'N/A'}</p>
              <p><strong>Date:</strong> {new Date(selected.created_at).toLocaleString()}</p>
              <p><strong>Total:</strong> ₹{selected.total_amount}</p>
              <h4 style={{ marginTop: 'var(--sp-1)', marginBottom: '0.5rem' }}>Items</h4>
              <table>
                <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}><td>{i.product_name}</td><td>{i.quantity}</td><td>₹{i.price}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="form-group" style={{ marginTop: 'var(--sp-1)' }}>
                <label className="form-label">Update Status</label>
                <select className="form-select" value={selected.status} onChange={(e) => updateStatus(selected.id, e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
