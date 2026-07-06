import { prisma } from "@/lib/prisma"
import { WorkloadManagementClient } from "@/components/admin/workload-management-client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminWorkloadPage() {
  const workloads = await prisma.facultyWorkload.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      faculty: {
        include: { user: { include: { profile: true } } }
      },
      department: true,
      course: true,
      semester: true,
      section: true,
      subject: true
    }
  })
  
  const faculty = await prisma.faculty.findMany({
    include: { user: { include: { profile: true } } }
  })
  const departments = await prisma.department.findMany()
  const courses = await prisma.course.findMany()
  const semesters = await prisma.semester.findMany()
  const sections = await prisma.section.findMany()
  const subjects = await prisma.subject.findMany()

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty Workloads</h1>
          <p className="text-muted-foreground mt-1">Assign subjects and sections to faculty members.</p>
        </div>
      </div>

      <WorkloadManagementClient 
        initialWorkloads={workloads} 
        faculty={faculty}
        departments={departments}
        courses={courses}
        semesters={semesters}
        sections={sections}
        subjects={subjects}
      />
    </div>
  )
}
