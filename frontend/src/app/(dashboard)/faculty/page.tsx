"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, FileText, Calendar, Clock, BookOpen, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return
      
      try {
        const { data: facultyData } = await supabase.from('Faculty')
          .select('id, user:User(profile:UserProfile(firstName, lastName))')
          .eq('userId', user.id).single()
          
        const facultyId = facultyData?.id
        if (facultyData) {
          const userObj = Array.isArray(facultyData.user) ? facultyData.user[0] : facultyData.user
          const prof = Array.isArray(userObj?.profile) ? userObj?.profile[0] : userObj?.profile
          setProfile(prof)
        }

        if (facultyId) {
          const { count: subjectsCount } = await supabase.from('Subject').select('*', { count: 'exact', head: true }).eq('facultyId', facultyId)
          
          const currentDay = new Date().getDay()
          const { data: todaysClassesData } = await supabase.from('Timetable')
            .select('id, startTime, endTime, room, building, subject:Subject(name, code)')
            .eq('facultyId', facultyId)
            .eq('dayOfWeek', currentDay)
            .order('startTime', { ascending: true })

          // Count pending reviews across all assignments of this faculty
          const { data: assignments } = await supabase.from('Assignment')
            .select('id, submissions:AssignmentSubmission(status)')
            .eq('subject.facultyId', facultyId) // Note: this inner join filter might not work perfectly without an RPC, but we'll fetch subjects first.

          // Better approach for pending reviews:
          const { data: mySubjects } = await supabase.from('Subject').select('id').eq('facultyId', facultyId)
          const subIds = (mySubjects || []).map(s => s.id)
          let pendingCount = 0
          if (subIds.length > 0) {
            const { data: myAssignments } = await supabase.from('Assignment').select('id, submissions:AssignmentSubmission(status)').in('subjectId', subIds)
            if (myAssignments) {
              myAssignments.forEach((a: any) => {
                a.submissions.forEach((sub: any) => {
                  if (sub.status === 'PENDING') pendingCount++
                })
              })
            }
          }

          setData({
            totalStudents: (subjectsCount || 0) * 45, // Approximation for now
            subjectsTeaching: subjectsCount || 0,
            pendingReviews: pendingCount,
            todaysClasses: todaysClassesData || []
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading dashboard...</div>

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {profile?.firstName || 'Faculty'} {profile?.lastName || ''}</h1>
        <p className="text-muted-foreground mt-1 text-lg">Here is your faculty portal overview.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students (Est.)" value={`${data?.totalStudents || 0}`} icon={Users} />
        <StatCard title="Subjects Taught" value={`${data?.subjectsTeaching || 0}`} icon={BookOpen} />
        <StatCard title="Pending Grading" value={`${data?.pendingReviews || 0}`} icon={FileText} />
        <StatCard title="Classes Today" value={`${data?.todaysClasses?.length || 0}`} icon={Calendar} />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass border-white/10 shadow-xl bg-card/60">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.todaysClasses && data.todaysClasses.length > 0 ? (
              <div className="space-y-4">
                {data.todaysClasses.map((cls: any, i: number) => {
                  const subj = Array.isArray(cls.subject) ? cls.subject[0] : cls.subject
                  return (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                      <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold">{subj?.name} ({subj?.code})</h4>
                        <p className="text-sm text-muted-foreground">
                          {cls.startTime} - {cls.endTime} • {cls.room} {cls.building ? `(${cls.building})` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed border-white/10 rounded-xl">
                <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
                <p className="text-muted-foreground">No classes scheduled for today.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/10 shadow-xl bg-card/60">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates on your courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8 border border-dashed border-white/10 rounded-xl flex flex-col items-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
              <p className="text-muted-foreground">No recent activity to display.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon }: { title: string, value: string, icon: any }) {
  return (
    <Card className="glass border-white/10 shadow-xl bg-card/60 hover:bg-card/80 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
