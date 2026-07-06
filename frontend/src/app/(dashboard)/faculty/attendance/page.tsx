"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight, Save, Search, Check, X, Clock, Pill, Briefcase } from "lucide-react"

import { createClient } from "@/utils/supabase/client"

export default function FacultyAttendancePage() {
  const { token } = useAuth()
  const [hierarchy, setHierarchy] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [selectedSection, setSelectedSection] = useState<any>(null)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hour, setHour] = useState("1")

  const [students, setStudents] = useState<any[]>([])
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: string, remarks: string }>>({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      try {
        const { data: sectionData } = await supabase.from('Section').select(`
          students:Student(
            id, rollNumber,
            user:User(
              profile:UserProfile(firstName, lastName)
            )
          )
        `).eq('id', selectedSection.id).single()

        if (sectionData?.students) {
          const mapped = sectionData.students.map((st: any) => {
            const userObj = Array.isArray(st.user) ? st.user[0] : st.user
            const profile = userObj?.profile ? (Array.isArray(userObj.profile) ? userObj.profile[0] : userObj.profile) : null
            return {
              id: st.id,
              rollNumber: st.rollNumber,
              name: `${profile?.firstName || 'Unknown'} ${profile?.lastName || ''}`
            }
          })
          
          mapped.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
          setStudents(mapped)

          const init: Record<string, any> = {}
          mapped.forEach((s: any) => {
            init[s.id] = { status: 'ABSENT', remarks: '' }
          })
          setAttendanceState(init)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchStudents()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedSection])

  const markAll = (status: string) => {
    const next: Record<string, any> = {}
    students.forEach(s => {
      next[s.id] = { status, remarks: attendanceState[s.id]?.remarks || '' }
    })
    setAttendanceState(next)
  }

  const handleSave = async () => {
    if (!selectedSubject) return
    setSaving(true)

    const attendanceList = Object.keys(attendanceState).map(studentId => ({
      studentId,
      status: attendanceState[studentId].status,
      remarks: attendanceState[studentId].remarks
    }))

    try {
      const isoDate = new Date(date).toISOString()
      // First, upsert attendance
      const { data: attData, error: attError } = await supabase.from('Attendance').upsert({
        date: isoDate,
        hour: parseInt(hour),
        subjectId: selectedSubject.id
      }, { onConflict: 'date, hour, subjectId' }).select().single()

      if (attError) throw attError
      
      // Upsert records
      const records = attendanceList.map(a => ({
        attendanceId: attData.id,
        studentId: a.studentId,
        status: a.status,
        remarks: a.remarks
      }))
      
      const { error: recError } = await supabase.from('AttendanceRecord').upsert(records, { onConflict: 'attendanceId, studentId' })
      
      if (recError) throw recError

      alert("Attendance saved successfully!")
    } catch (e) {
      console.error(e)
      alert("Failed to save attendance")
    } finally {
      setSaving(false)
    }
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-8 text-center animate-pulse">Loading classes...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground mt-1">Record daily attendance for your sections.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Configuration */}
        <div className="w-full lg:w-80 space-y-4">
          <Card className="glass bg-card/60">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-lg">1. Select Class</CardTitle>
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
              </div>
            </CardContent>
          </Card>

          {selectedSection && (
            <Card className="glass bg-card/60">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-lg">2. Configuration</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-background/50 border-white/10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hour / Period</label>
                  <select
                    value={hour}
                    onChange={e => setHour(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>Period {h}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Attendance Matrix */}
        <div className="flex-1 space-y-6">
          {!selectedSection ? (
            <div className="h-64 flex items-center justify-center glass rounded-2xl border border-dashed border-white/10">
              <div className="text-center text-muted-foreground">
                <Check size={48} className="mx-auto mb-4 opacity-20" />
                Select a section to begin marking attendance.
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap justify-between items-center bg-card/40 p-4 rounded-xl border border-white/5 backdrop-blur-md gap-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => markAll('PRESENT')} className="border-green-500/30 text-green-500 hover:bg-green-500/10">Mark All Present</Button>
                  <Button variant="outline" size="sm" onClick={() => markAll('ABSENT')} className="border-red-500/30 text-red-500 hover:bg-red-500/10">Mark All Absent</Button>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-8 bg-background/50 border-white/10 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <Card className="glass bg-card/60 overflow-hidden border-primary/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-medium w-64">Student</th>
                        <th className="px-6 py-4 font-medium text-center">Status</th>
                        <th className="px-6 py-4 font-medium">Remarks (Optional)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredStudents.map((student) => {
                        const status = attendanceState[student.id]?.status || 'PRESENT'
                        return (
                          <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 font-medium">
                              <div>{student.name}</div>
                              <div className="text-xs text-muted-foreground font-normal">{student.rollNumber}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <AttendanceToggle
                                isPresent={status === 'PRESENT'}
                                onChange={(present) => setAttendanceState(s => ({
                                  ...s,
                                  [student.id]: { ...s[student.id], status: present ? 'PRESENT' : 'ABSENT' }
                                }))}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <Input
                                placeholder="Add note..."
                                className="bg-background/30 border-white/5 h-8 text-xs"
                                value={attendanceState[student.id]?.remarks || ''}
                                onChange={(e) => setAttendanceState(s => ({ ...s, [student.id]: { ...s[student.id], remarks: e.target.value } }))}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-card/80 border-t border-white/5 flex justify-end">
                  <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground px-8 shadow-lg">
                    {saving ? 'Saving...' : <><Save size={16} className="mr-2" /> Save Attendance</>}
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AttendanceToggle({ isPresent, onChange }: { isPresent: boolean, onChange: (val: boolean) => void }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(!isPresent)}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${isPresent ? 'bg-green-500' : 'bg-red-500'
          }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${isPresent ? 'translate-x-8' : 'translate-x-1'
            }`}
        />
      </button>
      <span className={`text-sm font-semibold w-16 text-left transition-colors duration-300 ${isPresent ? 'text-green-500' : 'text-red-500'}`}>
        {isPresent ? 'Present' : 'Absent'}
      </span>
    </div>
  )
}
