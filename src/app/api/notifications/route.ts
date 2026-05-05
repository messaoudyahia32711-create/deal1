import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/notifications - Get notifications by userId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const isRead = searchParams.get('isRead')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { userId }

    if (isRead !== null && isRead !== undefined && isRead !== '') {
      where.isRead = isRead === 'true'
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
    ])

    // Get unread count
    const unreadCount = await db.notification.count({
      where: { userId, isRead: false },
    })

    return NextResponse.json({
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل الإشعارات' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Mark as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, userId, markAll } = body

    if (markAll && userId) {
      // Mark all notifications as read for a user
      await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })

      return NextResponse.json({
        message: 'تم تعليم جميع الإشعارات كمقروءة',
      })
    }

    if (notificationId) {
      // Mark single notification as read
      const notification = await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })

      return NextResponse.json({
        data: notification,
        message: 'تم تعليم الإشعار كمقروء',
      })
    }

    return NextResponse.json(
      { error: 'معرف الإشعار أو المستخدم مطلوب' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Notifications POST error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الإشعارات' },
      { status: 500 }
    )
  }
}
