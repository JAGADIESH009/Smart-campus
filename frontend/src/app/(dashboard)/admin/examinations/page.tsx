"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileSpreadsheet, Download, FilePlus2, Eye } from "lucide-react"

import { createClient } from "@/utils/supabase/client"

export default function AdminExaminationsPage() {
  const { token } = useAuth()
  const [marks, setMarks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const supabase = createClient()

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const { data, error } = await supabase.from('Mark').select(`
          id, marksObtained,
          exam:Exam(name, maxMarks),
          subject:Subject(name),
          student:Student(
            rollNumber,
            course:Course(name),
            semester:Semester(name),
            user:User(
              profile:UserProfile(firstName, lastName)
            )
          )
        `)
        if (error) throw error
        
        if (data) {
          const mapped = data.map((m: any) => ({
            id: m.id,
            student: {
              firstName: m.student?.user?.profile?.[0]?.firstName || 'Unknown',
              lastName: m.student?.user?.profile?.[0]?.lastName || '',
              rollNumber: m.student?.rollNumber || '',
              course: Array.isArray(m.student?.course) ? m.student?.course[0] : m.student?.course,
              currentSemester: Array.isArray(m.student?.semester) ? m.student.semester[0]?.name : m.student?.semester?.name
            },
            subject: Array.isArray(m.subject) ? m.subject[0] : m.subject,
            examType: Array.isArray(m.exam) ? m.exam[0]?.name : m.exam?.name,
            marksObtained: m.marksObtained,
            totalMarks: Array.isArray(m.exam) ? m.exam[0]?.maxMarks : m.exam?.maxMarks
          }))
          setMarks(mapped)
        }
      } catch (err) {
        console.error("Failed to fetch marks:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchMarks()
  }, [])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading examination records...</div>

  const marksArray = Array.isArray(marks) ? marks : []
  const filtered = marksArray.filter(m => 
    m.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || 
    m.student?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Examination Module</h1>
          <p className="text-muted-foreground mt-1">Manage internal marks, external results, and generate transcripts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/10 glass">
            <Download size={16} className="mr-2"/> Export Results
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
            <FilePlus2 size={16} className="mr-2"/> Publish New Results
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass bg-card/60 col-span-3 border-primary/20 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-card/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="text-primary" size={20}/>
              <CardTitle className="text-lg">Recent Internal Marks</CardTitle>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search student or subject..." 
                className="pl-9 bg-background/50 border-white/10 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Student Info</th>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium text-center">Exam Type</th>
                  <th className="px-6 py-4 font-medium text-center">Score</th>
                  <th className="px-6 py-4 font-medium text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((mark) => (
                  <tr key={mark.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold">{mark.student.firstName} {mark.student.lastName}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{mark.student.rollNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-primary">{mark.subject.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{mark.student.course?.name} • Sem {mark.student.currentSemester}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        {mark.examType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-black text-lg">{mark.marksObtained} <span className="text-xs font-normal text-muted-foreground">/ {mark.totalMarks}</span></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                        <Eye size={16} className="mr-2"/> Details
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No examination records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
