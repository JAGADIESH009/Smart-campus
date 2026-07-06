"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { FileUp, FileText, CheckCircle, Clock, UploadCloud, X, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StudentAssignmentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<any[]>([])
  
  // Upload modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const supabase = createClient()

  const fetchAssignments = async () => {
    if (!user) return
    
    try {
      const { data: studentData } = await supabase.from('Student').select('id, courseId, semesterId').eq('userId', user.id).single()
      const studentId = studentData?.id

      if (studentId) {
        // Find subjects for the student's semester/course
        const { data: subjects } = await supabase.from('Subject').select('id').eq('courseId', studentData.courseId)
        const subjectIds = subjects?.map(s => s.id) || []

        if (subjectIds.length > 0) {
          // Fetch assignments for those subjects
          const { data: assignmentsData } = await supabase
            .from('Assignment')
            .select('*, Subject(name)')
            .in('subjectId', subjectIds)
            .order('dueDate', { ascending: true })

          if (assignmentsData) {
            // Fetch submissions for this student
            const assignmentIds = assignmentsData.map(a => a.id)
            const { data: submissionsData } = await supabase
              .from('AssignmentSubmission')
              .select('*')
              .eq('studentId', studentId)
              .in('assignmentId', assignmentIds)

            const merged = assignmentsData.map(assignment => {
              const submission = submissionsData?.find(s => s.assignmentId === assignment.id)
              return {
                ...assignment,
                submission,
                studentId // Pass this for the upload function
              }
            })

            setAssignments(merged)
          }
        }
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

  const openUploadModal = (assignment: any) => {
    setSelectedAssignment(assignment)
    setFiles([])
    setIsModalOpen(true)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUploadSubmit = async () => {
    if (!selectedAssignment || !user || files.length === 0) return
    setIsUploading(true)
    
    try {
      const uploadedUrls: string[] = []

      // Keep existing files if it's an update
      if (selectedAssignment.submission?.attachments) {
        uploadedUrls.push(...selectedAssignment.submission.attachments)
      } else if (selectedAssignment.submission?.fileUrl) {
        uploadedUrls.push(selectedAssignment.submission.fileUrl)
      }

      // Upload new files
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${selectedAssignment.id}_${selectedAssignment.studentId}_${Date.now()}.${fileExt}`
        const filePath = `submissions/${fileName}`

        const { error: uploadError } = await supabase.storage.from('campus-files').upload(filePath, file)
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('campus-files').getPublicUrl(filePath)
        uploadedUrls.push(urlData.publicUrl)
      }

      // Create or Update submission record in database
      if (selectedAssignment.submission) {
        // Update
        const { error: dbError } = await supabase
          .from('AssignmentSubmission')
          .update({ 
            fileUrl: uploadedUrls[0], // fallback for older schema
            attachments: uploadedUrls, 
            status: 'PENDING', 
            submittedAt: new Date().toISOString() 
          })
          .eq('id', selectedAssignment.submission.id)
          
        if (dbError) throw dbError
      } else {
        // Insert
        const { error: dbError } = await supabase
          .from('AssignmentSubmission')
          .insert({
            assignmentId: selectedAssignment.id,
            studentId: selectedAssignment.studentId,
            fileUrl: uploadedUrls[0], // fallback
            attachments: uploadedUrls,
            status: 'PENDING'
          })
          
        if (dbError) throw dbError
      }

      toast({ title: "Success", description: "Submission uploaded successfully." })
      setIsModalOpen(false)
      await fetchAssignments() // Refresh list
      
    } catch (error: any) {
      console.error(error)
      toast({ title: "Upload Failed", description: error.message || "An error occurred.", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Loading assignments...</div>

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-1">Manage and submit your course work</p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center p-12 glass rounded-xl border border-white/10">
          <p className="text-muted-foreground">No assignments found for your enrolled subjects.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const isSubmitted = !!assignment.submission
            const isGraded = assignment.submission?.status === 'GRADED'
            const dueDate = new Date(assignment.dueDate)
            const isOverdue = !isSubmitted && dueDate < new Date()

            return (
              <Card key={assignment.id} className={`glass bg-card/50 flex flex-col ${isOverdue ? 'border-red-500/30' : 'border-white/10'} hover:bg-card/70 transition-colors shadow-lg`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-secondary/50 rounded text-muted-foreground">
                      {assignment.Subject?.name}
                    </span>
                    {isGraded ? (
                      <span className="flex items-center text-xs font-bold text-green-500"><CheckCircle className="w-3 h-3 mr-1"/> GRADED</span>
                    ) : isSubmitted ? (
                      <span className="flex items-center text-xs font-bold text-blue-500"><CheckCircle className="w-3 h-3 mr-1"/> SUBMITTED</span>
                    ) : isOverdue ? (
                      <span className="flex items-center text-xs font-bold text-red-500"><Clock className="w-3 h-3 mr-1"/> OVERDUE</span>
                    ) : (
                      <span className="flex items-center text-xs font-bold text-orange-500"><Clock className="w-3 h-3 mr-1"/> PENDING</span>
                    )}
                  </div>
                  <CardTitle className="text-xl line-clamp-2">{assignment.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {assignment.description || "No description provided."}
                  </p>
                  
                  <div className="text-xs font-medium text-foreground/70 bg-background/50 p-2 rounded-md">
                    Due: {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    {assignment.maxMarks && <span className="ml-2 pl-2 border-l border-white/20">Max Marks: {assignment.maxMarks}</span>}
                  </div>

                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reference Files</div>
                      {assignment.attachments.map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-white/5 p-1.5 rounded transition-colors">
                          <Download className="w-4 h-4" /> Download Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {isGraded && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="text-green-400 font-bold mb-1">Marks: {assignment.submission.marks} / {assignment.maxMarks || 100}</div>
                      {assignment.submission.remarks && (
                        <p className="text-xs text-green-500/80">{assignment.submission.remarks}</p>
                      )}
                    </div>
                  )}

                  {isSubmitted && (
                    <div className="pt-2 border-t border-white/5 space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Submissions</div>
                      {assignment.submission.attachments?.length > 0 ? (
                        assignment.submission.attachments.map((url: string, idx: number) => (
                          <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 p-1.5 rounded transition-colors">
                            <FileText className="w-4 h-4" /> View File {idx + 1}
                          </a>
                        ))
                      ) : assignment.submission.fileUrl ? (
                         <a href={assignment.submission.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 p-1.5 rounded transition-colors">
                           <FileText className="w-4 h-4" /> View File
                         </a>
                      ) : null}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 border-t border-white/5">
                  <Button 
                    className="w-full" 
                    variant={isSubmitted ? "outline" : "default"}
                    disabled={isGraded}
                    onClick={() => openUploadModal(assignment)}
                  >
                    {isSubmitted ? (
                      <><UploadCloud className="w-4 h-4 mr-2" /> Add More Files</>
                    ) : (
                      <><FileUp className="w-4 h-4 mr-2" /> Submit Assignment</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload Modal overlay */}
      {isModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="glass w-full max-w-lg bg-card shadow-2xl border-white/10">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Upload Submission</CardTitle>
                <CardDescription>Upload files for "{selectedAssignment.title}"</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => !isUploading && setIsModalOpen(false)} className="rounded-full" disabled={isUploading}>
                <X size={20} />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              
              <div 
                className={`w-full p-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  dragActive ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className={`w-12 h-12 mb-3 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-semibold mb-1 text-center">Drag and drop your files here</p>
                <p className="text-xs text-muted-foreground text-center">or click to browse your computer</p>
                <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">Supports PDF, DOCX, PPTX, ZIP, JPG, PNG, Java, Python, C, C++, JS, HTML, CSS</p>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  multiple
                  onChange={handleFileChange}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Files to Upload</div>
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-background/50 p-2 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 shrink-0 text-primary" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button onClick={() => removeFile(idx)} className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </CardContent>
            <div className="p-4 bg-card/80 border-t border-white/5 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isUploading}>Cancel</Button>
              <Button onClick={handleUploadSubmit} disabled={isUploading || files.length === 0} className="bg-primary text-primary-foreground px-6 shadow-md">
                {isUploading ? 'Uploading...' : 'Submit Files'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
