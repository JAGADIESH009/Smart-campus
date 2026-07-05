"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, UserCircle, Edit, Trash2, Mail, MapPin } from "lucide-react"

import { createClient } from "@/utils/supabase/client"

export default function AdminStudentsPage() {
  const { token } = useAuth()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const supabase = createClient()

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase.from('Student').select(`
          id, rollNumber, registrationNo, academicStatus,
          department:Department(name),
          course:Course(name),
          semester:Semester(name),
          user:User(
            email,
            profile:UserProfile(firstName, lastName, profilePhoto)
          )
        `)
        if (error) throw error
        
        if (data) {
          const mapped = data.map((s: any) => {
            const userObj = Array.isArray(s.user) ? s.user[0] : s.user
            const profileObj = userObj?.profile ? (Array.isArray(userObj.profile) ? userObj.profile[0] : userObj.profile) : null
            const deptName = Array.isArray(s.department) ? s.department[0]?.name : s.department?.name
            return {
              id: s.id,
              firstName: profileObj?.firstName || 'Unknown',
              lastName: profileObj?.lastName || '',
              profilePhoto: profileObj?.profilePhoto,
              rollNumber: s.rollNumber,
              registrationNo: s.registrationNo,
              academicStatus: s.academicStatus,
              department: { name: deptName },
              course: { name: Array.isArray(s.course) ? s.course[0]?.name : s.course?.name },
              branch: deptName,
              currentSemester: Array.isArray(s.semester) ? s.semester[0]?.name : s.semester?.name,
              user: { email: userObj?.email || '' }
            }
          })
          setStudents(mapped)
        }
      } catch (err) {
        console.error("Failed to fetch students:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading students...</div>

  const filtered = students.filter(s => 
    s.firstName.toLowerCase().includes(search.toLowerCase()) || 
    s.lastName.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
          <p className="text-muted-foreground mt-1">Manage student records and information.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
          <Plus size={16} className="mr-2"/> Add Student
        </Button>
      </div>

      <Card className="glass bg-card/60 overflow-hidden border-primary/20">
        <div className="p-4 border-b border-white/5 bg-card/40 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name or roll number..." 
              className="pl-9 bg-background/50 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Registration Details</th>
                <th className="px-6 py-4 font-medium">Course / Branch</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 overflow-hidden">
                        {student.profilePhoto ? <img src={student.profilePhoto.startsWith('http') ? student.profilePhoto : `http://localhost:5000${student.profilePhoto}`} className="w-full h-full object-cover"/> : student.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-[15px]">{student.firstName} {student.lastName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail size={12}/> {student.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm">{student.rollNumber}</div>
                    <div className="text-xs text-muted-foreground">Reg: {student.registrationNo}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{student.course?.name} ({student.branch})</div>
                    <div className="text-xs text-muted-foreground">{student.department?.name} • Sem {student.currentSemester}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${student.academicStatus === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {student.academicStatus || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No students found.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
