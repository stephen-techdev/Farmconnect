import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'

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

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, categories: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount').eq('status', 'delivered'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
    ]).then(([pRes, oRes, cRes, revRes, recentRes]) => {
      setStats({
        products: pRes.count || 0,
        orders: oRes.count || 0,
        categories: cRes.count || 0,
        revenue: (revRes.data || []).reduce((sum: number, o: any) => sum + Number(o.total_amount), 0),
      })
      setRecentOrders(recentRes.data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <AdminLayout navItems={navItems} title="Dashboard"><div className="spinner-wrap"><div className="spinner" /></div></AdminLayout>

  return (
    <AdminLayout navItems={navItems} title="Dashboard">
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-icon green"><i className="fa-solid fa-box" /></div>
          <div><div className="stat-value">{stats.products}</div><div className="stat-label">Total Products</div></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon amber"><i className="fa-solid fa-clipboard-list" /></div>
          <div><div className="stat-value">{stats.orders}</div><div className="stat-label">Total Orders</div></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon blue"><i className="fa-solid fa-tags" /></div>
          <div><div className="stat-value">{stats.categories}</div><div className="stat-label">Categories</div></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon green"><i className="fa-solid fa-dollar-sign" /></div>
          <div><div className="stat-value">₹{stats.revenue.toFixed(2)}</div><div className="stat-label">Revenue (Delivered)</div></div>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--sp-2)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-1)' }}>Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <div className="empty-state"><i className="fa-solid fa-clipboard" /><h3>No orders yet</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id.slice(0, 8)}</td>
                    <td>{o.customer_name || 'Guest'}</td>
                    <td>₹{o.total_amount}</td>
                    <td><span className={`badge ${o.status === 'delivered' ? 'badge-green' : o.status === 'pending' ? 'badge-amber' : 'badge-blue'}`}>{o.status}</span></td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
