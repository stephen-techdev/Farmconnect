import { type ReactNode, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'

export interface NavItem { to: string; icon: string; label: string }

export default function AdminLayout({ children, navItems, title }: {
  children: ReactNode
  navItems: NavItem[]
  title: string
}) {
  const { admin, adminSignOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { count } = useCart()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await adminSignOut()
    navigate('/')
  }

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar" style={{ display: sidebarOpen ? 'block' : undefined }}>
        <div className="sidebar-logo">
          <i className="fa-solid fa-seedling" /> FarmConnect
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 1rem', marginBottom: 'var(--sp-1)' }}>Admin Panel</p>
        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end className={({ isActive }) => isActive ? 'active' : ''}>
                <i className={`fa-solid ${item.icon}`} /> {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <Link to="/"><i className="fa-solid fa-store" /> View Store</Link>
          </li>
          <li>
            <Link to="/cart"><i className="fa-solid fa-cart-shopping" /> Cart ({count})</Link>
          </li>
          <li>
            <button onClick={handleSignOut} style={{ color: 'var(--error)' }}>
              <i className="fa-solid fa-right-from-bracket" /> Sign Out
            </button>
          </li>
        </ul>
      </aside>

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <button className="nav-burger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className="fa-solid fa-bars" />
          </button>
          <h2>{title}</h2>
          <div className="flex items-center gap-1">
            <button className="theme-toggle" onClick={toggleTheme}>
              <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`} />
            </button>
            <div className="nav-user">
              <span className="avatar">{admin?.name.charAt(0).toUpperCase() || 'A'}</span>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
