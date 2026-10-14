import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

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

export default function AdminSettings() {
  const { admin } = useAuth()
  const { showToast } = useToast()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      const map: Record<string, string> = {}
      ;(data || []).forEach((s: any) => { map[s.key] = s.value })
      setSettings(map)
    })
  }, [])

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const entries = Object.entries(settings)
    await Promise.all(entries.map(([key, value]) =>
      supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    ))
    setSaving(false)
    showToast('Settings saved!')
  }

  return (
    <AdminLayout navItems={navItems} title="Settings">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', alignItems: 'start' }}>
        <div className="card" style={{ padding: 'var(--sp-2)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-1)' }}>Store Settings</h3>
          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label className="form-label">Store Name</label>
              <input className="form-input" value={settings.store_name || ''} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input className="form-input" value={settings.contact_email || ''} onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input className="form-input" value={settings.contact_phone || ''} onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <input className="form-input" value={settings.currency || '$'} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-save" /> Save Settings</>}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: 'var(--sp-2)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-1)' }}>Account</h3>
          <div style={{ marginBottom: 'var(--sp-1)' }}>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Logged in as: <strong style={{ color: 'var(--text)' }}>{admin?.name}</strong></p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Email: <strong style={{ color: 'var(--text)' }}>{admin?.email}</strong></p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
