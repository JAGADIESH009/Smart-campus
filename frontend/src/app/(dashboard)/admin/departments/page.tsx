import { prisma } from "@/lib/prisma"
import { DepartmentManagementClient } from "@/components/admin/department-management-client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDepartmentsPage() {
  const departments = await prisma.department.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { courses: true, students: true, faculty: true }
      }
    }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage academic departments across the institution.</p>
        </div>
      </div>

      <DepartmentManagementClient initialDepartments={departments} />
    </div>
  )
}
