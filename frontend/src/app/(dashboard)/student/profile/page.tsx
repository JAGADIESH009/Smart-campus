"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { User, Phone, MapPin, Mail, Calendar, Droplet, Hash, BookOpen, GraduationCap, Users } from "lucide-react"

export default function StudentProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      
      try {
        const { data } = await supabase
          .from('User')
          .select(`
            email,
            profile:UserProfile(*),
            student:Student(
              registrationNo, 
              rollNumber, 
              cgpa,
              parentName,
              parentContact,
              Department(name),
              Course(name),
              Section(name),
              Semester(name)
            )
          `)
          .eq('id', user.id)
          .single()
          
        if (data) {
          setProfile(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading profile information...</div>
  if (!profile) return <div className="p-8 text-center text-red-500">Failed to load profile.</div>

  const p = profile.profile[0] || {}
  const s = profile.student[0] || {}

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
        <p className="text-muted-foreground mt-1">Your personal and academic information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Personal Info */}
        <Card className="glass md:col-span-1 border-white/10 shadow-xl bg-card/60">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-4 border-2 border-primary/50">
              <User className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">{p.firstName} {p.lastName}</CardTitle>
            <CardDescription className="text-primary font-medium">{s.rollNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 mt-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{p.contactNumber || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Droplet className="w-4 h-4 text-muted-foreground" />
              <span>Blood Group: {p.bloodGroup || 'N/A'}</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="leading-tight">{p.address || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {/* Academic Info */}
          <Card className="glass border-white/10 shadow-xl bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Academic Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/> Department</p>
                  <p className="font-medium">{s.Department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5"/> Course</p>
                  <p className="font-medium">{s.Course?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5"/> Registration No.</p>
                  <p className="font-medium font-mono text-sm">{s.registrationNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Current Semester</p>
                  <p className="font-medium">{s.Semester?.name || 'N/A'} ({s.Section?.name || 'N/A'})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent/Guardian Info */}
          <Card className="glass border-white/10 shadow-xl bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Parent & Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Parent/Guardian Name</p>
                  <p className="font-medium">{s.parentName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Contact Number</p>
                  <p className="font-medium">{s.parentContact || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
