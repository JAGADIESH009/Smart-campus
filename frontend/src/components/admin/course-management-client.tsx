"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, BookOpen, Layers, Users, ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createCourseAction, updateCourseAction, deleteCourseAction } from "@/app/actions/course-actions"
import Link from "next/link"

export function CourseManagementClient({ initialCourses, departments }: { initialCourses: any[], departments: any[] }) {
  const [courses, setCourses] = useState(initialCourses)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const departmentId = formData.get("departmentId") as string

    const result = await createCourseAction(name, departmentId)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else if (result.course) {
      const dept = departments.find(d => d.id === departmentId)
      setCourses([{...result.course, department: dept, sections: [], subjects: [], duration: 8}, ...courses])
      toast({ title: "Success", description: "Course created." })
      setIsCreateOpen(false)
    }
    setLoading(false)
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const code = formData.get("code") as string
    const departmentId = formData.get("departmentId") as string

    const result = await updateCourseAction(editingCourse.id, name, code, departmentId)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else if (result.course) {
      const dept = departments.find(d => d.id === departmentId)
      setCourses(courses.map(c => c.id === result.course.id ? { ...c, ...result.course, department: dept } : c))
      toast({ title: "Success", description: "Course updated." })
      setIsEditOpen(false)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this course?")) return
    const result = await deleteCourseAction(id)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setCourses(courses.filter(c => c.id !== id))
      toast({ title: "Success", description: "Course deleted." })
    }
  }

  const openEdit = (course: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCourse(course)
    setIsEditOpen(true)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses & Sections</h1>
          <p className="text-muted-foreground mt-1">Manage academic programs, subjects, and student sections.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/departments">
            <Button variant="outline" className="border-white/10 glass">
              <Plus size={16} className="mr-2"/> Manage Departments
            </Button>
          </Link>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
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
                  <div className="text-sm font-bold text-primary uppercase tracking-wider mb-0.5">{course.department?.name || 'Unknown Dept'}</div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {course.name} 
                    <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-muted-foreground">{course.code}</span>
                  </h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1.5"><Layers size={14}/> {course.duration || 8} Semesters</span>
                    <span className="flex items-center gap-1.5"><Users size={14}/> {course.sections?.length || 0} Sections</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={(e) => openEdit(course, e)}>
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={(e) => handleDelete(course.id, e)}>
                  <Trash2 size={16} />
                </Button>
                <div className="w-px h-6 bg-border mx-2"></div>
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
                      {course.sections?.map((sec: any) => (
                        <div key={sec.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
                          <div className="font-medium">{sec.name} <span className="text-xs text-muted-foreground ml-2">Sem {sec.semester || 1}</span></div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-muted-foreground">{sec._count?.students || 0} Students</span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6"><Edit size={12}/></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500"><Trash2 size={12}/></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!course.sections || course.sections.length === 0) && <div className="text-sm text-muted-foreground italic">No sections created yet.</div>}
                    </div>
                  </div>

                  {/* Subjects */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg flex items-center gap-2"><BookOpen size={18} className="text-primary"/> Curriculum Subjects</h4>
                      <Button variant="ghost" size="sm" className="h-8 text-xs"><Plus size={14} className="mr-1"/> Add Subject</Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {course.subjects?.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
                          <div>
                            <div className="font-medium">{sub.name}</div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{sub.code} • Sem {sub.semesterId ? sub.semester?.name : 1}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">{sub.credits} CR</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><Edit size={12}/></Button>
                          </div>
                        </div>
                      ))}
                      {(!course.subjects || course.subjects.length === 0) && <div className="text-sm text-muted-foreground italic">No subjects added to curriculum.</div>}
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

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
            <DialogDescription>Create a new academic course/program.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Course Name</Label>
              <Input id="name" name="name" placeholder="e.g. B.Tech Computer Science" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select name="departmentId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Course"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          {editingCourse && (
            <form onSubmit={handleEdit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Course Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingCourse.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Course Code</Label>
                <Input id="edit-code" name="code" defaultValue={editingCourse.code} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select name="departmentId" defaultValue={editingCourse.departmentId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
