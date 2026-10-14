import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { generateCodCode, type UpiDetails } from '../lib/upi'

export default function Cart() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart()
  const { showToast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [placing, setPlacing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod')
  const [upi, setUpi] = useState<UpiDetails>({ vpa: '', payeeName: 'FarmConnect' })

  async function loadUpiSettings() {
    const { data } = await supabase
      .from('settings')
      .select('key,value')
      .in('key', ['upi_id', 'upi_payee_name'])
    const map: Record<string, string> = {}
    for (const row of data || []) map[row.key] = row.value
    setUpi({
      vpa: map.upi_id || '',
      payeeName: map.upi_payee_name || 'FarmConnect',
    })
  }

  useEffect(() => {
    loadUpiSettings()
  }, [])

  async function handleCheckout() {
    if (items.length === 0) return

    if (!user) {
      showToast('Please log in to place your order', 'error')
      navigate('/login')
      return
    }

    setPlacing(true)

    // Generated in the browser and carried to the payment page in router state,
    // so no extra order columns are required.
    const code = generateCodCode()

    const orderPayload = {
      total: total,
      status: 'pending',
      customer_name: user.name,
      customer_phone: user.phone || '',
      customer_email: user.email || 'guest@farmconnect.local',
      shipping_address: 'Local pickup',
      payment_method: paymentMethod,
    }

    const { data, error } = await supabase.from('orders').insert(orderPayload).select().single()

    if (error) {
      console.error('Order insert failed:', error.message, error.code, error.details, error.hint)
      showToast(`Order failed: ${error.message}`, 'error')
      setPlacing(false)
      return
    }

    const orderItems = items.map((i) => ({
      order_id: data.id,
      product_id: i.product_id,
      product_name: i.name,
      quantity: i.quantity,
      price: i.price,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      console.error('Order items insert failed:', itemsError.message, itemsError.code, itemsError.details, itemsError.hint)
      showToast(`Order items failed: ${itemsError.message}`, 'error')
      setPlacing(false)
      return
    }

    // Mirror into `payments` using only columns that already exist.
    await supabase.from('payments').insert({
      order_id: data.id,
      amount: total,
      method: paymentMethod,
      status: 'pending',
    })

    clearCart()
    setPlacing(false)
    showToast('Order placed successfully!', 'success')

    // Hand off to the dedicated payment page.
    navigate('/payment', {
      state: {
        orderId: data.id,
        total,
        method: paymentMethod,
        code,
        upiId: upi.vpa,
        payeeName: upi.payeeName,
      },
    })
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 'var(--sp-3)', paddingBottom: 'var(--sp-3)' }}>
        <div className="empty-state">
          <i className="fa-solid fa-cart-shopping" />
          <h3>Your cart is empty</h3>
          <p>Browse our products and add some fresh produce!</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: 'var(--sp-1)' }}>
            <i className="fa-solid fa-basket-shopping" /> Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-2)', paddingBottom: 'var(--sp-4)' }}>
      <div className="section-header">
        <h2><i className="fa-solid fa-cart-shopping text-primary" /> Your Cart</h2>
        <p>{items.length} item(s) in your cart</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--sp-2)', alignItems: 'start' }}>
        <div className="card" style={{ padding: 'var(--sp-2)' }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', paddingBottom: 'var(--sp-1)', borderBottom: '1px solid var(--border)', marginBottom: 'var(--sp-1)' }}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              ) : (
                <div style={{ width: 64, height: 64, background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-image" style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{item.name}</h3>
                <p style={{ color: 'var(--primary-600)', fontWeight: 700 }}>₹{item.price}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button className="theme-toggle" style={{ width: 32, height: 32, fontSize: '0.9rem' }} onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  <i className="fa-solid fa-minus" />
                </button>
                <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                <button className="theme-toggle" style={{ width: 32, height: 32, fontSize: '0.9rem' }} onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <i className="fa-solid fa-plus" />
                </button>
              </div>
              <button className="theme-toggle" style={{ width: 36, height: 36, color: 'var(--error)' }} onClick={() => removeItem(item.id)}>
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 'var(--sp-2)', position: 'sticky', top: 80 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="text-muted">Items</span>
            <span>{items.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-1)' }}>
            <span className="text-muted">Total</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-600)' }}>₹{total.toFixed(2)}</span>
          </div>

          <div style={{ marginTop: 'var(--sp-1)', marginBottom: 'var(--sp-1)' }}>
            <span className="form-label">Payment Method</span>
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem',
                border: `2px solid ${paymentMethod === 'cod' ? 'var(--primary-500)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)', cursor: 'pointer', marginBottom: '0.4rem',
              }}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              <i className="fa-solid fa-money-bill-wave text-primary" />
              <span style={{ fontWeight: 600 }}>Cash on Delivery</span>
            </label>
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem',
                border: `2px solid ${paymentMethod === 'upi' ? 'var(--primary-500)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'upi'}
                onChange={() => setPaymentMethod('upi')}
              />
              <i className="fa-solid fa-qrcode text-primary" />
              <span style={{ fontWeight: 600 }}>Online Payment (UPI)</span>
            </label>
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={handleCheckout} disabled={placing}>
            {placing ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-check" /> Place Order</>}
          </button>
        </div>
      </div>
    </div>
  )
}
