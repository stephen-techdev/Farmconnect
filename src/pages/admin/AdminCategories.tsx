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

interface Category { id: string; name: string; slug: string; icon: string; description: string; image_url: string; status: string }

export default function AdminCategories() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', icon: 'fa-tag', description: '', image_url: '', status: 'active' })

  function load() {
    setLoading(true)
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories(data || [])
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditing(null)
    setForm({ name: '', slug: '', icon: 'fa-tag', description: '', image_url: '', status: 'active' })
    setModal(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setForm({ name: c.name, slug: c.slug, icon: c.icon || 'fa-tag', description: c.description || '', image_url: c.image_url || '', status: c.status || 'active' })
    setModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { showToast('Name is required', 'error'); return }
    const payload = { ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-') }
    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id)
      if (error) showToast('Failed to update', 'error')
      else showToast('Category updated!')
    } else {
      const { error } = await supabase.from('categories').insert(payload)
      if (error) showToast('Failed to add', 'error')
      else showToast('Category added!')
    }
    setModal(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) showToast('Failed to delete', 'error')
    else { showToast('Category deleted'); load() }
  }

  return (
    <AdminLayout navItems={navItems} title="Category Management">
      <div className="flex justify-between items-center mb-2">
        <p className="text-muted">{categories.length} categories</p>
        <button className="btn btn-primary" onClick={openAdd}><i className="fa-solid fa-plus" /> Add Category</button>
      </div>

      {loading ? <div className="spinner-wrap"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 'var(--sp-1)' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Icon</th><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td><i className={`fa-solid ${c.icon || 'fa-tag'}`} style={{ color: 'var(--primary-600)' }} /></td>
                    <td>{c.name}</td>
                    <td>{c.slug}</td>
                    <td><span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-red'}`}>{c.status}</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)}><i className="fa-solid fa-pen" /></button>{' '}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}><i className="fa-solid fa-trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}><i className="fa-solid fa-xmark" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug (auto-generated if empty)</label>
                  <input className="form-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon (Font Awesome class)</label>
                  <input className="form-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="fa-tag" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input className="form-input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
