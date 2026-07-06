"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ChevronRight, UserCircle, Search, Calendar, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"

import { createClient } from "@/lib/supabase/client"

export default function FacultyStudentsPage() {
  const { token } = useAuth()
  const [hierarchy, setHierarchy] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [selectedSection, setSelectedSection] = useState<any>(null)

  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [search, setSearch] = useState("")

  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchHierarchy = async () => {
      try {
        const { data: facultyData } = await supabase.from('Faculty').select(`
          subjects:Subject(
            id, name,
            course:Course(
              sections:Section(id, name)
            )
          )
        `).eq('userId', user.id).single()

        if (facultyData?.subjects) {
          const formatted = facultyData.subjects.map((s: any) => {
            const course = Array.isArray(s.course) ? s.course[0] : s.course
            return {
              id: s.id,
              name: s.name,
              sections: course?.sections || []
            }
          })
          setHierarchy(formatted)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchHierarchy()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!selectedSubject || !selectedSection) return

    const fetchStudents = async () => {
      setLoadingStudents(true)
      try {
        const { data: sectionData } = await supabase.from('Section').select(`
          students:Student(
            id, rollNumber,
            user:User(
              email,
              profile:UserProfile(firstName, lastName, profilePhoto)
            ),
            attendances:AttendanceRecord(id, status),
            submissions:AssignmentSubmission(id)
          )
        `).eq('id', selectedSection.id).single()

        if (sectionData?.students) {
          const mapped = sectionData.students.map((st: any) => {
            const userObj = Array.isArray(st.user) ? st.user[0] : st.user
            const profile = userObj?.profile ? (Array.isArray(userObj.profile) ? userObj.profile[0] : userObj.profile) : null
            
            const totalAtt = Array.isArray(st.attendances) ? st.attendances.length : 0
            const presentAtt = Array.isArray(st.attendances) ? st.attendances.filter((a: any) => a.status === 'PRESENT').length : 0
            const attPercent = totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(1) : "100.0"

            return {
              id: st.id,
              rollNumber: st.rollNumber,
              name: `${profile?.firstName || 'Unknown'} ${profile?.lastName || ''}`,
              email: userObj?.email || '',
              profilePhoto: profile?.profilePhoto,
              attendancePercent: attPercent,
              submissionsCount: Array.isArray(st.submissions) ? st.submissions.length : 0
            }
          })
          
          mapped.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
          setStudents(mapped)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingStudents(false)
      }
    }
    fetchStudents()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedSection])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading classes...</div>

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
        <p className="text-muted-foreground mt-1">Select a subject and section to view your students.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-72 space-y-4">
          <Card className="glass bg-card/60">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-lg">Class Hierarchy</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="py-2">
                {hierarchy.map(subject => (
                  <div key={subject.id} className="mb-2">
                    <div className="px-4 py-2 font-bold text-sm text-primary uppercase tracking-wider">{subject.name}</div>
                    {subject.sections.map((sec: any) => (
                      <button
                        key={sec.id}
                        onClick={() => { setSelectedSubject(subject); setSelectedSection(sec); }}
                        className={`w-full flex items-center justify-between px-6 py-2.5 text-sm transition-colors ${selectedSection?.id === sec.id ? 'bg-primary/20 text-primary font-medium border-l-2 border-primary' : 'text-muted-foreground hover:bg-muted/50 border-l-2 border-transparent'}`}
                      >
                        {sec.name}
                        <ChevronRight size={14} className={selectedSection?.id === sec.id ? 'opacity-100' : 'opacity-0'} />
                      </button>
                    ))}
                  </div>
                ))}
                {hierarchy.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">No subjects assigned.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {!selectedSection ? (
            <div className="h-64 flex items-center justify-center glass rounded-2xl border border-dashed border-white/10">
              <div className="text-center text-muted-foreground">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                Select a section from the hierarchy to view students.
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center bg-card/40 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                <div>
                  <div className="text-sm font-bold text-primary">{selectedSubject.name}</div>
                  <div className="text-lg font-bold">{selectedSection.name}</div>
                </div>
                <div className="relative w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-8 bg-background/50 border-white/10 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <Card className="glass bg-card/60 overflow-hidden">
                {loadingStudents ? (
                  <div className="p-8 text-center text-muted-foreground animate-pulse">Loading students...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4 font-medium">Student</th>
                          <th className="px-6 py-4 font-medium">Roll No</th>
                          <th className="px-6 py-4 font-medium text-center">Attendance</th>
                          <th className="px-6 py-4 font-medium text-center">Assignments</th>
                          <th className="px-6 py-4 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 font-medium flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                                {student.profilePhoto ? <img src={student.profilePhoto} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                              </div>
                              <div>
                                <div>{student.name}</div>
                                <div className="text-xs text-muted-foreground font-normal">{student.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{student.rollNumber}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-bold ${parseFloat(student.attendancePercent) < 75 ? 'text-red-500' : 'text-green-500'}`}>
                                {student.attendancePercent}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                {student.submissionsCount} Submitted
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <a href={`/faculty/students/${student.id}?subjectId=${selectedSubject.id}&sectionId=${selectedSection.id}`}>
                                <Button variant="outline" size="sm" className="h-8 border-white/10">
                                  View 360°
                                </Button>
                              </a>
                            </td>
                          </tr>
                        ))}
                        {filteredStudents.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                              No students found in this section.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
