"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { FileUp, FileText, CheckCircle, Clock, UploadCloud } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StudentAssignmentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<any[]>([])
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedAssignmentId || !user) return

    // Find the assignment to get the studentId
    const assignment = assignments.find(a => a.id === selectedAssignmentId)
    if (!assignment?.studentId) return

    setUploadingId(selectedAssignmentId)
    
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${selectedAssignmentId}_${assignment.studentId}_${Date.now()}.${fileExt}`
      const filePath = `assignments/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('campus-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL or signed URL (we'll use public for simplicity if bucket is public, or get public URL anyway)
      const { data: urlData } = supabase.storage.from('campus-files').getPublicUrl(filePath)
      const fileUrl = urlData.publicUrl

      // 2. Create or Update submission record in database
      if (assignment.submission) {
        // Update
        const { error: dbError } = await supabase
          .from('AssignmentSubmission')
          .update({ fileUrl, status: 'PENDING', submittedAt: new Date().toISOString() })
          .eq('id', assignment.submission.id)
          
        if (dbError) throw dbError
      } else {
        // Insert
        const { error: dbError } = await supabase
          .from('AssignmentSubmission')
          .insert({
            assignmentId: selectedAssignmentId,
            studentId: assignment.studentId,
            fileUrl,
            status: 'PENDING'
          })
          
        if (dbError) throw dbError
      }

      toast({ title: "Success", description: "Assignment uploaded successfully." })
      await fetchAssignments() // Refresh list
      
    } catch (error: any) {
      console.error(error)
      toast({ title: "Upload Failed", description: error.message || "An error occurred.", variant: "destructive" })
    } finally {
      setUploadingId(null)
      setSelectedAssignmentId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId)
    fileInputRef.current?.click()
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Loading assignments...</div>

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-1">Manage and submit your course work</p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.txt" 
      />

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
              <Card key={assignment.id} className={`glass bg-card/50 flex flex-col ${isOverdue ? 'border-red-500/30' : 'border-white/10'}`}>
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
                  </div>

                  {isGraded && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="text-green-400 font-bold mb-1">Marks: {assignment.submission.marks}</div>
                      {assignment.submission.remarks && (
                        <p className="text-xs text-green-500/80">{assignment.submission.remarks}</p>
                      )}
                    </div>
                  )}

                  {isSubmitted && assignment.submission.fileUrl && (
                    <a 
                      href={assignment.submission.fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline p-2 bg-blue-500/10 rounded-md"
                    >
                      <FileText className="w-4 h-4" />
                      View Submission
                    </a>
                  )}
                </CardContent>
                <CardFooter className="pt-2 border-t border-white/5">
                  <Button 
                    className="w-full" 
                    variant={isSubmitted ? "outline" : "default"}
                    disabled={uploadingId === assignment.id || isGraded}
                    onClick={() => triggerFileInput(assignment.id)}
                  >
                    {uploadingId === assignment.id ? (
                      "Uploading..."
                    ) : isSubmitted ? (
                      <><UploadCloud className="w-4 h-4 mr-2" /> Replace File</>
                    ) : (
                      <><FileUp className="w-4 h-4 mr-2" /> Upload Submission</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
