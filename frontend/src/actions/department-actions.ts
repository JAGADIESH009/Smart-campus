"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createDepartmentAction(name: string) {
  try {
    // Generate a simple code if not provided
    const code = name.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()
    
    const department = await prisma.department.create({
      data: {
        name,
        code,
        description: `Department of ${name}`
      }
    })

    revalidatePath("/admin/departments")
    revalidatePath("/admin/users")
    return { success: true, department }
  } catch (error: any) {
    console.error("Error creating department:", error)
    return { error: error.message || "Failed to create department" }
  }
}

export async function updateDepartmentAction(id: string, name: string, code: string, description?: string) {
  try {
    const department = await prisma.department.update({
      where: { id },
      data: { name, code, description }
    })
    
    revalidatePath("/admin/departments")
    revalidatePath("/admin/users")
    return { success: true, department }
  } catch (error: any) {
    return { error: error.message || "Failed to update department" }
  }
}

export async function deleteDepartmentAction(id: string) {
  try {
    await prisma.department.delete({ where: { id } })
    revalidatePath("/admin/departments")
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete department. It may be in use." }
  }
}
