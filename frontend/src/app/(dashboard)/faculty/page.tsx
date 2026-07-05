"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Calendar, Clock } from "lucide-react"

export default function FacultyDashboard() {
  const { token, user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    fetch("http://localhost:5000/api/faculty/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(resData => {
      setData(resData)
      setLoading(false)
    })
    .catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [token])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading dashboard...</div>

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.email.split('@')[0].toUpperCase()}</h1>
        <p className="text-muted-foreground mt-1 text-lg">Here is your faculty portal overview.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={`${data?.totalStudents || 0}`} icon={Users} />
        <StatCard title="Subjects Teaching" value={`${data?.subjectsTeaching || 0}`} icon={BookOpen} />
        <StatCard title="Pending Reviews" value={`${data?.pendingReviews || 0}`} icon={FileText} />
        <StatCard title="Classes Today" value={`${data?.todaysClasses || 0}`} icon={Calendar} />
      </div>
      
      {/* Mock class schedule for faculty */}
      <Card className="glass border-white/10 shadow-xl bg-card/60">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="p-3 bg-primary/10 text-primary rounded-lg">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Database Management Systems (CS301)</h4>
                  <p className="text-sm text-muted-foreground">09:00 AM - 10:30 AM • Room 301</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/5 border border-secondary/10">
                <div className="p-3 bg-secondary/10 text-secondary rounded-lg">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Artificial Intelligence (CS401)</h4>
                  <p className="text-sm text-muted-foreground">11:00 AM - 12:30 PM • Lab 4A</p>
                </div>
              </div>
            </div>
          </CardContent>
      </Card>
    </div>
  )
}

function BookOpen(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
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
