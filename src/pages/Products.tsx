import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'

interface Product {
  id: string
  name: string
  price: number
  unit: string
  image_url: string
  stock: number
  category_id: string
  is_organic: boolean
  is_featured: boolean
  description: string
  farmer_name: string
  farmer_location: string
  district: string
  categories?: { name: string; slug: string }
}
interface Category { id: string; name: string; slug: string }

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { addItem } = useCart()
  const { showToast } = useToast()

  const selectedCategory = searchParams.get('category') || 'all'

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    let query = supabase.from('products').select('*, categories(name, slug)')
    if (selectedCategory !== 'all') {
      const cat = categories.find((c) => c.slug === selectedCategory)
      if (cat) query = query.eq('category_id', cat.id)
    }
    if (search) query = query.ilike('name', `%${search}%`)
    query.eq('status', 'active').order('name').then(({ data }) => {
      setProducts(data as Product[] || [])
      setLoading(false)
    })
  }, [selectedCategory, search, categories])

  function handleAdd(p: Product) {
    if (p.stock <= 0) { showToast('Product is out of stock', 'error'); return }
    addItem({ product_id: p.id, name: p.name, price: p.price, image_url: p.image_url, quantity: 1 })
    showToast(`${p.name} added to cart`)
  }

  function handleBuyNow(p: Product) {
    if (p.stock <= 0) { showToast('Product is out of stock', 'error'); return }
    addItem({ product_id: p.id, name: p.name, price: p.price, image_url: p.image_url, quantity: 1 })
    navigate('/cart')
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-2)', paddingBottom: 'var(--sp-4)' }}>
      <div className="section-header">
        <h2><i className="fa-solid fa-basket-shopping text-primary" /> Local Farmer Products</h2>
        <p>Fresh produce directly from local farmers</p>
      </div>

      <div className="filter-bar">
        <select
          className="form-select"
          value={selectedCategory}
          onChange={(e) => setSearchParams(e.target.value === 'all' ? {} : { category: e.target.value })}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <input
          className="form-input search-input"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-box-open" />
          <h3>No products available</h3>
          <p>Please add products from the Admin Dashboard.</p>
        </div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <div key={p.id} className="card product-card">
              <div style={{ position: 'relative' }}>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                ) : (
                  <div className="product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <i className="fa-solid fa-image" style={{ fontSize: '2rem', color: 'var(--text-muted)' }} />
                  </div>
                )}
                {p.is_organic && (
                  <span className="badge badge-green" style={{ position: 'absolute', top: 8, left: 8 }}>
                    <i className="fa-solid fa-leaf" /> Organic
                  </span>
                )}
                {p.is_featured && (
                  <span className="badge badge-amber" style={{ position: 'absolute', top: 8, right: 8 }}>
                    <i className="fa-solid fa-star" /> Featured
                  </span>
                )}
              </div>
              <div className="product-card-body">
                <h3>{p.name}</h3>
                {p.categories?.name && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <i className="fa-solid fa-tag" /> {p.categories.name}
                  </p>
                )}
                <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <i className="fa-solid fa-tractor" style={{ color: 'var(--primary-600)' }} /> {p.farmer_name || 'Local Farmer'}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-500)' }} /> {p.farmer_location || 'Local'}{p.district ? `, ${p.district}` : ''}
                </p>
                {p.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </p>
                )}
                <div className="price">₹{p.price}<span className="unit"> / {p.unit}</span></div>
                <div className={`stock ${p.stock > 0 ? 'stock-in' : 'stock-out'}`}>
                  <i className="fa-solid fa-box" /> {p.stock > 0 ? `Stock: ${p.stock} ${p.unit}` : 'Out of Stock'}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleAdd(p)} disabled={p.stock <= 0}>
                    <i className="fa-solid fa-cart-plus" /> Add to Cart
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1, borderColor: 'var(--accent-500)', color: 'var(--accent-600)' }} onClick={() => handleBuyNow(p)} disabled={p.stock <= 0}>
                    <i className="fa-solid fa-bolt" /> Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
