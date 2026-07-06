"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type User = {
  id: string
  email: string
  role: string
  name?: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (user: User) => void
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setToken(session.access_token)
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: session.user.user_metadata?.role || 'STUDENT',
          name: session.user.user_metadata?.name || '',
        })
      } else {
        setToken(null)
        setUser(null)
      }
      setIsLoading(false)
    }

    fetchSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setToken(session.access_token)
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: session.user.user_metadata?.role || 'STUDENT',
          name: session.user.user_metadata?.name || '',
        })
      } else {
        setToken(null)
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    if (isLoading) return

    // Route protection logic
    const isAuthRoute = pathname.startsWith('/login')
    const isDashboardRoute = pathname.startsWith('/student') || pathname.startsWith('/faculty') || pathname.startsWith('/admin') || pathname.startsWith('/alumni')
    
    if (!user && isDashboardRoute) {
      router.push('/')
    } else if (user) {
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
  }, [user, pathname, isLoading, router])

  const login = (newUser: User) => {
    setUser(newUser)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setToken(null)
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
