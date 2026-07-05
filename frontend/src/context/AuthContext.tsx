"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

type User = {
  id: string
  email: string
  role: string
  name?: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check local storage for token on mount
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isLoading) return

    // Simple route protection
    const isAuthRoute = pathname.startsWith('/login')
    const isDashboardRoute = pathname.startsWith('/student') || pathname.startsWith('/faculty') || pathname.startsWith('/admin') || pathname.startsWith('/alumni')
    
    if (!token && isDashboardRoute) {
      router.push('/')
    } else if (token && user) {
      // Prevent cross-portal access
      if (pathname.startsWith('/admin') && user.role !== 'ADMIN') router.push('/')
      if (pathname.startsWith('/faculty') && user.role !== 'FACULTY') router.push('/')
      if (pathname.startsWith('/student') && user.role !== 'STUDENT') router.push('/')
      if (pathname.startsWith('/alumni') && user.role !== 'ALUMNI') router.push('/')
      
      // Redirect away from login if already authenticated
      if (isAuthRoute) {
        if (user.role === 'ADMIN') router.push('/admin')
        else if (user.role === 'FACULTY') router.push('/faculty')
        else if (user.role === 'ALUMNI') router.push('/alumni')
        else router.push('/student')
      }
    }
  }, [user, token, pathname, isLoading, router])

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken)
    localStorage.setItem("user", JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
