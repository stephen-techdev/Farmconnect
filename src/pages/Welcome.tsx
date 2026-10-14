import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Welcome() {
  const { user, admin, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (admin) return <Navigate to="/admin" replace />
  if (user) return <Navigate to="/" replace />

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="logo">
          <i className="fa-solid fa-seedling" style={{ fontSize: '3.5rem', color: 'var(--primary-600)' }} />
          <h2 style={{ marginTop: '0.5rem' }}>FarmConnect</h2>
          <p>Welcome to FarmConnect</p>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--sp-2)' }}>
          Fresh from local farms to your table. Sign in or create an account to start shopping.
        </p>

        <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/login')}>
          <i className="fa-solid fa-right-to-bracket" /> Login
        </button>
        <button className="btn btn-outline btn-block btn-lg" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/register')}>
          <i className="fa-solid fa-user-plus" /> Register
        </button>

        <p className="auth-link" style={{ marginTop: 'var(--sp-3)' }}>
          <button
            onClick={() => navigate('/admin/login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            <i className="fa-solid fa-shield-halved" /> Admin Login
          </button>
        </p>
      </div>
    </div>
  )
}
