"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createSubjectAction(name: string, courseId?: string) {
  try {
    const code = name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000)
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        courseId: courseId || null,
        credits: 3
      }
    })
    revalidatePath("/admin/subjects")
    return { subject }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateSubjectAction(id: string, name: string, code: string, credits: number) {
  try {
    const subject = await prisma.subject.update({
      where: { id },
      data: { name, code, credits }
    })
    revalidatePath("/admin/subjects")
    return { subject }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteSubjectAction(id: string) {
  try {
    await prisma.subject.delete({
      where: { id }
    })
    revalidatePath("/admin/subjects")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
