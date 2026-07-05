"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, ArrowLeft } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function FacultyStudent360Page({ params }: { params: { id: string } }) {
  const { token } = useAuth()
  const searchParams = useSearchParams()
  const subjectId = searchParams.get('subjectId')
  const sectionId = searchParams.get('sectionId')
  
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!params.id) return
    
    const fetchStudent = async () => {
      try {
        const { data: studentData, error } = await supabase.from('Student').select(`
          id, rollNumber, registrationNo,
          user:User(
            email,
            profile:UserProfile(firstName, lastName, profilePhoto)
          ),
          attendances:AttendanceRecord(id, status),
          submissions:AssignmentSubmission(id)
        `).eq('id', params.id).single()

        if (error) throw error

        if (studentData) {
          const userObj = Array.isArray(studentData.user) ? studentData.user[0] : studentData.user
          const profile = userObj?.profile ? (Array.isArray(userObj.profile) ? userObj.profile[0] : userObj.profile) : null
          const totalAtt = Array.isArray(studentData.attendances) ? studentData.attendances.length : 0
          const presentAtt = Array.isArray(studentData.attendances) ? studentData.attendances.filter((a: any) => a.status === 'PRESENT').length : 0
          const attPercent = totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(1) : "100.0"

          setStudent({
            id: studentData.id,
            name: `${profile?.firstName || 'Unknown'} ${profile?.lastName || ''}`,
            registrationNo: studentData.registrationNo,
            rollNumber: studentData.rollNumber,
            email: userObj?.email || '',
            profilePhoto: profile?.profilePhoto,
            attendancePercent: attPercent,
            submissionsCount: Array.isArray(studentData.submissions) ? studentData.submissions.length : 0
          })
        }
      } catch (err) {
        console.error("Failed to fetch student profile:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStudent()
  }, [params.id])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading student profile...</div>
  if (!student) return <div className="p-8 text-center">Student not found.</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div>
        <a href="/faculty/students" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Back to Students
        </a>
        <h1 className="text-3xl font-bold tracking-tight">Student 360° Profile</h1>
        <p className="text-muted-foreground mt-1">Comprehensive analytics and academic performance view.</p>
      </div>

      <Card className="glass w-full overflow-hidden bg-card shadow-xl border-white/10">
        <CardHeader className="bg-card/80 backdrop-blur-xl border-b border-white/5 py-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-4xl shadow-inner overflow-hidden">
              {student.profilePhoto ? <img src={student.profilePhoto.startsWith('http') ? student.profilePhoto : `http://localhost:5000${student.profilePhoto}`} className="w-full h-full object-cover"/> : student.name.charAt(0)}
            </div>
            <div className="text-center sm:text-left">
              <CardTitle className="text-3xl font-black">{student.name}</CardTitle>
              <CardDescription className="font-mono mt-1 text-base">{student.registrationNo} • {student.rollNumber}</CardDescription>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {student.email}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-background/50 border-white/5 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Calendar size={18} className="text-primary"/> Attendance Analytics</CardTitle></CardHeader>
              <CardContent>
                <div className="text-5xl font-black mb-2" style={{ color: parseFloat(student.attendancePercent) >= 75 ? '#10b981' : '#ef4444' }}>
                  {student.attendancePercent}%
                </div>
                <p className="text-sm text-muted-foreground">Current overall attendance for this subject.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 border-white/5 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><FileText size={18} className="text-primary"/> Academic Performance</CardTitle></CardHeader>
              <CardContent>
                  <div className="text-5xl font-black mb-2 text-blue-500">
                  {student.submissionsCount}
                </div>
                <p className="text-sm text-muted-foreground">Assignments submitted for this subject.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 border-white/5 md:col-span-2 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3 border-b border-white/5"><CardTitle className="text-lg">Faculty Remarks & Confidential Notes</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <textarea 
                  placeholder="Add confidential faculty remarks regarding this student's performance... (Not visible to student)"
                  className="w-full bg-background border border-white/10 rounded-xl p-4 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                />
                <div className="mt-4 flex justify-end">
                  <Button className="shadow-lg">Save Note</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
