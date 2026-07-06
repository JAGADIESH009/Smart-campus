"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUserAction } from "@/actions/user-actions"
import { useToast } from "@/hooks/use-toast"
import { SearchableCombobox } from "@/components/ui/searchable-combobox"

export function EditUserForm({ user, onSuccess, departments, courses }: { user: any, onSuccess: () => void, departments: any[], courses: any[] }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState(user.role)
  
  const [departmentId, setDepartmentId] = useState<string>("")
  const [courseId, setCourseId] = useState<string>("")

  // Pre-populate data
  useEffect(() => {
    if (user.role === 'STUDENT' && user.student) {
      setDepartmentId(user.student.departmentId || "")
      setCourseId(user.student.courseId || "")
    } else if (user.role === 'FACULTY' && user.faculty) {
      setDepartmentId(user.faculty.departmentId || "")
    } else if (user.role === 'ALUMNI' && user.alumni) {
      setDepartmentId(user.alumni.departmentId || "")
    }
  }, [user])

  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }))
  const filteredCourses = courses.filter(c => c.departmentId === departmentId)
  const courseOptions = filteredCourses.map(c => ({ value: c.id, label: c.name }))

  const handleCreateDepartment = async (name: string) => {
    const { createDepartmentAction } = await import("@/actions/department-actions")
    const res = await createDepartmentAction(name)
    if (res.error) throw new Error(res.error)
    if (res.department) {
      departments.push(res.department)
      setDepartmentId(res.department.id)
      toast({ title: "Created", description: `Department "${name}" created.` })
    }
  }

  const handleCreateCourse = async (name: string) => {
    if (!departmentId) {
      toast({ title: "Error", description: "Select a department first.", variant: "destructive" })
      return
    }
    const { createCourseAction } = await import("@/actions/course-actions")
    const res = await createCourseAction(name, departmentId)
    if (res.error) throw new Error(res.error)
    if (res.course) {
      courses.push(res.course)
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
    
    if (role !== 'ADMIN') data.departmentId = departmentId
    if (role === 'STUDENT') data.courseId = courseId

    // Remove empty strings so we don't overwrite with empty values if optional
    Object.keys(data).forEach(key => {
      if (data[key] === "") delete data[key]
    })

    const result = await updateUserAction(user.id, data)
    
    setLoading(false)

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Success", description: "User updated successfully." })
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" defaultValue={user.profile?.firstName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" defaultValue={user.profile?.lastName} required />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={user.email} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">New Password (leave empty to keep current)</Label>
          <Input id="password" name="password" type="password" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactNumber">Phone Number</Label>
          <Input id="contactNumber" name="contactNumber" defaultValue={user.profile?.contactNumber || ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={user.profile?.dateOfBirth ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0] : ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select name="gender" defaultValue={user.profile?.gender || ""}>
            <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bloodGroup">Blood Group</Label>
          <Input id="bloodGroup" name="bloodGroup" defaultValue={user.profile?.bloodGroup || ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={user.profile?.address || ""} />
      </div>

      <div className="space-y-2">
        <Label>Role (Fixed)</Label>
        <Input value={role} disabled />
      </div>

      {role !== 'ADMIN' && (
        <div className="space-y-2">
          <Label>Department</Label>
          <SearchableCombobox 
            options={departmentOptions}
            value={departmentId}
            onChange={(val) => {
              setDepartmentId(val)
              setCourseId("") 
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
              <Input id="registrationNo" name="registrationNo" defaultValue={user.student?.registrationNo || ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input id="rollNumber" name="rollNumber" defaultValue={user.student?.rollNumber || ""} required />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academicStatus">Status</Label>
              <Select name="academicStatus" defaultValue={user.student?.academicStatus || "ACTIVE"}>
                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="GRADUATED">Graduated</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semesterId">Semester ID</Label>
              <Input id="semesterId" name="semesterId" defaultValue={user.student?.semesterId || ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent Name</Label>
              <Input id="parentName" name="parentName" defaultValue={user.student?.parentName || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentContact">Parent Phone</Label>
              <Input id="parentContact" name="parentContact" defaultValue={user.student?.parentContact || ""} />
            </div>
          </div>
        </>
      )}

      {role === 'FACULTY' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input id="employeeId" name="employeeId" defaultValue={user.faculty?.employeeId || ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" name="designation" defaultValue={user.faculty?.designation || ""} />
          </div>
        </div>
      )}

      {role === 'ALUMNI' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input id="graduationYear" name="graduationYear" type="number" defaultValue={user.alumni?.graduationYear || ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company (Optional)</Label>
            <Input id="companyName" name="companyName" defaultValue={user.alumni?.companyName || ""} />
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
