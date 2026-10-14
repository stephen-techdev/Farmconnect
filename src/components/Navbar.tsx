import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { admin, user, userSignOut, adminSignOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { count } = useCart()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await userSignOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <i className="fa-solid fa-seedling" />
          FarmConnect
        </Link>

        <ul className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><NavLink to="/products">Categories</NavLink></li>
          <li><NavLink to="/products">Products</NavLink></li>
          <li><NavLink to="/track-order">Orders</NavLink></li>
          <li><NavLink to="/contact">Contact</NavLink></li>
        </ul>

        <div className="nav-actions">
          <Link to="/cart" className="nav-cart" title="Cart">
            <i className="fa-solid fa-cart-shopping" />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>

          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`} />
          </button>

          {admin ? (
            <>
              <Link to="/admin" className="nav-user">
                <span className="user-name">{admin.name.split(' ')[0]}</span>
                <span className="avatar">{admin.name.charAt(0).toUpperCase()}</span>
              </Link>
              <button className="theme-toggle" onClick={async () => { await adminSignOut(); navigate('/') }} title="Admin sign out">
                <i className="fa-solid fa-right-from-bracket" />
              </button>
            </>
          ) : user ? (
            <>
              <span className="nav-user">
                <span className="user-name">{user.name.split(' ')[0]}</span>
                <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
              </span>
              <button className="theme-toggle" onClick={handleSignOut} title="Sign out">
                <i className="fa-solid fa-right-from-bracket" />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              <i className="fa-solid fa-right-to-bracket" /> Login
            </Link>
          )}

          <button className="nav-burger" onClick={() => setMobileOpen(!mobileOpen)}>
            <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`} />
          </button>
        </div>
      </div>
    </nav>
  )
}
