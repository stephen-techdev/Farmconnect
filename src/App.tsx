import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Products from './pages/Products'
import Cart from './pages/Cart'
import TrackOrder from './pages/TrackOrder'
import Contact from './pages/Contact'
import Welcome from './pages/Welcome'
import UserLogin from './pages/UserLogin'
import UserRegister from './pages/UserRegister'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminReports from './pages/admin/AdminReports'
import AdminSettings from './pages/admin/AdminSettings'

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth()
  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!admin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Start page */}
      <Route path="/welcome" element={<Welcome />} />

      {/* User auth */}
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserRegister />} />

      {/* Admin auth */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/register" element={<Register />} />

      {/* User pages (require user login) */}
      <Route path="/" element={<UserRoute><Layout><Home /></Layout></UserRoute>} />
      <Route path="/products" element={<UserRoute><Layout><Products /></Layout></UserRoute>} />
      <Route path="/cart" element={<UserRoute><Layout><Cart /></Layout></UserRoute>} />
      <Route path="/track-order" element={<UserRoute><Layout><TrackOrder /></Layout></UserRoute>} />
      <Route path="/contact" element={<UserRoute><Layout><Contact /></Layout></UserRoute>} />

      {/* Admin pages (require admin login) */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
      <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

      {/* Default redirect to welcome */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  )
}
