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

export default function AdminReports() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, pending: 0, delivered: 0, cancelled: 0 })
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('total_amount, status'),
      supabase.from('order_items').select('product_name, quantity, price').limit(100),
    ]).then(([ordersRes, itemsRes]) => {
      const orders = ordersRes.data || []
      const items = itemsRes.data || []
      const revenue = orders.filter((o: any) => o.status === 'delivered').reduce((s: number, o: any) => s + Number(o.total_amount), 0)
      setStats({
        totalRevenue: revenue,
        totalOrders: orders.length,
        pending: orders.filter((o: any) => o.status === 'pending').length,
        delivered: orders.filter((o: any) => o.status === 'delivered').length,
        cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
      })
      const productMap: Record<string, { name: string; qty: number; revenue: number }> = {}
      items.forEach((i: any) => {
        if (!productMap[i.product_name]) productMap[i.product_name] = { name: i.product_name, qty: 0, revenue: 0 }
        productMap[i.product_name].qty += i.quantity
        productMap[i.product_name].revenue += i.quantity * i.price
      })
      setTopProducts(Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5))
      setLoading(false)
    })
  }, [])

  if (loading) return <AdminLayout navItems={navItems} title="Reports"><div className="spinner-wrap"><div className="spinner" /></div></AdminLayout>

  return (
    <AdminLayout navItems={navItems} title="Reports & Analytics">
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-icon green"><i className="fa-solid fa-dollar-sign" /></div>
          <div><div className="stat-value">₹{stats.totalRevenue.toFixed(2)}</div><div className="stat-label">Total Revenue</div></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon blue"><i className="fa-solid fa-clipboard-list" /></div>
          <div><div className="stat-value">{stats.totalOrders}</div><div className="stat-label">Total Orders</div></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon amber"><i className="fa-solid fa-clock" /></div>
          <div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending</div></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon green"><i className="fa-solid fa-check" /></div>
          <div><div className="stat-value">{stats.delivered}</div><div className="stat-label">Delivered</div></div>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--sp-2)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-1)' }}>Top Products by Revenue</h3>
        {topProducts.length === 0 ? (
          <div className="empty-state"><i className="fa-solid fa-chart-line" /><h3>No sales data yet</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Quantity Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i}><td>{p.name}</td><td>{p.qty}</td><td>₹{p.revenue.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
