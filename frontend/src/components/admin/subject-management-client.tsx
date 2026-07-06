"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { createSubjectAction, updateSubjectAction, deleteSubjectAction } from "@/actions/subject-actions"
import { SearchableCombobox } from "@/components/ui/searchable-combobox"

export function SubjectManagementClient({ initialSubjects, courses }: { initialSubjects: any[], courses: any[] }) {
  const [subjects, setSubjects] = useState(initialSubjects)
  const [search, setSearch] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  
  const { toast } = useToast()

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.code.toLowerCase().includes(search.toLowerCase())
  )

  const courseOptions = courses.map(c => ({ value: c.id, label: c.name }))

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string

    const result = await createSubjectAction(name, selectedCourseId || undefined)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else if (result.subject) {
      const course = courses.find(c => c.id === selectedCourseId)
      setSubjects([{...result.subject, course, _count: { assignments: 0, attendances: 0 }}, ...subjects])
      toast({ title: "Success", description: "Subject created." })
      setIsCreateOpen(false)
    }
    setLoading(false)
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const code = formData.get("code") as string
    const credits = parseInt(formData.get("credits") as string)

    const result = await updateSubjectAction(editingSubject.id, name, code, credits)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else if (result.subject) {
      setSubjects(subjects.map(s => s.id === result.subject.id ? { ...s, ...result.subject } : s))
      toast({ title: "Success", description: "Subject updated." })
      setIsEditOpen(false)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return
    const result = await deleteSubjectAction(id)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setSubjects(subjects.filter(s => s.id !== id))
      toast({ title: "Success", description: "Subject deleted." })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search subjects..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Subject</DialogTitle>
              <DialogDescription>Create a new academic subject.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input id="name" name="name" placeholder="e.g. Data Structures" required />
              </div>
              <div className="space-y-2">
                <Label>Course (Optional)</Label>
                <SearchableCombobox 
                  options={courseOptions}
                  value={selectedCourseId}
                  onChange={setSelectedCourseId}
                  placeholder="Select Course..."
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No subjects found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium font-mono text-xs">{sub.code}</TableCell>
                  <TableCell>{sub.name}</TableCell>
                  <TableCell>{sub.course?.name || '-'}</TableCell>
                  <TableCell>{sub.credits}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingSubject(sub); setIsEditOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)} className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          {editingSubject && (
            <form onSubmit={handleEdit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Subject Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingSubject.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Subject Code</Label>
                <Input id="edit-code" name="code" defaultValue={editingSubject.code} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-credits">Credits</Label>
                <Input type="number" id="edit-credits" name="credits" defaultValue={editingSubject.credits} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
