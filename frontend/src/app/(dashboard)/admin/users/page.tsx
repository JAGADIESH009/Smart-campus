import { prisma } from "@/lib/prisma"
import { UserManagementClient } from "@/components/admin/user-management-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: {
      role: true,
      profile: true,
      admin: true,
      faculty: true,
      student: true,
      alumni: true,
    }
  })

  const departments = await prisma.department.findMany()
  const courses = await prisma.course.findMany()

  // Format users for the data table
  const formattedUsers = users.map((u) => {
    let specificInfo = ""
    if (u.role.name === "STUDENT" && u.student) {
      specificInfo = `Reg: ${u.student.registrationNo} | Roll: ${u.student.rollNumber}`
    } else if (u.role.name === "FACULTY" && u.faculty) {
      specificInfo = `Emp ID: ${u.faculty.employeeId}`
    }

    return {
      id: u.id,
      email: u.email,
      name: u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : "No Profile",
      role: u.role.name,
      specificInfo,
      createdAt: u.createdAt.toISOString(),
    }
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage users, assign roles, and handle password resets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementClient 
            users={formattedUsers} 
            departments={departments}
            courses={courses}
          />
        </CardContent>
      </Card>
    </div>
  )
}
