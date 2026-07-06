"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Clock, MapPin } from "lucide-react"

export default function StudentTimetablePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [timetable, setTimetable] = useState<any[]>([])
  
  const supabase = createClient()
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const currentDay = new Date().getDay() // 0 = Sunday, 1 = Monday...

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!user) return
      
      try {
        const { data: studentData } = await supabase.from('Student').select('id, sectionId').eq('userId', user.id).single()
        const sectionId = studentData?.sectionId

        if (sectionId) {
          const { data } = await supabase
            .from('Timetable')
            .select('*, Subject(name, code), Faculty(user:User(profile:UserProfile(firstName, lastName)))')
            .eq('sectionId', sectionId)
            .order('startTime', { ascending: true })
          
          if (data) {
            setTimetable(data)
          }
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Class Timetable</h1>
        <p className="text-muted-foreground mt-1">Your weekly schedule</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {days.map((dayName, index) => {
          const dayNum = index + 1
          const dayClasses = timetable.filter(t => t.dayOfWeek === dayNum)
          const isToday = currentDay === dayNum

          return (
            <Card key={dayNum} className={`glass bg-card/50 ${isToday ? 'border-primary ring-1 ring-primary/20 shadow-xl shadow-primary/10' : 'border-white/10'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  {dayName}
                  {isToday && <span className="text-xs font-bold px-2 py-1 bg-primary text-primary-foreground rounded-full">TODAY</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dayClasses.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No classes scheduled</p>
                ) : (
                  dayClasses.map((cls) => {
                    // Check if current time is within this class slot
                    const now = new Date()
                    const [startH, startM] = cls.startTime.split(':').map(Number)
                    const [endH, endM] = cls.endTime.split(':').map(Number)
                    
                    const classStart = new Date().setHours(startH, startM, 0)
                    const classEnd = new Date().setHours(endH, endM, 0)
                    const isActive = isToday && now.getTime() >= classStart && now.getTime() <= classEnd

                    const facultyProfile = cls.Faculty?.user?.profile
                    const facultyName = facultyProfile ? `${facultyProfile.firstName} ${facultyProfile.lastName}` : 'TBD'

                    const isLunch = cls.type === 'LUNCH'

                    return (
                      <div 
                        key={cls.id} 
                        className={`p-3 rounded-lg border ${isActive ? 'bg-primary/20 border-primary shadow-sm' : isLunch ? 'bg-muted/30 border-dashed border-white/10' : 'bg-secondary/20 border-white/5'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-bold text-sm ${isLunch ? 'text-muted-foreground' : ''}`}>{isLunch ? 'Lunch Break' : cls.Subject?.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${isLunch ? 'bg-muted text-muted-foreground' : cls.type === 'LAB' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {cls.type}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-col gap-1 mt-2">
                          <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {cls.startTime} - {cls.endTime}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {cls.room} {cls.building ? `(${cls.building})` : ''}
                            </div>
                            {!isLunch && <span className="truncate max-w-[120px]" title={facultyName}>Prof. {facultyName}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
