"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookOpen, Calendar, GraduationCap, CheckCircle2, Clock, AlertCircle, IndianRupee, FileText } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function StudentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return
      
      try {
        const { data: studentData } = await supabase.from('Student')
          .select('id, sectionId, cgpa, user:User(profile:UserProfile(firstName, lastName))')
          .eq('userId', user.id).single()
          
        const studentId = studentData?.id
        if (studentData) {
          const userObj = Array.isArray(studentData.user) ? studentData.user[0] : studentData.user
          const prof = Array.isArray(userObj?.profile) ? userObj?.profile[0] : userObj?.profile
          setProfile(prof)
        }

        if (studentId) {
          const { data: attendances } = await supabase.from('AttendanceRecord').select('status').eq('studentId', studentId)
          const totalAtt = attendances?.length || 0
          const presentAtt = attendances?.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'ON_DUTY').length || 0
          const attPercent = totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(1) : "0.0"

          const currentDay = new Date().getDay()
          const { data: todaysClassesData } = await supabase.from('Timetable')
            .select('id, startTime, endTime, room, building, subject:Subject(name, code)')
            .eq('sectionId', studentData.sectionId)
            .eq('dayOfWeek', currentDay)
            .order('startTime', { ascending: true })
          
          const { data: pendingAssignmentsData } = await supabase.from('AssignmentSubmission')
            .select('id, status, assignment:Assignment(title, dueDate, subject:Subject(name))')
            .eq('studentId', studentId)
            .eq('status', 'PENDING')
            .order('assignment(dueDate)', { ascending: true })
            .limit(3)
            
          const { data: fees } = await supabase.from('Fee')
            .select('amount, status, title')
            .eq('studentId', studentId)
            .eq('status', 'PENDING')

          const pendingFeeTotal = fees?.reduce((sum, f) => sum + f.amount, 0) || 0

          setData({
            attendancePercent: parseFloat(attPercent),
            cgpa: studentData?.cgpa || 0.0,
            pendingAssignmentsCount: pendingAssignmentsData?.length || 0,
            upcomingAssignments: pendingAssignmentsData || [],
            todaysClasses: todaysClassesData || [],
            pendingFeeTotal
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

  // Circular Progress Calculation
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const att = data?.attendancePercent || 0
  const strokeDashoffset = circumference - (att / 100) * circumference
  const colorClass = att >= 75 ? "text-green-500" : att >= 60 ? "text-yellow-500" : "text-red-500"

  // Mock chart data
  const chartData = [
    { name: 'Week 1', attendance: 100 },
    { name: 'Week 2', attendance: 85 },
    { name: 'Week 3', attendance: 90 },
    { name: 'Week 4', attendance: 80 },
    { name: 'Week 5', attendance: Math.round(att) },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.firstName || 'Student'}</h1>
          <p className="text-muted-foreground mt-1 text-lg">Here's your academic overview for Fall 2026.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-card/60 p-3 rounded-2xl glass border border-white/5">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r={radius} className="text-muted/30 stroke-current" strokeWidth="6" fill="transparent" />
              <circle cx="40" cy="40" r={radius} className={`${colorClass} stroke-current transition-all duration-1000 ease-in-out`} strokeWidth="6" strokeLinecap="round" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-lg font-bold ${colorClass}`}>{att}%</span>
            </div>
          </div>
          <div className="pr-2">
            <div className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Overall Attendance</div>
            {att < 75 && <div className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle size={12}/> Low Attendance Warning</div>}
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="CGPA" value={`${data?.cgpa}`} icon={GraduationCap} />
        <StatCard title="Pending Assignments" value={`${data?.pendingAssignmentsCount}`} icon={BookOpen} />
        <StatCard title="Classes Today" value={`${data?.todaysClasses?.length || 0}`} icon={Calendar} />
        <Card className="glass border-white/10 shadow-xl bg-card/60 hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fee Dues</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <IndianRupee className="w-5 h-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">₹{data?.pendingFeeTotal.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-white/10 shadow-xl bg-card/60">
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#88888844" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="attendance" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 shadow-xl bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Timetable</CardTitle>
                <CardDescription>Your schedule for the day</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.location.href='/student/timetable'}>View Full</Button>
            </CardHeader>
            <CardContent>
              {data?.todaysClasses && data.todaysClasses.length > 0 ? (
                <div className="space-y-3">
                  {data.todaysClasses.map((cls: any, i: number) => {
                    const subj = cls.subject ? (Array.isArray(cls.subject) ? cls.subject[0] : cls.subject) : null
                    const isLunch = !subj
                    return (
                      <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${isLunch ? 'bg-muted/30 border-dashed border-white/10' : 'bg-primary/5 border-primary/10 hover:bg-primary/10 transition-colors'}`}>
                        <div className={`p-3 rounded-lg shrink-0 ${isLunch ? 'bg-muted/50 text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`font-bold ${isLunch ? 'text-muted-foreground' : ''}`}>{isLunch ? 'Lunch Break' : `${subj?.name} (${subj?.code})`}</h4>
                          <p className="text-sm text-muted-foreground">
                            {cls.startTime} - {cls.endTime} {cls.room ? `• ${cls.room}` : ''} {cls.building ? `(${cls.building})` : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed border-white/10 rounded-xl">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <p className="text-muted-foreground">No classes scheduled for today!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          <Card className="glass border-white/10 shadow-xl bg-card/60">
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.upcomingAssignments && data.upcomingAssignments.length > 0 ? (
                <div className="space-y-4">
                  {data.upcomingAssignments.map((sub: any, i: number) => {
                    const assign = Array.isArray(sub.assignment) ? sub.assignment[0] : sub.assignment
                    const subj = Array.isArray(assign.subject) ? assign.subject[0] : assign.subject
                    return (
                      <div key={i} className="p-4 rounded-xl bg-card border border-white/5 shadow-sm">
                        <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">{subj?.name}</div>
                        <h4 className="font-bold line-clamp-1">{assign.title}</h4>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar size={12} /> Due: {new Date(assign.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    )
                  })}
                  <Button variant="outline" className="w-full" onClick={() => window.location.href='/student/assignments'}>View All Assignments</Button>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-6">
                  No pending assignments.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-white/10 shadow-xl bg-card/60">
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                 <h4 className="font-bold text-secondary mb-1 flex items-center gap-2"><FileText size={16}/> Fall Festival 2026</h4>
                 <p className="text-sm text-muted-foreground">Register before Oct 15th to participate in the cultural events.</p>
               </div>
               <div className="p-4 rounded-xl bg-card border border-white/5 shadow-sm">
                 <h4 className="font-bold mb-1 flex items-center gap-2"><Clock size={16}/> Library Hours Extended</h4>
                 <p className="text-sm text-muted-foreground">The central library will now remain open until midnight.</p>
               </div>
            </CardContent>
          </Card>
        </div>
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
