"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createCourseAction(name: string, departmentId: string) {
  try {
    const code = name.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()
    
    const course = await prisma.course.create({
      data: {
        name,
        code,
        departmentId
      }
    })

    revalidatePath("/admin/courses")
    revalidatePath("/admin/users")
    return { success: true, course }
  } catch (error: any) {
    console.error("Error creating course:", error)
    return { error: error.message || "Failed to create course" }
  }
}

export async function updateCourseAction(id: string, name: string, code: string, departmentId: string) {
  try {
    const course = await prisma.course.update({
      where: { id },
      data: { name, code, departmentId }
    })
    
    revalidatePath("/admin/courses")
    revalidatePath("/admin/users")
    return { success: true, course }
  } catch (error: any) {
    return { error: error.message || "Failed to update course" }
  }
}

export async function deleteCourseAction(id: string) {
  try {
    await prisma.course.delete({ where: { id } })
    revalidatePath("/admin/courses")
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete course. It may be in use." }
  }
}
