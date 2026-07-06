"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, GraduationCap, CheckCircle2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from "@/utils/supabase/client"

export default function StudentDashboard() {
  const { token, user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return
      
      try {
        const { data: studentData } = await supabase.from('Student').select('id, sectionId').eq('userId', user.id).single()
        const studentId = studentData?.id

        if (studentId) {
          const { data: attendances } = await supabase.from('AttendanceRecord').select('status').eq('studentId', studentId)
          const totalAtt = attendances?.length || 0
          const presentAtt = attendances?.filter((a: any) => a.status === 'PRESENT').length || 0
          const attPercent = totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(1) : "92.5"

          const { count: classesCount } = await supabase.from('Timetable').select('*', { count: 'exact', head: true }).eq('sectionId', studentData.sectionId).eq('dayOfWeek', new Date().getDay())

          setData({
            attendancePercent: attPercent,
            cgpa: "8.7",
            pendingAssignments: 3,
            todaysClasses: classesCount || 0
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

  // Mock chart data for attendance trend over last 6 weeks
  const chartData = [
    { name: 'Week 1', attendance: 100 },
    { name: 'Week 2', attendance: 85 },
    { name: 'Week 3', attendance: 90 },
    { name: 'Week 4', attendance: 80 },
    { name: 'Week 5', attendance: Math.round(data?.attendancePercent || 85) },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.email.split('@')[0].toUpperCase()}</h1>
        <p className="text-muted-foreground mt-1 text-lg">Here's your academic overview for Fall 2026.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Attendance" value={`${data?.attendancePercent}%`} icon={CheckCircle2} />
        <StatCard title="CGPA" value={`${data?.cgpa}`} icon={GraduationCap} />
        <StatCard title="Pending Assignments" value={`${data?.pendingAssignments}`} icon={BookOpen} />
        <StatCard title="Classes Today" value={`${data?.todaysClasses}`} icon={Calendar} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass border-white/10 shadow-xl bg-card/60">
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
               <h4 className="font-bold text-primary mb-1">Fall Festival 2026 Registration</h4>
               <p className="text-sm text-muted-foreground">Register before Oct 15th to participate in the cultural events.</p>
             </div>
             <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
               <h4 className="font-bold text-secondary mb-1">Library Hours Extended</h4>
               <p className="text-sm text-muted-foreground">The central library will now remain open until midnight.</p>
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
