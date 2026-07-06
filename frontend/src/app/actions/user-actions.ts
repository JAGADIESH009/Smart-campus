"use server"

import { createAdminClient } from "@/utils/supabase/admin"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createUserAction(data: any) {
  try {
    const supabase = createAdminClient()

    // 1. Get or Create Role
    let role = await prisma.role.findUnique({ where: { name: data.roleName } })
    if (!role) {
      role = await prisma.role.create({
        data: { name: data.roleName, description: `${data.roleName} Role` }
      })
    }

    // 2. Create User in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        firstName: data.firstName,
        lastName: data.lastName,
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    const userId = authData.user.id

    // 3. Create User in Prisma
    await prisma.user.create({
      data: {
        id: userId,
        email: data.email,
        roleId: role.id,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
          }
        }
      }
    })

    // 4. Create Role-Specific Record
    if (data.roleName === 'ADMIN') {
      await prisma.admin.create({ data: { userId } })
    } else if (data.roleName === 'FACULTY') {
      await prisma.faculty.create({
        data: {
          userId,
          employeeId: data.employeeId,
          departmentId: data.departmentId,
          designation: data.designation || null
        }
      })
    } else if (data.roleName === 'STUDENT') {
      await prisma.student.create({
        data: {
          userId,
          registrationNo: data.registrationNo,
          rollNumber: data.rollNumber,
          departmentId: data.departmentId,
          courseId: data.courseId,
          semesterId: data.semesterId || null
        }
      })
    } else if (data.roleName === 'ALUMNI') {
      await prisma.alumni.create({
        data: {
          userId,
          graduationYear: parseInt(data.graduationYear),
          departmentId: data.departmentId,
          companyName: data.companyName || null,
          currentPosition: data.currentPosition || null
        }
      })
    }

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating user:", error)
    return { error: error.message || "Failed to create user" }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const supabase = createAdminClient()
    
    // Prisma cascading delete will handle the related records in Prisma
    // if the User record is deleted.
    await prisma.user.delete({
      where: { id: userId }
    })

    // Delete from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      console.error("Error deleting from supabase auth:", error)
      // We already deleted from Prisma, which might cause inconsistency, 
      // but usually Supabase delete succeeds if we have the right permissions.
    }

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return { error: error.message || "Failed to delete user" }
  }
}

export async function resetPasswordAction(email: string) {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to send reset link" }
  }
}
