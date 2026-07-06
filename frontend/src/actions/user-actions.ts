"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Helper to log admin actions
async function logAdminAction(action: string, details: string) {
  try {
    // We need to identify the current admin user if possible.
    // For now, we will log it with a system ID or if we can extract from session.
    // Assuming this is called by an admin, we could get their ID from Supabase.
    const supabase = createAdminClient()
    const { data: { session } } = await supabase.auth.getSession()
    // However, createAdminClient doesn't have a session usually because it's a service role.
    // Let's use a dummy ID for the system if we can't get the admin, or just log to a general log.
    // Let's create an ActivityLog for the target user instead, or the first admin we find.
    const adminUser = await prisma.user.findFirst({ where: { role: { name: 'ADMIN' } }})
    if (adminUser) {
      await prisma.activityLog.create({
        data: {
          userId: adminUser.id,
          action: action,
          details: details
        }
      })
    }
  } catch (e) {
    console.error("Failed to log admin action", e)
  }
}

export async function createUserAction(data: any) {
  const supabase = createAdminClient()
  let authUserId: string | null = null;
  
  try {
    // 1. Pre-validation checks
    if (data.roleName === 'FACULTY') {
      const existingFaculty = await prisma.faculty.findUnique({ where: { employeeId: data.employeeId } })
      if (existingFaculty) throw new Error(`Employee ID ${data.employeeId} is already in use.`)
    } else if (data.roleName === 'STUDENT') {
      const existingStudentReg = await prisma.student.findUnique({ where: { registrationNo: data.registrationNo } })
      if (existingStudentReg) throw new Error(`Registration Number ${data.registrationNo} is already in use.`)
      const existingStudentRoll = await prisma.student.findUnique({ where: { rollNumber: data.rollNumber } })
      if (existingStudentRoll) throw new Error(`Roll Number ${data.rollNumber} is already in use.`)
    }

    let role = await prisma.role.findUnique({ where: { name: data.roleName } })
    if (!role) {
      role = await prisma.role.create({
        data: { name: data.roleName, description: `${data.roleName} Role` }
      })
    }

    // 2. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.roleName,
      }
    })

    if (authError) {
      throw new Error(authError.message)
    }

    authUserId = authData.user.id

    // 3. Database Transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: authUserId!,
          email: data.email,
          roleId: role!.id,
          profile: {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
            }
          }
        }
      })

      if (data.roleName === 'ADMIN') {
        await tx.admin.create({ data: { userId: authUserId! } })
      } else if (data.roleName === 'FACULTY') {
        await tx.faculty.create({
          data: {
            userId: authUserId!,
            employeeId: data.employeeId,
            departmentId: data.departmentId,
            designation: data.designation || null
          }
        })
      } else if (data.roleName === 'STUDENT') {
        await tx.student.create({
          data: {
            userId: authUserId!,
            registrationNo: data.registrationNo,
            rollNumber: data.rollNumber,
            departmentId: data.departmentId,
            courseId: data.courseId,
            semesterId: data.semesterId || null
          }
        })
      } else if (data.roleName === 'ALUMNI') {
        await tx.alumni.create({
          data: {
            userId: authUserId!,
            graduationYear: parseInt(data.graduationYear),
            departmentId: data.departmentId,
            companyName: data.companyName || null,
            currentPosition: data.currentPosition || null
          }
        })
      }
    })

    await logAdminAction("CREATE_USER", `Created user ${data.email} with role ${data.roleName}`)
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating user:", error)
    
    // 4. Rollback Supabase Auth user if Prisma transaction fails
    if (authUserId) {
      console.warn(`Rolling back Auth User ${authUserId} due to database failure.`)
      await supabase.auth.admin.deleteUser(authUserId)
    }
    
    return { error: error.message || "Failed to create user" }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const supabase = createAdminClient()
    const user = await prisma.user.findUnique({ where: { id: userId } })
    
    await prisma.user.delete({
      where: { id: userId }
    })

    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      console.error("Error deleting from supabase auth:", error)
    }

    if (user) {
      await logAdminAction("DELETE_USER", `Deleted user ${user.email} (ID: ${userId})`)
    }
    
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return { error: error.message || "Failed to delete user" }
  }
}

