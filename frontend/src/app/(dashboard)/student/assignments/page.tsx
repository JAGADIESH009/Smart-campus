"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileUp, Calendar, CheckCircle2, Clock, FileWarning, Search, XCircle, FileText, AlertTriangle } from "lucide-react"

import { createClient } from "@/utils/supabase/client"

export default function AssignmentsPage() {
  const { token } = useAuth()
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [filter, setFilter] = useState('ALL') // ALL, PENDING, GRADED

  const supabase = createClient()
  const { user } = useAuth()
  const [studentId, setStudentId] = useState<string | null>(null)

  const fetchAssignments = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: studentData } = await supabase.from('Student').select('id, courseId').eq('userId', user.id).single()
      if (!studentData) return
      setStudentId(studentData.id)

      const { data: subjects } = await supabase.from('Subject').select(`
        name,
        assignments:Assignment(
          id, title, description, dueDate
        )
      `).eq('courseId', studentData.courseId)
      
      const allAssignments = subjects?.flatMap((sub: any) => (sub.assignments || []).map((a: any) => ({
        ...a,
        subjectName: sub.name
      }))) || []

      const { data: submissions } = await supabase.from('AssignmentSubmission').select('*').eq('studentId', studentData.id)
      
      const mapped = allAssignments.map((a: any) => {
        const sub = submissions?.find(s => s.assignmentId === a.id)
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          dueDate: a.dueDate,
          subjectName: a.subjectName,
          status: sub?.status || 'PENDING',
          marks: sub?.marks,
          remarks: sub?.remarks,
          fileUrl: sub?.fileUrl
        }
      })
      
      setAssignments(mapped)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [user])

  const handleUpload = async (assignmentId: string) => {
    if (!file || !user || !studentId) return
    setUploadingId(assignmentId)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${studentId}/${assignmentId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('assignments').upload(filePath, file)
      
      if (uploadError) {
        console.error("Upload failed", uploadError)
      } else {
        const { data: publicUrlData } = supabase.storage.from('assignments').getPublicUrl(filePath)
        
        await supabase.from('AssignmentSubmission').upsert({
          assignmentId,
          studentId,
          fileUrl: publicUrlData.publicUrl,
          status: 'SUBMITTED'
        }, { onConflict: 'assignmentId, studentId' })
        
        await fetchAssignments()
        setFile(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUploadingId(null)
    }
  }

  const getDaysRemaining = (dueDate: string) => {
    const diffTime = Math.abs(new Date(dueDate).getTime() - new Date().getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const isPast = new Date(dueDate) < new Date()
    return { diffDays, isPast }
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Loading assignments...</div>

  const filtered = assignments.filter(a => {
    if (filter === 'PENDING') return a.status === 'PENDING'
    if (filter === 'GRADED') return a.status === 'GRADED'
    return true
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground mt-1">Submit your work and view grades.</p>
        </div>
        
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'SUBMITTED', 'GRADED'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted text-muted-foreground hover:bg-primary/20'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {filtered.map(assignment => {
          const { diffDays, isPast } = getDaysRemaining(assignment.dueDate)
          const isPending = assignment.status === 'PENDING'
          
          return (
            <Card key={assignment.id} className={`glass bg-card/60 transition-all hover:border-primary/50 flex flex-col md:flex-row overflow-hidden ${isPast && isPending ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : ''}`}>
              <div className="flex-1 flex flex-col p-6 border-b md:border-b-0 md:border-r border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-primary tracking-wider uppercase">{assignment.subjectName}</span>
                  {assignment.status === 'GRADED' && <Badge color="green"><CheckCircle2 size={12} className="mr-1"/> Graded</Badge>}
                  {assignment.status === 'SUBMITTED' && <Badge color="blue"><Clock size={12} className="mr-1"/> In Review</Badge>}
                  {isPending && !isPast && <Badge color="yellow"><Clock size={12} className="mr-1"/> Pending</Badge>}
                  {isPending && isPast && <Badge color="red"><AlertTriangle size={12} className="mr-1"/> Overdue</Badge>}
                </div>
                <CardTitle className="text-xl mb-2">{assignment.title}</CardTitle>
                <CardDescription className="text-foreground/80 leading-relaxed max-w-2xl flex-1">
                  {assignment.description || 'No description provided.'}
                </CardDescription>
                
                {assignment.remarks && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-white/5 flex gap-3">
                    <FileText className="text-primary mt-0.5" size={18} />
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Faculty Feedback</div>
                      <div className="text-sm italic">"{assignment.remarks}"</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full md:w-72 bg-background/30 p-6 flex flex-col justify-center border-l border-white/5">
                <div className="mb-6 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium">
                    <Calendar size={16}/> Due Date
                  </div>
                  <div className={`font-bold ${isPast && isPending ? 'text-red-500' : ''}`}>
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </div>
                </div>

                {assignment.status === 'GRADED' ? (
                  <div className="text-center py-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="text-3xl font-black text-green-500">{assignment.marks} <span className="text-sm opacity-50">/ 10</span></div>
                    <div className="text-xs font-bold uppercase tracking-wider text-green-500/70 mt-1">Score</div>
                  </div>
                ) : assignment.status === 'SUBMITTED' ? (
                  <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                    <FileWarning size={24} className="mx-auto text-blue-500 opacity-50 mb-2"/>
                    <div className="text-sm font-semibold text-blue-500">File Submitted</div>
                    <div className="text-xs text-muted-foreground mt-1">Awaiting evaluation</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-2xl font-black ${isPast ? 'text-red-500' : 'text-yellow-500'}`}>
                        {diffDays} {diffDays === 1 ? 'Day' : 'Days'}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                        {isPast ? 'Overdue By' : 'Remaining'}
                      </div>
                    </div>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="bg-background/50 text-xs" />
                    <Button 
                      onClick={() => handleUpload(assignment.id)} 
                      disabled={!file || uploadingId === assignment.id}
                      className="w-full shadow-lg"
                    >
                      {uploadingId === assignment.id ? 'Uploading...' : <><FileUp size={16} className="mr-2"/> Submit Work</>}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
        
        {filtered.length === 0 && (
          <div className="text-center py-24 glass rounded-3xl border border-dashed border-white/10">
            <Search size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
            <div className="text-xl font-bold">No assignments found</div>
            <div className="text-muted-foreground mt-2">You don't have any {filter.toLowerCase()} assignments at the moment.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Badge({ color, children }: any) {
  const colors: Record<string, string> = {
    green: "bg-green-500/10 text-green-500",
    red: "bg-red-500/10 text-red-500",
    yellow: "bg-yellow-500/10 text-yellow-500",
    blue: "bg-blue-500/10 text-blue-500",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${colors[color]}`}>
      {children}
    </span>
  )
}
