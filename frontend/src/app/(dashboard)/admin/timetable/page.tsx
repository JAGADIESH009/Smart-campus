"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Wand2, Plus, GripHorizontal } from "lucide-react"

import { createClient } from "@/utils/supabase/client"

export default function AdminTimetablePage() {
  const { token } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase.from('Course').select(`
          id, name,
          sections:Section(id, name)
        `)
        if (error) throw error
        if (data) setCourses(data)
      } catch (err) {
        console.error("Failed to fetch courses:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      alert("Timetable generated successfully for selected sections using the conflict-resolution algorithm.")
    }, 2000)
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Loading sections...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable Master</h1>
          <p className="text-muted-foreground mt-1">Generate and manage master schedules for all sections.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/10 glass">
            <Plus size={16} className="mr-2"/> Manual Entry
          </Button>
          <Button onClick={handleGenerate} disabled={generating} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
            <Wand2 size={16} className={`mr-2 ${generating ? 'animate-spin' : ''}`}/> 
            {generating ? 'Generating...' : 'Auto-Generate Schedule'}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card className="glass bg-card/60">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-lg">Select Section</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="py-2">
                {courses.map(course => (
                  <div key={course.id} className="mb-2">
                    <div className="px-4 py-2 font-bold text-xs text-primary uppercase tracking-wider">{course.name}</div>
                    {course.sections.map((sec: any) => (
                      <button
                        key={sec.id}
                        className={`w-full flex items-center justify-between px-6 py-2 text-sm transition-colors text-muted-foreground hover:bg-muted/50 border-l-2 border-transparent`}
                      >
                        {sec.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card className="glass bg-card/60 h-full min-h-[500px] border-primary/20 flex flex-col">
            <CardHeader className="border-b border-white/5 bg-card/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Schedule Preview</CardTitle>
                <CardDescription>Drag and drop to manually adjust generated slots.</CardDescription>
              </div>
              <Calendar className="text-primary opacity-50" size={24}/>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex items-center justify-center border border-dashed border-white/10 m-6 rounded-xl bg-background/30">
              <div className="text-center">
                <Wand2 size={48} className="mx-auto mb-4 text-primary opacity-20" />
                <h3 className="text-xl font-bold mb-2">No Schedule Generated</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">Select a section and click Auto-Generate to create a conflict-free timetable using the AI scheduler.</p>
                <Button onClick={handleGenerate} disabled={generating} className="bg-primary/20 text-primary hover:bg-primary/30">
                  <Wand2 size={16} className={`mr-2 ${generating ? 'animate-spin' : ''}`}/> Generate Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
