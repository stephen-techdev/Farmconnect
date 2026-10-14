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
  { to: '/admin/payments', icon: 'fa-indian-rupee-sign', label: 'Payments' },
  { to: '/admin/reports', icon: 'fa-chart-line', label: 'Reports' },
  { to: '/admin/settings', icon: 'fa-gear', label: 'Settings' },
]

interface Product {
  id: string
  name: string
  price: number
  stock: number
  unit: string
  image_url: string
  category_id: string
  description: string
  is_organic: boolean
  is_featured: boolean
  status: string
  farmer_name: string
  farmer_location: string
  categories?: { name: string }
}
interface Category { id: string; name: string }

const UNITS = ['kg', 'g', 'piece', 'dozen', 'bunch', 'litre']

export default function AdminProducts() {
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    unit: 'kg',
    image_url: '',
    category_id: '',
    is_organic: false,
    is_featured: false,
  })
  const [uploading, setUploading] = useState(false)

  function load() {
    setLoading(true)
    supabase.from('products').select('*, categories(name)').order('name').then(({ data }) => {
      setProducts(data as Product[] || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
    supabase.from('categories').select('id, name').order('name').then(({ data }) => setCategories(data || []))
  }, [])

  function openAdd() {
    setEditing(null)
    setForm({ name: '', price: '', stock: '', unit: 'kg', image_url: '', category_id: '', is_organic: false, is_featured: false })
    setModal(true)
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('products').upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (upErr) { showToast('Unable to upload image. Please try again.', 'error'); return }
      const { data: pub } = supabase.storage.from('products').getPublicUrl(fileName)
      if (pub?.publicUrl) setForm((f) => ({ ...f, image_url: pub.publicUrl }))
    } catch {
      showToast('Unable to upload image. Please try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      unit: p.unit || 'kg',
      image_url: p.image_url || '',
      category_id: p.category_id || '',
      is_organic: p.is_organic || false,
      is_featured: p.is_featured || false,
    })
    setModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price) { showToast('Name and price are required', 'error'); return }
    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      unit: form.unit,
      image_url: form.image_url,
      category_id: form.category_id || null,
      is_organic: form.is_organic,
      is_featured: form.is_featured,
      status: 'active',
    }
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) showToast('Failed to update product', 'error')
      else showToast('Product updated successfully.')
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) showToast('Failed to add product', 'error')
      else showToast('Product added!')
    }
    setModal(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) showToast('Failed to delete product', 'error')
    else { showToast('Product deleted successfully.'); load() }
  }

  return (
    <AdminLayout navItems={navItems} title="Product Management">
      <div className="flex justify-between items-center mb-2">
        <p className="text-muted">{products.length} products from local farmers</p>
        <button className="btn btn-primary" onClick={openAdd}><i className="fa-solid fa-plus" /> Add Product</button>
      </div>

      {loading ? <div className="spinner-wrap"><div className="spinner" /></div> : products.length === 0 ? (
        <div className="card" style={{ padding: 'var(--sp-3)' }}>
          <div className="empty-state">
            <i className="fa-solid fa-box-open" />
            <h3>No products available</h3>
            <p>Click "Add Product" to add your first product</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--sp-1)' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.image_url ? <img src={p.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} /> : <i className="fa-solid fa-image" style={{ color: 'var(--text-muted)' }} />}
                    </td>
                    <td>{p.name}</td>
                    <td>{p.categories?.name || '—'}</td>
                    <td>₹{p.price} / {p.unit}</td>
                    <td><span className={`badge ${p.stock > 0 ? 'badge-green' : 'badge-red'}`}>{p.stock}</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)}><i className="fa-solid fa-pen" /></button>{' '}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}><i className="fa-solid fa-trash" /></button>
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
              <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}><i className="fa-solid fa-xmark" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tomato" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Select Category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Product Image</label>
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} style={{ marginBottom: 8 }} />
                  {uploading && <p className="text-muted" style={{ fontSize: '0.85rem' }}><i className="fa-solid fa-spinner fa-spin" /> Uploading image...</p>}
                  <input className="form-input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Or paste an image URL" />
                  {form.image_url && (
                    <img src={form.image_url} alt="Preview" style={{ marginTop: 8, width: '100%', height: 120, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-1)' }}>
                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input className="form-input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="40" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input className="form-input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="100" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-1)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={form.is_organic} onChange={(e) => setForm({ ...form, is_organic: e.target.checked })} />
                    <i className="fa-solid fa-leaf text-primary" /> Organic
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                    <i className="fa-solid fa-star" style={{ color: 'var(--accent-500)' }} /> Featured Product
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
