"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserCircle, MapPin, Phone, Mail, GraduationCap, Calendar, Download, Edit2, ShieldAlert } from "lucide-react"

export default function ProfilePage() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!token) return

    fetch("http://localhost:5000/api/student/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setProfile(data)
      setLoading(false)
    })
    .catch(console.error)
  }, [token])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading profile...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal and academic information.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/10 glass">
            <Download size={16} className="mr-2"/> Download ID Card
          </Button>
          <Button onClick={() => setIsEditing(!isEditing)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
            <Edit2 size={16} className="mr-2"/> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column - Avatar & Core Info */}
        <div className="space-y-6 md:col-span-1">
          <Card className="glass bg-card/60 text-center py-8">
            <div className="mx-auto w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mb-4 relative group">
              {profile.profilePhoto ? (
                <img src={`http://localhost:5000${profile.profilePhoto}`} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-primary">{profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}</span>
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Change Photo</span>
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
            <p className="text-primary font-medium">{profile.department?.name}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-wider">
              {profile.academicStatus}
            </div>
          </Card>

          <Card className="glass bg-card/60">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-lg">Academic Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm font-medium">CGPA</span>
                <span className="font-bold">{profile.cgpa || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm font-medium">Credits Earned</span>
                <span className="font-bold">{profile.creditsEarned || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm font-medium">Current Semester</span>
                <span className="font-bold">Semester {profile.currentSemester || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glass bg-card/60 relative overflow-hidden">
            <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center gap-2">
              <GraduationCap className="text-primary" size={20} />
              <CardTitle className="text-xl m-0">Academic Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <DetailField label="Registration Number" value={profile.registrationNo} icon={<ShieldAlert size={14}/>} />
                <DetailField label="Roll Number" value={profile.rollNumber} icon={<ShieldAlert size={14}/>} />
                <DetailField label="Course" value={profile.course?.name} />
                <DetailField label="Branch" value={profile.branch} />
                <DetailField label="Section" value={profile.section?.name || 'Unassigned'} />
                <DetailField label="Batch Year" value={profile.batch || '2023-2027'} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass bg-card/60 relative overflow-hidden">
            <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center gap-2">
              <UserCircle className="text-primary" size={20} />
              <CardTitle className="text-xl m-0">Personal & Contact</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <DetailField label="Email Address" value={profile.user?.email} icon={<Mail size={14}/>} />
                <DetailField label="Phone Number" value={profile.contactNumber || 'Not provided'} icon={<Phone size={14}/>} editable={isEditing} />
                <DetailField label="Date of Birth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'} icon={<Calendar size={14}/>} />
                <DetailField label="Blood Group" value={profile.bloodGroup || 'Not provided'} editable={isEditing} />
                <DetailField label="Aadhaar / ID" value={profile.aadhaarNumber || 'Not provided'} />
                <DetailField label="Parent/Guardian Name" value={profile.parentName || 'Not provided'} editable={isEditing} />
                <DetailField label="Parent Contact" value={profile.parentContact || 'Not provided'} editable={isEditing} />
                <div className="sm:col-span-2">
                  <DetailField label="Permanent Address" value={profile.address || 'Not provided'} icon={<MapPin size={14}/>} editable={isEditing} fullWidth />
                </div>
              </div>
              
              {isEditing && (
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <Button className="bg-primary text-primary-foreground shadow-lg px-8">Save Changes</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DetailField({ label, value, icon, editable = false, fullWidth = false }: any) {
  return (
    <div className={`space-y-1.5 ${fullWidth ? 'w-full' : ''}`}>
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        {icon && <span className="opacity-70">{icon}</span>}
        {label}
      </label>
      {editable ? (
        <Input defaultValue={value !== 'Not provided' ? value : ''} className="bg-background/50 border-white/10 h-9" />
      ) : (
        <div className="font-medium text-[15px]">{value}</div>
      )}
    </div>
  )
}
