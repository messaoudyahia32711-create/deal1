import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/users - List users (admin, demo: no auth check)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')
    const isVerified = searchParams.get('isVerified')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { storeName: { contains: search } },
      ]
    }

    if (role) {
      where.role = role
    }

    if (isVerified !== null && isVerified !== undefined && isVerified !== '') {
      where.isVerified = isVerified === 'true'
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          wilaya: true,
          isVerified: true,
          isActive: true,
          storeName: true,
          specialty: true,
          experience: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          // Exclude passwordHash
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل المستخدمين' },
      { status: 500 }
    )
  }
}
