import { prisma } from "@/lib/prisma"
import { CourseManagementClient } from "@/components/admin/course-management-client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminCoursesPage() {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' }
  })
  
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      department: true,
      sections: {
        include: {
          _count: {
            select: { students: true }
          }
        }
      },
      subjects: {
        include: {
          semester: true
        }
      }
    }
  })

  // Format the data similarly to how the old component expected it
  const formattedCourses = courses.map(c => ({
    ...c,
    duration: 8 // Assuming 8 semesters for a typical B.Tech
  }))

  return (
    <CourseManagementClient initialCourses={formattedCourses} departments={departments} />
  )
}
