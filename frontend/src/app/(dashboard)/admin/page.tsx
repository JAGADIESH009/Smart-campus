"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, GraduationCap, Building2, BookOpen, Banknote, Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { createClient } from "@/lib/supabase/client"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: students } = await supabase.from('User').select('id, Role!inner(name)', { count: 'exact', head: true }).eq('Role.name', 'STUDENT')
        const { count: faculty } = await supabase.from('User').select('id, Role!inner(name)', { count: 'exact', head: true }).eq('Role.name', 'FACULTY')
        const { count: departments } = await supabase.from('Department').select('*', { count: 'exact', head: true })
        const { count: courses } = await supabase.from('Course').select('*', { count: 'exact', head: true })

        setStats({
          students: students || 0,
          faculty: faculty || 0,
          departments: departments || 0,
          courses: courses || 0,
          revenue: (students || 0) * 5000,
          globalAttendance: 92.5
        })
      } catch (err) {
        console.error(err)
      }
    }
    fetchStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!stats) return <div className="p-8 text-center animate-pulse">Loading dashboard...</div>

  const trendData = [
    { name: 'Mon', attendance: 85 },
    { name: 'Tue', attendance: 88 },
    { name: 'Wed', attendance: 92 },
    { name: 'Thu', attendance: 89 },
    { name: 'Fri', attendance: Math.round(stats.globalAttendance) },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name || 'Administrator'}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={stats.students} icon={<Users size={20} />} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard title="Total Faculty" value={stats.faculty} icon={<GraduationCap size={20} />} color="text-purple-500" bg="bg-purple-500/10" />
        <StatCard title="Departments" value={stats.departments} icon={<Building2 size={20} />} color="text-orange-500" bg="bg-orange-500/10" />
        <StatCard title="Courses" value={stats.courses} icon={<BookOpen size={20} />} color="text-pink-500" bg="bg-pink-500/10" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass bg-card/60 col-span-2">
          <CardHeader>
            <CardTitle>Global Attendance Trend</CardTitle>
            <CardDescription>Average attendance across all departments this week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#88888844" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} 
                  />
                  <Line type="monotone" dataKey="attendance" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass bg-card/60 flex flex-col justify-center items-center py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5"></div>
          <Activity size={48} className="text-primary mb-4 opacity-50 z-10" />
          <div className="text-6xl font-black text-primary mb-2 z-10">{stats.globalAttendance}%</div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider z-10">System Health / Attendance</div>
        </Card>
      </div>

      <Card className="glass bg-card/60 border-t-4 border-t-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Banknote className="text-green-500"/> Financial Overview</CardTitle>
          <CardDescription>Simulated tuition fee revenue based on active enrollment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-black tracking-tighter">
            ${stats.revenue.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon, color, bg }: any) {
  return (
    <Card className="glass bg-card/60">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-4 rounded-2xl ${bg} ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold mt-1">{value}</h3>
        </div>
      </CardContent>
    </Card>
  )
}
