"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, Download, BarChart2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function StudentAttendancePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [studentDetails, setStudentDetails] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user) return
      
      try {
        const { data: studentData } = await supabase.from('Student')
          .select('id, courseId, rollNumber, user:User(profile:UserProfile(firstName, lastName))')
          .eq('userId', user.id).single()
          
        const studentId = studentData?.id
        
        if (studentData) {
          const userObj = Array.isArray(studentData.user) ? studentData.user[0] : studentData.user
          const prof = Array.isArray(userObj?.profile) ? userObj?.profile[0] : userObj?.profile
          setStudentDetails({
            name: `${prof?.firstName || ''} ${prof?.lastName || ''}`,
            rollNumber: studentData.rollNumber
          })
        }

        if (studentId) {
          // Fetch all subjects for this student's course
          const { data: subjects } = await supabase.from('Subject').select('*').eq('courseId', studentData.courseId)
          
          if (subjects) {
            const { data: records } = await supabase
              .from('AttendanceRecord')
              .select('status, Attendance(subjectId, date)')
              .eq('studentId', studentId)
            
            const processed = subjects.map(subject => {
              const subjectRecords = records?.filter((r: any) => r.Attendance?.subjectId === subject.id) || []
              const total = subjectRecords.length
              
              const present = subjectRecords.filter((r: any) => r.status === 'PRESENT').length
              const late = subjectRecords.filter((r: any) => r.status === 'LATE').length
              const onDuty = subjectRecords.filter((r: any) => r.status === 'ON_DUTY').length
              const absent = subjectRecords.filter((r: any) => r.status === 'ABSENT').length
              
              const effectiveAttended = present + late + onDuty
              const percentage = total > 0 ? (effectiveAttended / total) * 100 : 0
              
              return {
                ...subject,
                total,
                effectiveAttended,
                present,
                late,
                onDuty,
                absent,
                percentage
              }
            })
            
            setAttendanceData(processed)
          }
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

  const downloadReport = () => {
    if (!studentDetails || attendanceData.length === 0) return
    
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text("Attendance Report", 14, 22)
    doc.setFontSize(12)
    doc.text(`Student Name: ${studentDetails.name}`, 14, 32)
    doc.text(`Roll Number: ${studentDetails.rollNumber}`, 14, 40)
    
    const overallTotal = attendanceData.reduce((acc, curr) => acc + curr.total, 0)
    const overallPresent = attendanceData.reduce((acc, curr) => acc + curr.effectiveAttended, 0)
    const overallPercentage = overallTotal > 0 ? ((overallPresent / overallTotal) * 100).toFixed(2) : "0.00"
    
    doc.text(`Overall Attendance: ${overallPercentage}%`, 14, 48)

    const tableData = attendanceData.map(s => [
      s.name,
      s.code,
      s.total.toString(),
      s.effectiveAttended.toString(),
      s.absent.toString(),
      `${s.percentage.toFixed(1)}%`
    ])

    autoTable(doc, {
      startY: 55,
      head: [['Subject', 'Code', 'Total Classes', 'Attended', 'Absent', 'Percentage']],
      body: tableData,
    })

    doc.save(`Attendance_Report_${studentDetails.rollNumber}.pdf`)
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Loading attendance records...</div>

  const overallTotal = attendanceData.reduce((acc, curr) => acc + curr.total, 0)
  const overallPresent = attendanceData.reduce((acc, curr) => acc + curr.effectiveAttended, 0)
  const overallPercentage = overallTotal > 0 ? (overallPresent / overallTotal) * 100 : 0

  const chartData = attendanceData.map(d => ({
    name: d.code,
    percentage: parseFloat(d.percentage.toFixed(1)),
    fullName: d.name
  }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Analysis</h1>
          <p className="text-muted-foreground mt-1">Detailed subject-wise breakdown</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right mr-4">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Overall</div>
            <div className={`text-4xl font-black ${overallPercentage >= 75 ? 'text-green-500' : 'text-red-500'}`}>
              {overallPercentage.toFixed(1)}%
            </div>
          </div>
          <Button onClick={downloadReport} className="bg-primary text-primary-foreground shadow-lg">
            <Download className="w-4 h-4 mr-2" /> Download Report
          </Button>
        </div>
      </div>

      <Card className="glass border-white/10 shadow-xl bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart2 className="text-primary"/> Attendance Distribution</CardTitle>
          <CardDescription>Subject-wise percentage overview</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#88888844" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  formatter={(value: any) => [`${value}%`, 'Attendance']}
                  labelFormatter={(label: any) => chartData.find(d => d.name === label)?.fullName || label}
                />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? '#22c55e' : entry.percentage >= 60 ? '#eab308' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
               <BarChart2 className="w-12 h-12 mb-2" />
               <p>No data to display</p>
             </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {attendanceData.map((subject) => (
          <Card key={subject.id} className="glass bg-card/50 border-white/10 shadow-lg hover:bg-card/70 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold px-2 py-1 bg-secondary/20 text-secondary-foreground rounded uppercase tracking-wider">{subject.code}</span>
                <span className={`text-lg font-black ${subject.percentage >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                  {subject.percentage.toFixed(1)}%
                </span>
              </div>
              <CardTitle className="text-lg line-clamp-1" title={subject.name}>{subject.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={subject.percentage} 
                className="h-2 mb-4 bg-background" 
                indicatorColor={subject.percentage >= 75 ? 'bg-green-500' : subject.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
              />
              
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-background/50 p-3 rounded-lg">
                <div className="flex justify-between"><span className="font-semibold text-foreground">Total:</span> <span>{subject.total}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-green-500">Present:</span> <span>{subject.effectiveAttended}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-red-500">Absent:</span> <span>{subject.absent}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-orange-500">Late:</span> <span>{subject.late}</span></div>
              </div>

              {subject.percentage < 75 && subject.total > 0 && (
                <div className="flex items-center gap-1 mt-4 text-red-500 text-xs font-bold uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" /> Shortage Warning
                </div>
              )}
              {subject.percentage >= 75 && subject.total > 0 && (
                <div className="flex items-center gap-1 mt-4 text-green-500 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> On Track
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {attendanceData.length === 0 && (
        <div className="text-center p-12 glass rounded-xl border border-white/10">
          <p className="text-muted-foreground">No subjects or attendance data found for your course.</p>
        </div>
      )}
    </div>
  )
}
