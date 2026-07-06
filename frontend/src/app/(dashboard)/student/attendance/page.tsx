"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, CheckCircle2, XCircle, Clock, FileWarning, AlertTriangle } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

import { createClient } from "@/utils/supabase/client"

export default function AttendanceAnalyticsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user) return
      
      try {
        const { data: studentData } = await supabase.from('Student').select('id, courseId').eq('userId', user.id).single()
        if (!studentData) return

        const { data: records } = await supabase.from('AttendanceRecord').select(`
          status, remarks,
          attendance:Attendance(
            date, hour,
            subject:Subject(name)
          )
        `).eq('studentId', studentData.id).order('createdAt', { ascending: false })

        if (records) {
          const logs = records.map((r: any) => {
            const att = Array.isArray(r.attendance) ? r.attendance[0] : r.attendance
            const subj = Array.isArray(att?.subject) ? att.subject[0] : att?.subject
            return {
              date: att?.date,
              hour: att?.hour,
              subject: { name: subj?.name },
              status: r.status,
              remarks: r.remarks
            }
          })

          const summary = { present: 0, absent: 0, late: 0, medical: 0, duty: 0, total: logs.length }
          const subjectCounts: Record<string, { present: number, total: number }> = {}

          logs.forEach((log: any) => {
            if (log.status === 'PRESENT') summary.present++
            else if (log.status === 'ABSENT') summary.absent++
            else if (log.status === 'LATE') summary.late++
            else if (log.status === 'MEDICAL') summary.medical++
            else if (log.status === 'DUTY') summary.duty++
            
            const subjName = log.subject.name || 'Unknown'
            if (!subjectCounts[subjName]) subjectCounts[subjName] = { present: 0, total: 0 }
            subjectCounts[subjName].total++
            if (log.status === 'PRESENT') subjectCounts[subjName].present++
          })

          const subjectStats = Object.keys(subjectCounts).map(name => ({
            name,
            percentage: Math.round((subjectCounts[name].present / subjectCounts[name].total) * 100)
          }))

          setData({ logs, summary, subjectStats })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading analytics...</div>

  const { logs, summary, subjectStats } = data
  const overallPercentage = summary.total > 0 ? (summary.present / summary.total) * 100 : 100

  const pieData = [
    { name: 'Present', value: summary.present, color: '#10b981' }, // green
    { name: 'Absent', value: summary.absent, color: '#ef4444' }, // red
    { name: 'Late', value: summary.late, color: '#f59e0b' }, // yellow
    { name: 'Leave', value: summary.medical + summary.duty, color: '#3b82f6' }, // blue
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive view of your class participation.</p>
        </div>
        {overallPercentage < 75 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
            <AlertTriangle size={20} />
            <span className="font-semibold text-sm">Warning: Attendance below 75% required minimum</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass bg-card/60 relative overflow-hidden flex flex-col justify-center items-center py-6">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="text-5xl font-black text-primary mb-2 z-10">{overallPercentage.toFixed(1)}%</div>
          <div className="text-sm font-medium text-muted-foreground z-10 uppercase tracking-wider">Overall Attendance</div>
        </Card>
        
        <StatBlock title="Present" value={summary.present} total={summary.total} color="text-green-500" bg="bg-green-500/10" icon={<CheckCircle2 size={18}/>}/>
        <StatBlock title="Absent" value={summary.absent} total={summary.total} color="text-red-500" bg="bg-red-500/10" icon={<XCircle size={18}/>}/>
        <StatBlock title="Late / Leave" value={summary.late + summary.medical + summary.duty} total={summary.total} color="text-yellow-500" bg="bg-yellow-500/10" icon={<Clock size={18}/>}/>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass bg-card/60 col-span-1">
          <CardHeader>
            <CardTitle>Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass bg-card/60 col-span-2">
          <CardHeader>
            <CardTitle>Subject-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectStats} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#88888844" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} 
                  />
                  <Bar dataKey="percentage" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Timeline History</CardTitle>
            <CardDescription>Chronological log of your attendance</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Hour</th>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs.slice(0, 15).map((log: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Calendar size={14} className="text-muted-foreground"/> 
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">Period {log.hour || '-'}</td>
                    <td className="px-6 py-4 font-medium">{log.subject.name}</td>
                    <td className="px-6 py-4">
                      {log.status === 'PRESENT' && <Badge color="green">Present</Badge>}
                      {log.status === 'ABSENT' && <Badge color="red">Absent</Badge>}
                      {log.status === 'LATE' && <Badge color="yellow">Late</Badge>}
                      {log.status === 'MEDICAL' && <Badge color="blue">Medical</Badge>}
                      {log.status === 'DUTY' && <Badge color="blue">Duty Leave</Badge>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{log.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatBlock({ title, value, total, color, bg, icon }: any) {
  return (
    <Card className="glass bg-card/60 flex flex-col justify-center p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium text-muted-foreground">{title} <span className="opacity-50">/ {total}</span></div>
    </Card>
  )
}

function Badge({ color, children }: any) {
  const colors: Record<string, string> = {
    green: "bg-green-500/10 text-green-500 border-green-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {children}
    </span>
  )
}
