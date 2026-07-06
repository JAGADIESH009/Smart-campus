import { prisma } from "@/lib/prisma"
import { SectionManagementClient } from "@/components/admin/section-management-client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminSectionsPage() {
  const sections = await prisma.section.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      course: true,
      _count: {
        select: { students: true }
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
          <h1 className="text-3xl font-bold tracking-tight">Sections</h1>
          <p className="text-muted-foreground mt-1">Manage academic sections and assign them to courses.</p>
        </div>
      </div>

      <SectionManagementClient initialSections={sections} courses={courses} />
    </div>
  )
}
