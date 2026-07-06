"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createSectionAction(name: string, courseId?: string) {
  try {
    const section = await prisma.section.create({
      data: {
        name,
        courseId: courseId || null
      }
    })
    revalidatePath("/admin/sections")
    return { section }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateSectionAction(id: string, name: string) {
  try {
    const section = await prisma.section.update({
      where: { id },
      data: { name }
    })
    revalidatePath("/admin/sections")
    return { section }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteSectionAction(id: string) {
  try {
    await prisma.section.delete({
      where: { id }
    })
    revalidatePath("/admin/sections")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
