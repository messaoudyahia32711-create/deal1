import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // Build update data - only allow specific fields
    const updateData: any = {}

    const allowedFields = [
      'username',
      'email',
      'phone',
      'address',
      'wilaya',
      'isVerified',
      'isActive',
      'storeName',
      'specialty',
      'experience',
      'avatar',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
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
      },
    })

    // If user was verified, send notification
    if (body.isVerified === true && !existingUser.isVerified) {
      await db.notification.create({
        data: {
          userId: id,
          title: 'تم التحقق من حسابك',
          message: 'تهانينا! تم التحقق من حسابك بنجاح',
          type: 'system',
        },
      })
    }

    // If user was suspended
    if (body.isActive === false && existingUser.isActive) {
      await db.notification.create({
        data: {
          userId: id,
          title: 'تم تعليق حسابك',
          message: 'تم تعليق حسابك. يرجى التواصل مع الإدارة للمزيد من المعلومات',
          type: 'system',
        },
      })
    }

    return NextResponse.json({
      data: user,
      message: 'تم تحديث المستخدم بنجاح',
    })
  } catch (error) {
    console.error('User PUT error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المستخدم' },
      { status: 500 }
    )
  }
}
