import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Category { id: string; name: string; slug: string; icon: string; image_url: string }
interface Product {
  id: string
  name: string
  price: number
  unit: string
  image_url: string
  stock: number
  is_organic: boolean
  is_featured: boolean
  farmer_name: string
  farmer_location: string
  categories?: { name: string }
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').eq('status', 'active').order('name').limit(3),
      supabase.from('products').select('*, categories(name)').eq('status', 'active').order('created_at', { ascending: false }).limit(8),
    ]).then(([catRes, prodRes]) => {
      setCategories(catRes.data || [])
      setProducts(prodRes.data as Product[] || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-2)', paddingBottom: 'var(--sp-4)' }}>
      <section className="hero">
        <h1>Fresh from Local Farms to Your Table</h1>
        <p>Connect directly with local farmers. Browse fresh fruits, vegetables, and grains from villages near you.</p>
        <div className="hero-actions">
          <Link to="/products" className="btn btn-primary btn-lg"><i className="fa-solid fa-basket-shopping" /> Browse Products</Link>
          <Link to="/track-order" className="btn btn-outline btn-lg"><i className="fa-solid fa-truck" /> Track Order</Link>
        </div>
      </section>

      <section style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="section-header">
          <h2><i className="fa-solid fa-tags text-primary" /> Shop by Category</h2>
          <p>Fruits, Vegetables, and Grains</p>
        </div>
        <div className="grid">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/products?category=${cat.slug}`} className="card category-card">
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              ) : (
                <i className={`fa-solid ${cat.icon || 'fa-tag'}`} />
              )}
              <h3>{cat.name}</h3>
              <p>Local farms</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2><i className="fa-solid fa-leaf text-primary" /> Fresh from Local Farms</h2>
          <p>Latest products from our farmers</p>
        </div>
        {products.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-box-open" />
            <h3>No products available</h3>
            <p>Please add products from the Admin Dashboard.</p>
          </div>
        ) : (
          <div className="grid">
            {products.map((p) => (
              <Link key={p.id} to="/products" className="card product-card">
                <div style={{ position: 'relative' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} />
                  ) : (
                    <div className="product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-500)' }} /> {p.farmer_location || 'Local'}
                  </p>
                  <div className="price">₹{p.price}<span className="unit"> / {p.unit}</span></div>
                  <div className={`stock ${p.stock > 0 ? 'stock-in' : 'stock-out'}`}>
                    {p.stock > 0 ? `Stock: ${p.stock} ${p.unit}` : 'Out of Stock'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
