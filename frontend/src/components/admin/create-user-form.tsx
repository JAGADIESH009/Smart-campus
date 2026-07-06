"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUserAction } from "@/app/actions/user-actions"
import { useToast } from "@/hooks/use-toast"
import { SearchableCombobox } from "@/components/ui/searchable-combobox"

export function CreateUserForm({ onSuccess, departments, courses }: { onSuccess: () => void, departments: any[], courses: any[] }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState("STUDENT")
  
  const [departmentId, setDepartmentId] = useState<string>("")
  const [courseId, setCourseId] = useState<string>("")

  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }))
  // Filter courses by selected department
  const filteredCourses = courses.filter(c => c.departmentId === departmentId)
  const courseOptions = filteredCourses.map(c => ({ value: c.id, label: c.name }))

  const handleCreateDepartment = async (name: string) => {
    const { createDepartmentAction } = await import("@/app/actions/department-actions")
    const res = await createDepartmentAction(name)
    if (res.error) throw new Error(res.error)
    if (res.department) {
      departments.push(res.department) // Optimistic local update
      setDepartmentId(res.department.id)
      toast({ title: "Created", description: `Department "${name}" created.` })
    }
  }

  const handleCreateCourse = async (name: string) => {
    if (!departmentId) {
      toast({ title: "Error", description: "Select a department first.", variant: "destructive" })
      return
    }
    const { createCourseAction } = await import("@/app/actions/course-actions")
    const res = await createCourseAction(name, departmentId)
    if (res.error) throw new Error(res.error)
    if (res.course) {
      courses.push(res.course) // Optimistic local update
      setCourseId(res.course.id)
      toast({ title: "Created", description: `Course "${name}" created.` })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (role !== 'ADMIN' && !departmentId) {
      toast({ title: "Required", description: "Please select a department.", variant: "destructive" })
      return
    }
    if (role === 'STUDENT' && !courseId) {
      toast({ title: "Required", description: "Please select a course.", variant: "destructive" })
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    data.roleName = role
    if (role !== 'ADMIN') data.departmentId = departmentId
    if (role === 'STUDENT') data.courseId = courseId

    const result = await createUserAction(data)
    
    setLoading(false)

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Success", description: "User created successfully." })
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" required />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STUDENT">Student</SelectItem>
            <SelectItem value="FACULTY">Faculty</SelectItem>
            <SelectItem value="ALUMNI">Alumni</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {role !== 'ADMIN' && (
        <div className="space-y-2">
          <Label>Department</Label>
          <SearchableCombobox 
            options={departmentOptions}
            value={departmentId}
            onChange={(val) => {
              setDepartmentId(val)
              setCourseId("") // Reset course when department changes
            }}
            onCreate={handleCreateDepartment}
            placeholder="Select Department..."
          />
        </div>
      )}

      {role === 'STUDENT' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registrationNo">Registration No</Label>
              <Input id="registrationNo" name="registrationNo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input id="rollNumber" name="rollNumber" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Course</Label>
            <SearchableCombobox 
              options={courseOptions}
              value={courseId}
              onChange={setCourseId}
              onCreate={handleCreateCourse}
              placeholder="Select Course..."
              disabled={!departmentId}
            />
          </div>
        </>
      )}

      {role === 'FACULTY' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input id="employeeId" name="employeeId" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" name="designation" />
          </div>
        </div>
      )}

      {role === 'ALUMNI' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input id="graduationYear" name="graduationYear" type="number" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company (Optional)</Label>
            <Input id="companyName" name="companyName" />
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create User"}
        </Button>
      </div>
    </form>
  )
}
