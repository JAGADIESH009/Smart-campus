"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { motion } from "framer-motion"
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

export function LoginForm({ role, title }: { role: string, title: string }) {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError("")

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || "Invalid credentials. Please check your email and password.")
        setLoading(false)
        return
      }

      if (data.user) {
        const userRole = data.user.user_metadata?.role || 'STUDENT'
        
        // Only Admin can login through Faculty portal and bypass role check
        if (role === 'FACULTY' && userRole === 'ADMIN') {
          login({
            id: data.user.id,
            email: data.user.email!,
            role: userRole,
            name: data.user.user_metadata?.name,
          })
          router.push('/admin')
          return
        }

        // Enforce strict portal-role matching
        if (role !== userRole) {
          setError(`Invalid credentials for this portal. You belong to the ${userRole} portal.`)
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        login({
          id: data.user.id,
          email: data.user.email!,
          role: userRole,
          name: data.user.user_metadata?.name,
        })
        
        // Redirect to respective dashboard
        if (userRole === 'ADMIN') router.push('/admin')
        else if (userRole === 'FACULTY') router.push('/faculty')
        else if (userRole === 'ALUMNI') router.push('/alumni')
        else router.push('/student')
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10 px-6"
      >
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>
        
        <Card className="glass border-white/10 shadow-2xl bg-card/60 backdrop-blur-xl">
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Lock className="text-white w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6">
              <div className="space-y-2 relative">
                <Mail className="absolute left-3 top-3 text-muted-foreground w-5 h-5" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-white/10 focus-visible:ring-primary"
                  required 
                />
              </div>
              <div className="space-y-2 relative">
                <Lock className="absolute left-3 top-3 text-muted-foreground w-5 h-5" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-white/10 focus-visible:ring-primary"
                  required 
                />
              </div>
              
              <motion.div 
                initial={false} 
                animate={{ height: error ? "auto" : 0, opacity: error ? 1 : 0 }} 
                className="overflow-hidden"
              >
                <p className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-lg border border-destructive/20 font-medium">
                  {error}
                </p>
              </motion.div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                className="w-full h-12 text-md font-semibold text-white shadow-lg shadow-primary/25 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Secure Sign In"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
