"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, CheckCircle2, Plus, X, Search, Edit2, Trash2, UploadCloud } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

export default function FacultyAssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [gradingSub, setGradingSub] = useState<any>(null)
  const [marks, setMarks] = useState("")
  const [remarks, setRemarks] = useState("")
  const [savingGrade, setSavingGrade] = useState(false)

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "23:59",
    subjectId: "",
    maxMarks: 100
  })
  const [files, setFiles] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<string[]>([])

  const supabase = createClient()

  const fetchAssignments = async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data: facultyData } = await supabase.from('Faculty').select('id, subjects:Subject(id, name, code)').eq('userId', user.id).single()
      
      const subs = facultyData?.subjects || []
      setSubjects(subs)
      const subjectIds = subs.map((s: any) => s.id)
      
      if (subjectIds.length === 0) {
        setAssignments([])
        return
      }

      const { data } = await supabase.from('Assignment')
        .select(`
          id, title, description, dueDate, maxMarks, attachments,
          subject:Subject(id, name),
          submissions:AssignmentSubmission(
            id, status, submittedAt, marks, remarks, fileUrl, attachments, studentId, assignmentId,
            student:Student(
              rollNumber,
              user:User(
                profile:UserProfile(firstName, lastName)
              )
            )
          )
        `)
        .in('subjectId', subjectIds)
        .order('createdAt', { ascending: false })
      
      if (data) {
        const mapped = data.map((a: any) => ({
          ...a,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        alert("Failed to grade submission")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingGrade(false)
    }
  }

  const openCreateModal = () => {
    setEditingId(null)
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      dueTime: "23:59",
      subjectId: subjects.length > 0 ? subjects[0].id : "",
      maxMarks: 100
    })
    setFiles([])
    setExistingAttachments([])
    setIsModalOpen(true)
  }

  const openEditModal = (assignment: any) => {
    setEditingId(assignment.id)
    const dateObj = new Date(assignment.dueDate)
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      dueDate: dateObj.toISOString().split('T')[0],
      dueTime: dateObj.toTimeString().substring(0, 5),
      subjectId: assignment.subject?.id,
      maxMarks: assignment.maxMarks || 100
    })
    setFiles([])
    setExistingAttachments(assignment.attachments || [])
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return
    try {
      await supabase.from('Assignment').delete().eq('id', id)
      await fetchAssignments()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // 1. Upload new files if any
      const newAttachmentUrls: string[] = []
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
          const filePath = `assignments/faculty/${fileName}`
          
          const { error: uploadError } = await supabase.storage.from('campus-files').upload(filePath, file)
          if (uploadError) throw uploadError
          
          const { data: publicUrlData } = supabase.storage.from('campus-files').getPublicUrl(filePath)
          newAttachmentUrls.push(publicUrlData.publicUrl)
        }
      }

      const allAttachments = [...existingAttachments, ...newAttachmentUrls]
      
      const combinedDateTime = new Date(`${formData.dueDate}T${formData.dueTime}:00`)

      const assignmentPayload = {
        title: formData.title,
        description: formData.description,
        dueDate: combinedDateTime.toISOString(),
        subjectId: formData.subjectId,
        maxMarks: formData.maxMarks,
        attachments: allAttachments
      }

      if (editingId) {
        await supabase.from('Assignment').update(assignmentPayload).eq('id', editingId)
      } else {
        await supabase.from('Assignment').insert([assignmentPayload])
      }

      setIsModalOpen(false)
      await fetchAssignments()
    } catch (err: any) {
      alert("Error saving assignment: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Loading assignments...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignment Management</h1>
          <p className="text-muted-foreground mt-1">Create assignments, attach files, and grade submissions.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary text-primary-foreground shadow-lg">
          <Plus size={16} className="mr-2"/> Create Assignment
        </Button>
      </div>

      <div className="space-y-6">
        {assignments.map(assignment => (
          <Card key={assignment.id} className="glass bg-card/60">
            <CardHeader className="pb-4 border-b border-white/5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold text-primary uppercase tracking-wider mb-1">{assignment.subject?.name}</div>
                  <CardTitle className="text-xl mb-1">{assignment.title}</CardTitle>
                  <CardDescription>
                    Due: {new Date(assignment.dueDate).toLocaleString()} | Max Marks: {assignment.maxMarks}
                  </CardDescription>
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {assignment.attachments.map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition-colors">
                          <FileText size={12} /> Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 items-start">
                  <Button variant="ghost" size="icon" onClick={() => openEditModal(assignment)}>
                    <Edit2 size={16} className="text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)}>
                    <Trash2 size={16} className="text-destructive/80 hover:text-destructive" />
                  </Button>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-black text-foreground">{assignment.submissions.length}</div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Submissions</div>
                  </div>
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
                            <span className="text-xs text-muted-foreground font-normal ml-1">/ {assignment.maxMarks}</span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {sub.attachments && sub.attachments.length > 0 ? (
                              <a href={sub.attachments[0]} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="h-8 border-white/10">
                                  <FileText size={14} className="mr-2"/> View File
                                </Button>
                              </a>
                            ) : sub.fileUrl ? (
                              <a href={sub.fileUrl} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="h-8 border-white/10">
                                  <FileText size={14} className="mr-2"/> View File
                                </Button>
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">No File</span>
                            )}
                            <Button 
                              variant={sub.status === 'GRADED' ? 'ghost' : 'default'} 
                              size="sm" 
                              className={`h-8 ${sub.status !== 'GRADED' ? 'bg-primary text-primary-foreground shadow-md' : ''}`}
                              onClick={() => {
                                setGradingSub({ ...sub, maxMarks: assignment.maxMarks })
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

      {/* Create / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="glass w-full max-w-2xl bg-card shadow-2xl border-white/10">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">{editingId ? 'Edit Assignment' : 'Create Assignment'}</CardTitle>
                <CardDescription>Fill out the details below.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full">
                <X size={20} />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form id="assignment-form" onSubmit={handleSaveAssignment} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title *</label>
                    <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.g. Final Project Report" />
                  </div>
                  
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                    <textarea 
                      value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-background/50 border border-white/10 rounded-lg p-3 text-sm h-24 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      placeholder="Detailed instructions..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject *</label>
                    <select 
                      required
                      value={formData.subjectId}
                      onChange={e => setFormData({...formData, subjectId: e.target.value})}
                      className="w-full bg-background/50 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="" disabled>Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Max Marks *</label>
                    <Input required type="number" min="0" value={formData.maxMarks} onChange={e => setFormData({...formData, maxMarks: parseInt(e.target.value) || 0})} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Due Date *</label>
                    <Input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Due Time *</label>
                    <Input required type="time" value={formData.dueTime} onChange={e => setFormData({...formData, dueTime: e.target.value})} />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attachments</label>
                    {existingAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {existingAttachments.map((url, i) => (
                          <div key={i} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded text-sm">
                            <FileText size={14} /> Attachment {i+1}
                            <button type="button" onClick={() => setExistingAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 ml-2"><X size={14}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-white/5 border-white/10 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {files.length > 0 ? `${files.length} file(s) selected` : "Click to select files (PDF, DOCX, etc)"}
                        </p>
                      </div>
                      <input type="file" className="hidden" multiple onChange={(e) => {
                        if (e.target.files) setFiles(Array.from(e.target.files))
                      }} />
                    </label>
                  </div>
                </div>

              </form>
            </CardContent>
            <div className="p-4 bg-card/80 border-t border-white/5 flex justify-end gap-3 rounded-b-xl">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="assignment-form" disabled={isSubmitting} className="bg-primary text-primary-foreground">
                {isSubmitting ? 'Saving...' : 'Save Assignment'}
              </Button>
            </div>
          </Card>
        </div>
      )}

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
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Marks Obtained (Out of {gradingSub.maxMarks})</label>
                <Input 
                  type="number" 
                  max={gradingSub.maxMarks}
                  min={0}
                  step={0.5}
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
