import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'

const navItems = [
  { to: '/admin', icon: 'fa-gauge-high', label: 'Dashboard' },
  { to: '/admin/products', icon: 'fa-box', label: 'Products' },
  { to: '/admin/categories', icon: 'fa-tags', label: 'Categories' },
  { to: '/admin/orders', icon: 'fa-clipboard-list', label: 'Orders' },
  { to: '/admin/customers', icon: 'fa-users', label: 'Customers' },
  { to: '/admin/reports', icon: 'fa-chart-line', label: 'Reports' },
  { to: '/admin/settings', icon: 'fa-gear', label: 'Settings' },
]

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCustomers(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <AdminLayout navItems={navItems} title="Customers">
      {loading ? <div className="spinner-wrap"><div className="spinner" /></div> : customers.length === 0 ? (
        <div className="card" style={{ padding: 'var(--sp-3)' }}>
          <div className="empty-state"><i className="fa-solid fa-users" /><h3>No customers yet</h3></div>
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--sp-1)' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Role</th><th>Joined</th></tr></thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name || 'N/A'}</td>
                    <td>{c.email || 'N/A'}</td>
                    <td>{c.phone || 'N/A'}</td>
                    <td>{c.location || 'N/A'}</td>
                    <td><span className={`badge ${c.role === 'admin' ? 'badge-green' : 'badge-blue'}`}>{c.role}</span></td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
