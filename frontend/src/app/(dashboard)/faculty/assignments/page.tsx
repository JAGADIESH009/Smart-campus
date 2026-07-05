"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, CheckCircle2, Plus, X, Search } from "lucide-react"

import { createClient } from "@/utils/supabase/client"

export default function FacultyAssignmentsPage() {
  const { token } = useAuth()
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [gradingSub, setGradingSub] = useState<any>(null)
  const [marks, setMarks] = useState("")
  const [remarks, setRemarks] = useState("")
  const [savingGrade, setSavingGrade] = useState(false)

  const supabase = createClient()
  const { user } = useAuth()

  const fetchAssignments = async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data: facultyData } = await supabase.from('Faculty').select('id, subjects:Subject(id)').eq('userId', user.id).single()
      const subjectIds = (facultyData?.subjects || []).map((s: any) => s.id)
      
      if (subjectIds.length === 0) {
        setAssignments([])
        return
      }

      const { data } = await supabase.from('Assignment')
        .select(`
          id, title, dueDate,
          subject:Subject(name),
          submissions:AssignmentSubmission(
            id, status, submittedAt, marks, remarks, fileUrl, studentId, assignmentId,
            student:Student(
              rollNumber,
              user:User(
                profile:UserProfile(firstName, lastName)
              )
            )
          )
        `)
        .in('subjectId', subjectIds)
      
      if (data) {
        const mapped = data.map((a: any) => ({
          id: a.id,
          title: a.title,
          dueDate: a.dueDate,
          subject: Array.isArray(a.subject) ? a.subject[0] : a.subject,
          submissions: a.submissions.map((sub: any) => {
            const s = sub.student || {}
            const userObj = Array.isArray(s.user) ? s.user[0] : s.user
            const profile = userObj?.profile ? (Array.isArray(userObj.profile) ? userObj.profile[0] : userObj.profile) : null
            return {
              ...sub,
              student: {
                rollNumber: s.rollNumber,
                firstName: profile?.firstName || 'Unknown',
                lastName: profile?.lastName || ''
              }
            }
          })
        }))
        setAssignments(mapped)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [user])

  const handleGrade = async () => {
    if (!gradingSub) return
    setSavingGrade(true)
    
    try {
      const { error } = await supabase.from('AssignmentSubmission')
        .update({ marks: parseFloat(marks), remarks, status: 'GRADED' })
        .eq('id', gradingSub.id)
        
      if (!error) {
        await fetchAssignments()
        setGradingSub(null)
      } else {
        console.error("Failed to grade:", error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingGrade(false)
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Loading assignments...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignment Management</h1>
          <p className="text-muted-foreground mt-1">Create assignments and grade submissions.</p>
        </div>
        <Button className="bg-primary text-primary-foreground shadow-lg">
          <Plus size={16} className="mr-2"/> Create Assignment
        </Button>
      </div>

      <div className="space-y-6">
        {assignments.map(assignment => (
          <Card key={assignment.id} className="glass bg-card/60">
            <CardHeader className="pb-4 border-b border-white/5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold text-primary uppercase tracking-wider mb-1">{assignment.subject.name}</div>
                  <CardTitle className="text-xl mb-1">{assignment.title}</CardTitle>
                  <CardDescription>Due Date: {new Date(assignment.dueDate).toLocaleDateString()}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-foreground">{assignment.submissions.length}</div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Submissions</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {assignment.submissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-medium">Student</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Submitted At</th>
                        <th className="px-6 py-4 font-medium text-center">Score</th>
                        <th className="px-6 py-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {assignment.submissions.map((sub: any) => (
                        <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium">
                            {sub.student.firstName} {sub.student.lastName}
                            <div className="text-xs text-muted-foreground font-normal">{sub.student.rollNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${sub.status === 'GRADED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                              {sub.status === 'GRADED' ? <><CheckCircle2 size={12}/> Graded</> : 'Awaiting Grade'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{new Date(sub.submittedAt).toLocaleString()}</td>
                          <td className="px-6 py-4 text-center font-bold text-lg">
                            {sub.marks !== null ? <span className="text-green-500">{sub.marks}</span> : '-'}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <a href={sub.fileUrl?.startsWith('http') ? sub.fileUrl : `http://localhost:5000${sub.fileUrl}`} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="h-8 border-white/10">
                                <FileText size={14} className="mr-2"/> View File
                              </Button>
                            </a>
                            <Button 
                              variant={sub.status === 'GRADED' ? 'ghost' : 'default'} 
                              size="sm" 
                              className={`h-8 ${sub.status !== 'GRADED' ? 'bg-primary text-primary-foreground shadow-md' : ''}`}
                              onClick={() => {
                                setGradingSub(sub)
                                setMarks(sub.marks ? sub.marks.toString() : "")
                                setRemarks(sub.remarks || "")
                              }}
                            >
                              {sub.status === 'GRADED' ? 'Edit Grade' : 'Grade'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-12 flex flex-col items-center">
                  <Search size={32} className="opacity-20 mb-3" />
                  No submissions yet.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {assignments.length === 0 && (
          <div className="p-12 text-center text-muted-foreground border border-dashed rounded-3xl glass border-white/10">
            No assignments found. Click "Create Assignment" to add one.
          </div>
        )}
      </div>

      {/* Grading Modal Overlay */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="glass w-full max-w-lg bg-card shadow-2xl border-white/10">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Grade Submission</CardTitle>
                <CardDescription>Evaluating {gradingSub.student.firstName} {gradingSub.student.lastName}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setGradingSub(null)} className="rounded-full">
                <X size={20} />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Marks Obtained (Out of 10)</label>
                <Input 
                  type="number" 
                  value={marks} 
                  onChange={e => setMarks(e.target.value)}
                  className="bg-background/50 border-white/10 text-lg font-bold w-32" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Faculty Feedback / Remarks</label>
                <textarea 
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full bg-background/50 border border-white/10 rounded-lg p-3 text-sm h-32 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Provide constructive feedback..."
                />
              </div>
            </CardContent>
            <div className="p-4 bg-card/80 border-t border-white/5 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={() => setGradingSub(null)}>Cancel</Button>
              <Button onClick={handleGrade} disabled={savingGrade} className="bg-primary text-primary-foreground">
                {savingGrade ? 'Saving...' : 'Save Grade'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
