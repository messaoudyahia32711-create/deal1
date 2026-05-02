import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/complaints - List complaints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (userId) {
      where.userId = userId
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        include: {
          // We need to get user info - Complaint doesn't have relation defined
          // but userId is there, so we'll fetch separately if needed
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.complaint.count({ where }),
    ])

    // Enrich with user info
    const userIds = [...new Set(complaints.map((c) => c.userId))]
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
      },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    // Also get target user info
    const targetUserIds = [
      ...new Set(complaints.filter((c) => c.targetUserId).map((c) => c.targetUserId!)),
    ]
    const targetUsers = targetUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: targetUserIds } },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        })
      : []
    const targetUserMap = new Map(targetUsers.map((u) => [u.id, u]))

    const enrichedComplaints = complaints.map((complaint) => ({
      ...complaint,
      user: userMap.get(complaint.userId) || null,
      targetUser: complaint.targetUserId
        ? targetUserMap.get(complaint.targetUserId) || null
        : null,
    }))

    return NextResponse.json({
      data: enrichedComplaints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Complaints GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل الشكاوى' },
      { status: 500 }
    )
  }
}

// POST /api/complaints - Create complaint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, targetUserId, subject, description, priority } = body

    if (!userId || !subject || !description) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      )
    }

    const complaint = await db.complaint.create({
      data: {
        userId,
        targetUserId: targetUserId || null,
        subject,
        description,
        priority: priority || 'medium',
        status: 'open',
      },
    })

    // Notify admin (find first admin user)
    const admin = await db.user.findFirst({
      where: { role: 'admin' },
    })

    if (admin) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: 'شكوى جديدة',
          message: `تم تقديم شكوى جديدة: ${subject}`,
          type: 'system',
        },
      })
    }

    return NextResponse.json(
      {
        data: complaint,
        message: 'تم تقديم الشكوى بنجاح',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Complaints POST error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تقديم الشكوى' },
      { status: 500 }
    )
  }
}