export async function bulkDeleteAction(userIds: string[]) {
  try {
    const supabase = createAdminClient()
    for (const userId of userIds) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      await prisma.user.delete({ where: { id: userId } })
      await supabase.auth.admin.deleteUser(userId)
      if (user) {
        await logAdminAction("DELETE_USER", `Bulk deleted user ${user.email} (ID: ${userId})`)
      }
    }
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete users" }
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
    await logAdminAction("RESET_PASSWORD", `Sent reset password link to ${email}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to send reset link" }
  }
}

export async function updateUserStatusAction(userId: string, isBanned: boolean) {
  try {
    const supabase = createAdminClient()
    
    // In Supabase Auth, banning a user prevents them from logging in.
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { ban_duration: isBanned ? '87600h' : 'none' } // Ban for 10 years or unban
    )

    if (error) throw error
    
    // Also update a status field in Prisma if we have one. We don't have a direct 'status' field on User right now,
    // but Student has 'academicStatus'. We will just rely on Supabase ban for Auth blocking.
    
    await logAdminAction(isBanned ? "DISABLE_USER" : "ENABLE_USER", `User ${userId} was ${isBanned ? 'disabled' : 'enabled'}`)
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to update user status" }
  }
}

export async function bulkUpdateStatusAction(userIds: string[], isBanned: boolean) {
  try {
    const supabase = createAdminClient()
    for (const userId of userIds) {
      await supabase.auth.admin.updateUserById(userId, { ban_duration: isBanned ? '87600h' : 'none' })
      await logAdminAction(isBanned ? "DISABLE_USER" : "ENABLE_USER", `Bulk ${isBanned ? 'disabled' : 'enabled'} user ${userId}`)
    }
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to update users status" }
  }
}

export async function updateUserAction(userId: string, data: any) {
  try {
    const supabase = createAdminClient()
    
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } })
    if (!user) throw new Error("User not found")

    // Update Supabase Auth if email or password changed
    const authUpdates: any = {}
    if (data.email && data.email !== user.email) authUpdates.email = data.email
    if (data.password) authUpdates.password = data.password
    
    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, authUpdates)
      if (authError) throw authError
    }

    // Update Prisma User
    const userUpdates: any = {}
    if (data.email) userUpdates.email = data.email
    
    await prisma.user.update({
      where: { id: userId },
      data: userUpdates
    })

    // Update Profile
    const profileUpdates: any = {}
    if (data.firstName) profileUpdates.firstName = data.firstName
    if (data.lastName) profileUpdates.lastName = data.lastName
    if (data.contactNumber !== undefined) profileUpdates.contactNumber = data.contactNumber
    if (data.profilePhoto !== undefined) profileUpdates.profilePhoto = data.profilePhoto
    if (data.address !== undefined) profileUpdates.address = data.address
    if (data.dateOfBirth) profileUpdates.dateOfBirth = new Date(data.dateOfBirth)
    if (data.gender !== undefined) profileUpdates.gender = data.gender
    if (data.bloodGroup !== undefined) profileUpdates.bloodGroup = data.bloodGroup

    await prisma.userProfile.update({
      where: { userId },
      data: profileUpdates
    })

    // Update Role-Specific tables
    if (user.role.name === 'STUDENT') {
      const studentUpdates: any = {}
      if (data.registrationNo) studentUpdates.registrationNo = data.registrationNo
      if (data.rollNumber) studentUpdates.rollNumber = data.rollNumber
      if (data.departmentId) studentUpdates.departmentId = data.departmentId
      if (data.courseId) studentUpdates.courseId = data.courseId
      if (data.semesterId !== undefined) studentUpdates.semesterId = data.semesterId
      if (data.sectionId !== undefined) studentUpdates.sectionId = data.sectionId
      if (data.academicStatus !== undefined) studentUpdates.academicStatus = data.academicStatus
      if (data.parentName !== undefined) studentUpdates.parentName = data.parentName
      if (data.parentContact !== undefined) studentUpdates.parentContact = data.parentContact
      
      if (Object.keys(studentUpdates).length > 0) {
        await prisma.student.update({
          where: { userId },
          data: studentUpdates
        })
      }
    } else if (user.role.name === 'FACULTY') {
      const facultyUpdates: any = {}
      if (data.employeeId) facultyUpdates.employeeId = data.employeeId
      if (data.departmentId) facultyUpdates.departmentId = data.departmentId
      if (data.designation !== undefined) facultyUpdates.designation = data.designation
      
      if (Object.keys(facultyUpdates).length > 0) {
        await prisma.faculty.update({
          where: { userId },
          data: facultyUpdates
        })
      }
    }

    await logAdminAction("EDIT_USER", `Edited user ${user.email} (ID: ${userId})`)
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating user:", error)
    return { error: error.message || "Failed to update user" }
  }
}
