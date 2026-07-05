"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { motion } from "framer-motion"
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function LoginForm({ role, title }: { role: string, title: string }) {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Custom Math CAPTCHA state
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [captchaAnswer, setCaptchaAnswer] = useState("")
  const [mounted, setMounted] = useState(false)
  

  
  useEffect(() => {
    setNum1(Math.floor(Math.random() * 10) + 1)
    setNum2(Math.floor(Math.random() * 10) + 1)
    setMounted(true)
  }, [])

  const router = useRouter()

  const regenerateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1)
    setNum2(Math.floor(Math.random() * 10) + 1)
    setCaptchaAnswer("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (parseInt(captchaAnswer) !== num1 + num2) {
      setError("Incorrect CAPTCHA answer. Please try again.")
      regenerateCaptcha()
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portalRole: role }),
      })

      const data = await res.json()

      if (res.ok) {
        login(data.token, data.user)
      } else {
        setError(data.message || "Invalid credentials. Please check your email and password.")
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.")
    } finally {
      setLoading(false)
      if (error) regenerateCaptcha()
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
                  type="text" 
                  placeholder="Username" 
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

              {/* CAPTCHA Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground ml-1">
                  Security Check: What is {mounted ? num1 : 0} + {mounted ? num2 : 0}?
                </label>
                <Input 
                  id="captcha" 
                  type="text" 
                  placeholder="Answer"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="h-12 bg-background/50 border-white/10 focus-visible:ring-primary"
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
