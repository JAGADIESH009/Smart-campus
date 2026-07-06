"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen, Layers, Users, ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react"

import { createClient } from "@/utils/supabase/client"

export default function AdminCoursesPage() {
  const { token } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase.from('Course').select(`
          id, name, duration,
          department:Department(name),
          sections:Section(id, name, semester, students:User(count)),
          subjects:Subject(id, name, code, semester, credits)
        `)
        
        if (error) throw error
        
        if (data) {
          const mapped = data.map(c => ({
            ...c,
            department: Array.isArray(c.department) ? c.department[0] : c.department,
            sections: c.sections.map((s: any) => ({
              ...s,
              _count: { students: s.students && s.students[0] ? s.students[0].count : 0 }
            }))
          }))
          setCourses(mapped)
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading courses...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses & Sections</h1>
          <p className="text-muted-foreground mt-1">Manage academic programs, subjects, and student sections.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/10 glass">
            <Plus size={16} className="mr-2"/> Add Department
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
            <Plus size={16} className="mr-2"/> Add Course
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {courses.map(course => (
          <Card key={course.id} className="glass bg-card/60 overflow-hidden border-primary/10">
            <div 
              className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-primary uppercase tracking-wider mb-0.5">{course.department.name}</div>
                  <h3 className="text-xl font-bold">{course.name}</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1.5"><Layers size={14}/> {course.duration} Semesters</span>
                    <span className="flex items-center gap-1.5"><Users size={14}/> {course.sections.length} Sections</span>
                  </div>
                </div>
              </div>
              <div>
                {expandedCourse === course.id ? <ChevronDown size={24} className="text-muted-foreground" /> : <ChevronRight size={24} className="text-muted-foreground" />}
              </div>
            </div>

            {expandedCourse === course.id && (
              <div className="border-t border-white/5 bg-background/30 p-6 animate-in slide-in-from-top-2 duration-300">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Sections */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg flex items-center gap-2"><Users size={18} className="text-primary"/> Active Sections</h4>
                      <Button variant="ghost" size="sm" className="h-8 text-xs"><Plus size={14} className="mr-1"/> Add Section</Button>
                    </div>
                    <div className="space-y-2">
                      {course.sections.map((sec: any) => (
                        <div key={sec.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
                          <div className="font-medium">{sec.name} <span className="text-xs text-muted-foreground ml-2">Sem {sec.semester}</span></div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-muted-foreground">{sec._count.students} Students</span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6"><Edit size={12}/></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500"><Trash2 size={12}/></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {course.sections.length === 0 && <div className="text-sm text-muted-foreground italic">No sections created yet.</div>}
                    </div>
                  </div>

                  {/* Subjects */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg flex items-center gap-2"><BookOpen size={18} className="text-primary"/> Curriculum Subjects</h4>
                      <Button variant="ghost" size="sm" className="h-8 text-xs"><Plus size={14} className="mr-1"/> Add Subject</Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {course.subjects.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
                          <div>
                            <div className="font-medium">{sub.name}</div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{sub.code} • Sem {sub.semester}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">{sub.credits} CR</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><Edit size={12}/></Button>
                          </div>
                        </div>
                      ))}
                      {course.subjects.length === 0 && <div className="text-sm text-muted-foreground italic">No subjects added to curriculum.</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
        {courses.length === 0 && (
          <div className="p-12 text-center text-muted-foreground border border-dashed rounded-3xl glass border-white/10">
            No courses found. Add a new course to get started.
          </div>
        )}
      </div>
    </div>
  )
}
