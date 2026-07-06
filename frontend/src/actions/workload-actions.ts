"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createWorkloadAction(
  facultyId: string,
  departmentId: string,
  courseId: string,
  semesterId: string | undefined,
  sectionId: string,
  subjectId: string
) {
  try {
    const workload = await prisma.facultyWorkload.create({
      data: {
        facultyId,
        departmentId,
        courseId,
        semesterId: semesterId || null,
        sectionId,
        subjectId
      }
    })
    revalidatePath("/admin/workload")
    return { workload }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: "This exact workload assignment already exists." }
    }
    return { error: error.message }
  }
}

export async function deleteWorkloadAction(id: string) {
  try {
    await prisma.facultyWorkload.delete({
      where: { id }
    })
    revalidatePath("/admin/workload")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
