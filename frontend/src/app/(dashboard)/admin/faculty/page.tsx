"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, UserCircle, Edit, Trash2, Mail, GraduationCap } from "lucide-react"

import { createClient } from "@/utils/supabase/client"

export default function AdminFacultyPage() {
  const { token } = useAuth()
  const [faculty, setFaculty] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const supabase = createClient()

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const { data, error } = await supabase.from('Faculty').select(`
          id, employeeId, designation, createdAt,
          department:Department(name),
          subjects:Subject(id),
          user:User(
            email,
            profile:UserProfile(firstName, lastName)
          )
        `)
        if (error) throw error
        
        if (data) {
          const mapped = data.map((f: any) => {
            const userObj = Array.isArray(f.user) ? f.user[0] : f.user
            const profileObj = userObj?.profile ? (Array.isArray(userObj.profile) ? userObj.profile[0] : userObj.profile) : null
            return {
              id: f.id,
              firstName: profileObj?.firstName || 'Unknown',
              lastName: profileObj?.lastName || '',
              employeeId: f.employeeId,
              user: { email: userObj?.email || '' },
              designation: f.designation || 'Faculty',
              department: { name: (Array.isArray(f.department) ? f.department[0]?.name : f.department?.name) || '' },
              joiningDate: f.createdAt,
              subjects: f.subjects || []
            }
          })
          setFaculty(mapped)
        }
      } catch (err) {
        console.error("Failed to fetch faculty:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchFaculty()
  }, [])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading faculty...</div>

  const filtered = faculty.filter(f => 
    f.firstName.toLowerCase().includes(search.toLowerCase()) || 
    f.lastName.toLowerCase().includes(search.toLowerCase()) ||
    f.employeeId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty Directory</h1>
          <p className="text-muted-foreground mt-1">Manage teaching staff and assign subjects.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
          <Plus size={16} className="mr-2"/> Add Faculty
        </Button>
      </div>

      <Card className="glass bg-card/60 overflow-hidden border-primary/20">
        <div className="p-4 border-b border-white/5 bg-card/40 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name or employee ID..." 
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
                <th className="px-6 py-4 font-medium">Faculty Member</th>
                <th className="px-6 py-4 font-medium">Designation</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium text-center">Subjects Taught</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(member => (
                <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                        {member.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-[15px]">{member.firstName} {member.lastName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail size={12}/> {member.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-primary">{member.designation}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{member.employeeId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{member.department?.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Joined: {new Date(member.joiningDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                      <GraduationCap size={14}/> {member.subjects?.length || 0} Subjects
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
              No faculty found.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
