import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/service-requests - List service requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}

    if (userId && role === 'customer') {
      where.customerId = userId
    } else if (userId && role === 'service_provider') {
      where.providerId = userId
    } else if (userId) {
      where.OR = [{ customerId: userId }, { providerId: userId }]
    }

    if (status) {
      where.status = status
    }

    const [serviceRequests, total] = await Promise.all([
      db.serviceRequest.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              wilaya: true,
            },
          },
          provider: {
            select: {
              id: true,
              username: true,
              specialty: true,
              wilaya: true,
              avatar: true,
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              priceType: true,
              price: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.serviceRequest.count({ where }),
    ])

    // Parse service images
    const enrichedRequests = serviceRequests.map((req) => ({
      ...req,
      service: {
        ...req.service,
        images: (() => {
          try {
            return JSON.parse(req.service.images)
          } catch {
            return []
          }
        })(),
      },
    }))

    return NextResponse.json({
      data: enrichedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('ServiceRequests GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل طلبات الخدمة' },
      { status: 500 }
    )
  }
}

// POST /api/service-requests - Create service request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      providerId,
      serviceId,
      scheduledDate,
      totalPrice,
      serviceLocation,
      notes,
    } = body

    if (!customerId || !providerId || !serviceId) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      )
    }

    // Get service to verify and get price
    const service = await db.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'الخدمة غير موجودة' },
        { status: 404 }
      )
    }

    const finalPrice = totalPrice || service.price || 0
    const commissionAmount = finalPrice * 0.015

    const serviceRequest = await db.serviceRequest.create({
      data: {
        customerId,
        providerId,
        serviceId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: 'pending',
        totalPrice: finalPrice,
        commissionAmount,
        serviceLocation: serviceLocation || null,
        notes: notes || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        provider: {
          select: {
            id: true,
            username: true,
            specialty: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            priceType: true,
            price: true,
          },
        },
      },
    })

    // Notify provider
    await db.notification.create({
      data: {
        userId: providerId,
        title: 'طلب خدمة جديد',
        message: `لقد استلمت طلب خدمة جديدًا: ${service.title}`,
        type: 'order',
      },
    })

    return NextResponse.json(
      {
        data: serviceRequest,
        message: 'تم إنشاء طلب الخدمة بنجاح',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('ServiceRequests POST error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء طلب الخدمة' },
      { status: 500 }
    )
  }
}
