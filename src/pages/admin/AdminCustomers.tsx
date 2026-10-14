import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
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

export default function AdminCustomers() {
  const { showToast } = useToast()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCustomers(data || [])
      setLoading(false)
    })
  }, [])

  async function handleDelete() {
    const target = confirmDelete
    if (!target) return
    setDeletingId(target.id)

    try {
      // profiles has no anon DELETE policy, so this goes through the
      // service-role edge function instead of a direct table delete.
      const token = localStorage.getItem('farmconnect-admin-token')
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-customers?action=delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ id: target.id }),
        },
      )

      setDeletingId(null)
      setConfirmDelete(null)

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(data.error || 'Unable to delete customer', 'error')
        return
      }

      setCustomers((prev) => prev.filter((c) => c.id !== target.id))
      if (selected?.id === target.id) setSelected(null)
      showToast('Customer deleted')
    } catch {
      setDeletingId(null)
      setConfirmDelete(null)
      showToast('Unable to reach the server. Please try again.', 'error')
    }
  }

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
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name || 'N/A'}</td>
                    <td>{c.email || 'N/A'}</td>
                    <td>{c.phone || 'N/A'}</td>
                    <td>{c.location || 'N/A'}</td>
                    <td><span className={`badge ${c.role === 'admin' ? 'badge-green' : 'badge-blue'}`}>{c.role}</span></td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => setSelected(c)}>
                        <i className="fa-solid fa-eye" /> View
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        style={{ marginLeft: '0.375rem' }}
                        onClick={() => setConfirmDelete(c)}
                      >
                        <i className="fa-solid fa-trash" /> Delete
                      </button>
                    </td>
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
              <h3>Customer Profile</h3>
              <button className="modal-close" onClick={() => setSelected(null)}><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
                {selected.avatar_url ? (
                  <img
                    src={selected.avatar_url}
                    alt=""
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(selected.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <strong style={{ display: 'block', fontSize: '1.05rem' }}>{selected.full_name || 'N/A'}</strong>
                  <span className={`badge ${selected.role === 'admin' ? 'badge-green' : 'badge-blue'}`}>{selected.role || 'customer'}</span>
                </div>
              </div>

              <table style={{ width: '100%' }}>
                <tbody>
                  <tr><td className="text-muted">Email</td><td>{selected.email || 'N/A'}</td></tr>
                  <tr><td className="text-muted">Phone</td><td>{selected.phone || 'N/A'}</td></tr>
                  <tr><td className="text-muted">Location</td><td>{selected.location || 'N/A'}</td></tr>
                  <tr><td className="text-muted">Farm Name</td><td>{selected.farm_name || 'N/A'}</td></tr>
                  <tr><td className="text-muted">Bio</td><td>{selected.bio || 'N/A'}</td></tr>
                  <tr><td className="text-muted">Status</td><td>
                    <span className={`badge ${selected.is_blocked ? 'badge-red' : 'badge-green'}`}>
                      {selected.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td></tr>
                  <tr><td className="text-muted">Joined</td><td>{new Date(selected.created_at).toLocaleDateString()}</td></tr>
                  <tr><td className="text-muted">User ID</td><td style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>{selected.id}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
              <button className="btn btn-danger" onClick={() => { setConfirmDelete(selected); setSelected(null) }}>
                <i className="fa-solid fa-trash" /> Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete customer?</h3>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="modal-body">
              <p>
                This permanently removes <strong>{confirmDelete.full_name || confirmDelete.email}</strong> and
                cascades to their orders and any products they sell. This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deletingId === confirmDelete.id}>
                {deletingId === confirmDelete.id ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-trash" />}
                {' '}Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}