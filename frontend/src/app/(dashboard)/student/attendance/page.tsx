"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function StudentAttendancePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [attendanceData, setAttendanceData] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user) return
      
      try {
        const { data: studentData } = await supabase.from('Student').select('id, courseId').eq('userId', user.id).single()
        const studentId = studentData?.id

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
              const percentage = total > 0 ? (present / total) * 100 : 0
              
              return {
                ...subject,
                total,
                present,
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

  if (loading) return <div className="p-8 text-center animate-pulse">Loading attendance records...</div>

  const overallTotal = attendanceData.reduce((acc, curr) => acc + curr.total, 0)
  const overallPresent = attendanceData.reduce((acc, curr) => acc + curr.present, 0)
  const overallPercentage = overallTotal > 0 ? (overallPresent / overallTotal) * 100 : 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
          <p className="text-muted-foreground mt-1">Detailed subject-wise breakdown</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Overall Attendance</div>
          <div className={`text-3xl font-bold ${overallPercentage >= 75 ? 'text-green-500' : 'text-red-500'}`}>
            {overallPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {attendanceData.map((subject) => (
          <Card key={subject.id} className="glass bg-card/50 border-white/10 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-1" title={subject.name}>{subject.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{subject.code}</p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>{subject.present} / {subject.total} Classes</span>
                <span className={subject.percentage >= 75 ? 'text-green-500' : 'text-red-500'}>
                  {subject.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={subject.percentage} 
                className="h-2" 
                indicatorColor={subject.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}
              />
              {subject.percentage < 75 && subject.total > 0 && (
                <div className="flex items-center gap-1 mt-3 text-red-500 text-xs font-medium">
                  <AlertCircle className="w-3 h-3" />
                  Shortage of attendance
                </div>
              )}
              {subject.percentage >= 75 && subject.total > 0 && (
                <div className="flex items-center gap-1 mt-3 text-green-500 text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  On track
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
