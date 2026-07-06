"use client"

import { useState } from "react"
import { Plus, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createWorkloadAction, deleteWorkloadAction } from "@/actions/workload-actions"
import { SearchableCombobox } from "@/components/ui/searchable-combobox"

export function WorkloadManagementClient({ 
  initialWorkloads, faculty, departments, courses, semesters, sections, subjects 
}: any) {
  const [workloads, setWorkloads] = useState(initialWorkloads)
  const [search, setSearch] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [fId, setFId] = useState("")
  const [deptId, setDeptId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [semId, setSemId] = useState("")
  const [secId, setSecId] = useState("")
  const [subId, setSubId] = useState("")
  
  const { toast } = useToast()

  const filteredWorkloads = workloads.filter((w: any) => 
    w.faculty.user.profile.firstName.toLowerCase().includes(search.toLowerCase()) ||
    w.faculty.user.profile.lastName.toLowerCase().includes(search.toLowerCase()) ||
    w.subject.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!fId || !deptId || !courseId || !secId || !subId) {
      toast({ title: "Validation Error", description: "All fields except Semester are required.", variant: "destructive" })
      return
    }

    setLoading(true)

    const result = await createWorkloadAction(fId, deptId, courseId, semId || undefined, secId, subId)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else if (result.workload) {
      const w = {
        ...result.workload,
        faculty: faculty.find((f:any) => f.id === fId),
        department: departments.find((d:any) => d.id === deptId),
        course: courses.find((c:any) => c.id === courseId),
        semester: semesters.find((s:any) => s.id === semId),
        section: sections.find((s:any) => s.id === secId),
        subject: subjects.find((s:any) => s.id === subId)
      }
      setWorkloads([w, ...workloads])
      toast({ title: "Success", description: "Workload assigned successfully." })
      setIsCreateOpen(false)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this workload assignment?")) return
    const result = await deleteWorkloadAction(id)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setWorkloads(workloads.filter((w:any) => w.id !== id))
      toast({ title: "Success", description: "Workload removed." })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search faculty or subject..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Assign Workload</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Academic Workload</DialogTitle>
              <DialogDescription>Link a faculty member to a specific section and subject.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2 col-span-2">
                <Label>Faculty *</Label>
                <SearchableCombobox 
                  options={faculty.map((f:any) => ({ value: f.id, label: `${f.user.profile.firstName} ${f.user.profile.lastName} (${f.employeeId})` }))}
                  value={fId} onChange={setFId} placeholder="Select Faculty"
                />
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <SearchableCombobox 
                  options={departments.map((d:any) => ({ value: d.id, label: d.name }))}
                  value={deptId} onChange={setDeptId} placeholder="Select Dept"
                />
              </div>
              <div className="space-y-2">
                <Label>Course *</Label>
                <SearchableCombobox 
                  options={courses.map((c:any) => ({ value: c.id, label: c.name }))}
                  value={courseId} onChange={setCourseId} placeholder="Select Course"
                />
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <SearchableCombobox 
                  options={semesters.map((s:any) => ({ value: s.id, label: s.name }))}
                  value={semId} onChange={setSemId} placeholder="Select Semester (Opt)"
                />
              </div>
              <div className="space-y-2">
                <Label>Section *</Label>
                <SearchableCombobox 
                  options={sections.map((s:any) => ({ value: s.id, label: s.name }))}
                  value={secId} onChange={setSecId} placeholder="Select Section"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Subject *</Label>
                <SearchableCombobox 
                  options={subjects.map((s:any) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
                  value={subId} onChange={setSubId} placeholder="Select Subject"
                />
              </div>
              <Button type="submit" disabled={loading} className="col-span-2 mt-2">
                {loading ? "Assigning..." : "Save Workload Assignment"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Faculty</TableHead>
              <TableHead>Department / Course</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkloads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No workloads found.
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkloads.map((w: any) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.faculty.user.profile.firstName} {w.faculty.user.profile.lastName}</TableCell>
                  <TableCell>{w.department.code} / {w.course.code}</TableCell>
                  <TableCell>{w.section.name}</TableCell>
                  <TableCell>{w.subject.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(w.id)} className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
