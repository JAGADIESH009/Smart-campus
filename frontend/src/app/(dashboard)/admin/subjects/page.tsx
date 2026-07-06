import { prisma } from "@/lib/prisma"
import { SubjectManagementClient } from "@/components/admin/subject-management-client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminSubjectsPage() {
  const subjects = await prisma.subject.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      course: true,
      _count: {
        select: { assignments: true, attendances: true }
      }
    }
  })
  
  const courses = await prisma.course.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage academic subjects and their courses.</p>
        </div>
      </div>

      <SubjectManagementClient initialSubjects={subjects} courses={courses} />
    </div>
  )
}
