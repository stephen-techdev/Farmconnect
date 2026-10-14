import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const INVALID_CREDENTIALS = 'Invalid email or password'

/**
 * Single login page for customers and admins.
 * The submitted email/password is checked against the admin account first,
 * then the customer account. Admins are redirected to the admin dashboard,
 * everyone else to the storefront.
 */
export default function UserLogin() {
  const { userSignIn, adminSignIn } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    // Admins first, so an admin account can never land in the customer view.
    const adminResult = await adminSignIn(email, password)

    if (!adminResult.error) {
      setLoading(false)
      showToast('Admin login successful!')
      navigate('/admin')
      return
    }

    // A non-credential failure means the admin service itself is unreachable.
    if (adminResult.error !== INVALID_CREDENTIALS) {
      setLoading(false)
      showToast(adminResult.error, 'error')
      return
    }

    const userResult = await userSignIn(email, password)
    setLoading(false)

    if (!userResult.error) {
      showToast('Login successful!')
      navigate('/')
      return
    }

    showToast(userResult.error || INVALID_CREDENTIALS, 'error')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">
          <i className="fa-solid fa-right-to-bracket" />
          <h2>Login</h2>
          <p>Sign in to your FarmConnect account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-field">
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-link">
          New here? <Link to="/register">Create New Account</Link>
        </p>
        <p className="auth-link">
          <Link to="/"><i className="fa-solid fa-arrow-left" /> Back to Store</Link>
        </p>
      </div>
    </div>
  )
}