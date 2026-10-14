import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface AdminUser {
  id: string
  name: string
  email: string
  avatar_url?: string | null
}

export interface AppUser {
  id: string
  name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
}

interface AuthContextValue {
  admin: AdminUser | null
  user: AppUser | null
  loading: boolean
  userSignIn: (email: string, password: string) => Promise<{ error: string | null }>
  userRegister: (data: { name: string; email: string; password: string; phone?: string; avatar_url?: string }) => Promise<{ error: string | null }>
  userSignOut: () => Promise<void>
  adminSignIn: (email: string, password: string) => Promise<{ error: string | null }>
  adminRegister: (data: { name: string; email: string; password: string; avatar_url?: string }) => Promise<{ error: string | null }>
  adminSignOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const ADMIN_TOKEN_KEY = 'farmconnect-admin-token'
const ADMIN_KEY = 'farmconnect-admin-user'
const LOCAL_ADMINS_KEY = 'farmconnect-local-admins'

const USER_TOKEN_KEY = 'farmconnect-user-token'
const USER_KEY = 'farmconnect-user-user'
const LOCAL_USERS_KEY = 'farmconnect-local-users'

const DEFAULT_ADMIN = {
  id: 'default-admin',
  name: 'Admin',
  email: 'admin@farmconnect.com',
  password: 'admin123',
  avatar_url: null as string | null,
}

function getAdminFunctionUrl(action: string) {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth?action=${action}`
}

function getUserFunctionUrl(action: string) {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-auth?action=${action}`
}

function getAnonHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  }
}

function getTokenHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

interface LocalAdmin {
  id: string
  name: string
  email: string
  password: string
  avatar_url?: string | null
}

function getLocalAdmins(): LocalAdmin[] {
  try {
    const raw = localStorage.getItem(LOCAL_ADMINS_KEY)
    const list: LocalAdmin[] = raw ? JSON.parse(raw) : []
    if (!list.some((a) => a.email === DEFAULT_ADMIN.email)) {
      list.unshift({ ...DEFAULT_ADMIN })
      localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(list))
    }
    return list
  } catch {
    return [{ ...DEFAULT_ADMIN }]
  }
}

interface LocalUser {
  id: string
  name: string
  email: string
  password: string
  phone?: string | null
  avatar_url?: string | null
}

function getLocalUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore admin session
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY)
    const savedAdmin = localStorage.getItem(ADMIN_KEY)

    // Restore user session
    const userToken = localStorage.getItem(USER_TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)

    let pending = 0
    let done = 0
    function checkDone() {
      done++
      if (done >= pending) setLoading(false)
    }

    if (adminToken && savedAdmin) {
      pending++
      fetch(getAdminFunctionUrl('admin-verify'), { headers: getTokenHeaders(adminToken) })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            if (data.valid) {
              setAdmin(data.admin)
              localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin))
            } else {
              localStorage.removeItem(ADMIN_TOKEN_KEY)
              localStorage.removeItem(ADMIN_KEY)
            }
          } else {
            try {
              const parsed: AdminUser = JSON.parse(savedAdmin)
              const locals = getLocalAdmins()
              if (locals.some((a) => a.email === parsed.email)) {
                setAdmin(parsed)
              } else {
                localStorage.removeItem(ADMIN_TOKEN_KEY)
                localStorage.removeItem(ADMIN_KEY)
              }
            } catch {
              localStorage.removeItem(ADMIN_TOKEN_KEY)
              localStorage.removeItem(ADMIN_KEY)
            }
          }
        })
        .catch(() => {
          try {
            const parsed: AdminUser = JSON.parse(savedAdmin)
            const locals = getLocalAdmins()
            if (locals.some((a) => a.email === parsed.email)) {
              setAdmin(parsed)
            } else {
              localStorage.removeItem(ADMIN_TOKEN_KEY)
              localStorage.removeItem(ADMIN_KEY)
            }
          } catch {
            localStorage.removeItem(ADMIN_TOKEN_KEY)
            localStorage.removeItem(ADMIN_KEY)
          }
        })
        .finally(checkDone)
    }

    if (userToken && savedUser) {
      pending++
      fetch(getUserFunctionUrl('user-verify'), { headers: getTokenHeaders(userToken) })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            if (data.valid) {
              setUser(data.user)
              localStorage.setItem(USER_KEY, JSON.stringify(data.user))
            } else {
              localStorage.removeItem(USER_TOKEN_KEY)
              localStorage.removeItem(USER_KEY)
            }
          } else {
            try {
              const parsed: AppUser = JSON.parse(savedUser)
              const locals = getLocalUsers()
              if (locals.some((u) => u.email === parsed.email)) {
                setUser(parsed)
              } else {
                localStorage.removeItem(USER_TOKEN_KEY)
                localStorage.removeItem(USER_KEY)
              }
            } catch {
              localStorage.removeItem(USER_TOKEN_KEY)
              localStorage.removeItem(USER_KEY)
            }
          }
        })
        .catch(() => {
          try {
            const parsed: AppUser = JSON.parse(savedUser)
            const locals = getLocalUsers()
            if (locals.some((u) => u.email === parsed.email)) {
              setUser(parsed)
            } else {
              localStorage.removeItem(USER_TOKEN_KEY)
              localStorage.removeItem(USER_KEY)
            }
          } catch {
            localStorage.removeItem(USER_TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
          }
        })
        .finally(checkDone)
    }

    if (pending === 0) setLoading(false)
  }, [])

  // ==================== USER AUTH ====================

  async function userRegister({ name, email, password, phone, avatar_url }: { name: string; email: string; password: string; phone?: string; avatar_url?: string }) {
    try {
      const res = await fetch(getUserFunctionUrl('user-register'), {
        method: 'POST',
        headers: getAnonHeaders(),
        body: JSON.stringify({ name, email, password, phone, avatar_url }),
      })

      if (!res.ok) {
        let message = 'Registration failed. Please try again.'
        try {
          const data = await res.json()
          message = data.error || message
        } catch { /* keep default */ }
        return { error: message }
      }

      const data = await res.json()
      if (!data.user) {
        return { error: 'Registration failed. Please try again.' }
      }

      return { error: null }
    } catch {
      try {
        const locals = getLocalUsers()
        if (locals.some((u) => u.email === email)) {
          return { error: 'An account with this email already exists' }
        }
        const newUser: LocalUser = {
          id: crypto.randomUUID(),
          name,
          email,
          password,
          phone: phone || null,
          avatar_url: avatar_url || null,
        }
        locals.push(newUser)
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(locals))
        return { error: null }
      } catch {
        return { error: 'Unable to register at this time. Please try again.' }
      }
    }
  }

  async function userSignIn(email: string, password: string) {
    try {
      const res = await fetch(getUserFunctionUrl('user-login'), {
        method: 'POST',
        headers: getAnonHeaders(),
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        let message = 'Invalid email or password'
        try {
          const data = await res.json()
          message = data.error || message
        } catch { /* keep default */ }
        return { error: message }
      }

      const data = await res.json()
      if (!data.token || !data.user) {
        return { error: 'Login failed. Please try again.' }
      }

      localStorage.setItem(USER_TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
      return { error: null }
    } catch {
      try {
        const locals = getLocalUsers()
        const match = locals.find((u) => u.email === email && u.password === password)
        if (!match) {
          return { error: 'Invalid email or password' }
        }
        const localUser: AppUser = {
          id: match.id,
          name: match.name,
          email: match.email,
          phone: match.phone,
          avatar_url: match.avatar_url,
        }
        const token = 'local-' + crypto.randomUUID()
        localStorage.setItem(USER_TOKEN_KEY, token)
        localStorage.setItem(USER_KEY, JSON.stringify(localUser))
        setUser(localUser)
        return { error: null }
      } catch {
        return { error: 'Unable to sign in at this time. Please try again.' }
      }
    }
  }

  async function userSignOut() {
    const token = localStorage.getItem(USER_TOKEN_KEY)
    if (token && !token.startsWith('local-')) {
      try {
        await fetch(getUserFunctionUrl('user-logout'), {
          method: 'POST',
          headers: getTokenHeaders(token),
        })
      } catch { /* ignore */ }
    }
    localStorage.removeItem(USER_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  // ==================== ADMIN AUTH ====================

  async function adminRegister({ name, email, password, avatar_url }: { name: string; email: string; password: string; avatar_url?: string }) {
    try {
      const res = await fetch(getAdminFunctionUrl('admin-register'), {
        method: 'POST',
        headers: getAnonHeaders(),
        body: JSON.stringify({ name, email, password, avatar_url }),
      })

      if (!res.ok) {
        let message = 'Registration failed. Please try again.'
        try {
          const data = await res.json()
          message = data.error || message
        } catch { /* keep default */ }
        return { error: message }
      }

      const data = await res.json()
      if (!data.admin) {
        return { error: 'Registration failed. Please try again.' }
      }

      return { error: null }
    } catch {
      try {
        const locals = getLocalAdmins()
        if (locals.some((a) => a.email === email)) {
          return { error: 'An admin with this email already exists' }
        }
        const newAdmin: LocalAdmin = {
          id: crypto.randomUUID(),
          name,
          email,
          password,
          avatar_url: avatar_url || null,
        }
        locals.push(newAdmin)
        localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(locals))
        return { error: null }
      } catch {
        return { error: 'Unable to register at this time. Please try again.' }
      }
    }
  }

  async function adminSignIn(email: string, password: string) {
    try {
      const res = await fetch(getAdminFunctionUrl('admin-login'), {
        method: 'POST',
        headers: getAnonHeaders(),
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        let message = 'Invalid email or password'
        try {
          const data = await res.json()
          message = data.error || message
        } catch { /* keep default */ }
        return { error: message }
      }

      const data = await res.json()
      if (!data.token || !data.admin) {
        return { error: 'Login failed. Please try again.' }
      }

      localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
      localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin))
      setAdmin(data.admin)
      return { error: null }
    } catch {
      try {
        const locals = getLocalAdmins()
        const match = locals.find((a) => a.email === email && a.password === password)
        if (!match) {
          return { error: 'Invalid email or password' }
        }
        const localAdmin: AdminUser = {
          id: match.id,
          name: match.name,
          email: match.email,
          avatar_url: match.avatar_url,
        }
        const token = 'local-' + crypto.randomUUID()
        localStorage.setItem(ADMIN_TOKEN_KEY, token)
        localStorage.setItem(ADMIN_KEY, JSON.stringify(localAdmin))
        setAdmin(localAdmin)
        return { error: null }
      } catch {
        return { error: 'Unable to sign in at this time. Please try again.' }
      }
    }
  }

  async function adminSignOut() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (token && !token.startsWith('local-')) {
      try {
        await fetch(getAdminFunctionUrl('admin-logout'), {
          method: 'POST',
          headers: getTokenHeaders(token),
        })
      } catch { /* ignore */ }
    }
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_KEY)
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{
      admin, user, loading,
      userSignIn, userRegister, userSignOut,
      adminSignIn, adminRegister, adminSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
