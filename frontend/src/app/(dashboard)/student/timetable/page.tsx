"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin, Users, BookOpen } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function TimetablePage() {
  const { token } = useAuth()
  const [timetable, setTimetable] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!user) return
      
      try {
        const { data: studentData } = await supabase.from('Student').select('id, sectionId').eq('userId', user.id).single()
        if (!studentData) return

        const { data: schedule } = await supabase.from('Timetable').select(`
          dayOfWeek, startTime, endTime, room, type,
          subject:Subject(name, code)
        `).eq('sectionId', studentData.sectionId)

        if (schedule) {
          const mapped = schedule.map((cls: any) => ({
            ...cls,
            subject: Array.isArray(cls.subject) ? cls.subject[0] : cls.subject
          }))
          setTimetable(mapped)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTimetable()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading timetable...</div>

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  
  // Real-time calculation
  const now = new Date()
  const currentDayIndex = now.getDay() // 0 is Sunday, 1 is Monday
  const currentDay = currentDayIndex > 0 && currentDayIndex <= 6 ? days[currentDayIndex - 1] : null
  const currentHour = now.getHours()
  const currentMin = now.getMinutes()
  
  const isCurrentClass = (day: string, start: string, end: string) => {
    if (day !== currentDay) return false
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    
    const nowTime = currentHour * 60 + currentMin
    const startTime = startH * 60 + startM
    const endTime = endH * 60 + endM
    
    return nowTime >= startTime && nowTime < endTime
  }

  // Group by day mapping 1=Monday
  const grouped = days.map((day, index) => ({
    day,
    classes: timetable.filter(t => t.dayOfWeek === index + 1).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }))

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weekly Timetable</h1>
        <p className="text-muted-foreground mt-1">Your class schedule for the current semester.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
        {grouped.map(({ day, classes }) => (
          <Card key={day} className={`glass bg-card/60 flex flex-col ${day === currentDay ? 'ring-2 ring-primary/50' : ''}`}>
            <CardHeader className={`bg-primary/5 border-b border-white/5 pb-4 ${day === currentDay ? 'bg-primary/10' : ''}`}>
              <CardTitle className="text-center text-lg">{day}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 space-y-4">
              {classes.length === 0 ? (
                <div className="text-sm text-center text-muted-foreground p-4 border border-dashed border-white/10 rounded-xl">
                  No classes scheduled
                </div>
              ) : (
                classes.map((cls, i) => {
                  const isActive = isCurrentClass(day, cls.startTime, cls.endTime)
                  return (
                    <div key={i} className={`p-4 rounded-xl transition-colors border ${isActive ? 'bg-primary/20 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'bg-background/50 border-white/10 hover:border-primary/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                          {cls.startTime} - {cls.endTime}
                        </div>
                        <Badge type={cls.type}>{cls.type}</Badge>
                      </div>
                      
                      {cls.type === 'BREAK' ? (
                        <div className="font-medium text-muted-foreground text-center py-2 flex items-center justify-center gap-2">
                          <Clock size={16} /> Break
                        </div>
                      ) : (
                        <>
                          <div className="font-bold text-sm leading-tight mb-2">
                            {cls.subject?.name || 'Unknown Subject'}
                          </div>
                          <div className="space-y-1 mt-3 pt-3 border-t border-white/10">
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <BookOpen size={12} className="opacity-70" />
                              {cls.subject?.code || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <MapPin size={12} className="opacity-70" />
                              {cls.room}
                            </div>
                          </div>
                        </>
                      )}
                      {isActive && (
                        <div className="mt-3 text-[10px] font-bold text-primary uppercase tracking-wider text-center animate-pulse flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          Ongoing Now
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Badge({ type, children }: any) {
  if (type === 'BREAK') return <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">Break</span>
  if (type === 'LAB') return <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-sm">Lab</span>
  return <span className="text-[10px] uppercase font-bold text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-sm">Lecture</span>
}
