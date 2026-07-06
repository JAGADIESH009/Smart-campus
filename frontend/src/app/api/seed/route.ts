import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing env vars" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let role = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
    if (!role) {
      role = await prisma.role.create({ data: { name: 'ADMIN', description: 'Admin Role' } })
    }

    const email = 'admin@smartcampus.com'
    const password = 'AdminPassword123!'

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { firstName: 'Super', lastName: 'Admin' }
    })

    if (error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ message: "Admin already exists", email, password })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const userId = data.user.id

    await prisma.user.create({
      data: {
        id: userId,
        email: email,
        roleId: role.id,
        profile: {
          create: { firstName: 'Super', lastName: 'Admin' }
        }
      }
    })

    await prisma.admin.create({ data: { userId } })

    return NextResponse.json({ success: true, email, password })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
