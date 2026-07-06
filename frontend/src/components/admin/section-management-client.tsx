"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Search } from "lucide-react"
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
import { createSectionAction, updateSectionAction, deleteSectionAction } from "@/actions/section-actions"
import { SearchableCombobox } from "@/components/ui/searchable-combobox"

export function SectionManagementClient({ initialSections, courses }: { initialSections: any[], courses: any[] }) {
  const [sections, setSections] = useState(initialSections)
  const [search, setSearch] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  
  const { toast } = useToast()

  const filteredSections = sections.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const courseOptions = courses.map(c => ({ value: c.id, label: c.name }))

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string

    const result = await createSectionAction(name, selectedCourseId || undefined)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else if (result.section) {
      const course = courses.find(c => c.id === selectedCourseId)
      setSections([{...result.section, course, _count: { students: 0 }}, ...sections])
      toast({ title: "Success", description: "Section created." })
      setIsCreateOpen(false)
    }
    setLoading(false)
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string

    const result = await updateSectionAction(editingSection.id, name)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else if (result.section) {
      setSections(sections.map(s => s.id === result.section.id ? { ...s, ...result.section } : s))
      toast({ title: "Success", description: "Section updated." })
      setIsEditOpen(false)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return
    const result = await deleteSectionAction(id)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setSections(sections.filter(s => s.id !== id))
      toast({ title: "Success", description: "Section deleted." })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search sections..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Section</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Section</DialogTitle>
              <DialogDescription>Create a new academic section.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Section Name</Label>
                <Input id="name" name="name" placeholder="e.g. Section A" required />
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
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No sections found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSections.map((sec) => (
                <TableRow key={sec.id}>
                  <TableCell className="font-medium">{sec.name}</TableCell>
                  <TableCell>{sec.course?.name || '-'}</TableCell>
                  <TableCell>{sec._count?.students || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingSection(sec); setIsEditOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(sec.id)} className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950">
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
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          {editingSection && (
            <form onSubmit={handleEdit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Section Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingSection.name} required />
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
