import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/rental-requests - List rental requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const providerId = searchParams.get('providerId')
    const rentalId = searchParams.get('rentalId')
    const status = searchParams.get('status')

    const where: any = {}

    if (userId) {
      where.OR = [{ customerId: userId }, { providerId: userId }]
    }

    if (providerId) {
      where.providerId = providerId
    }

    if (rentalId) {
      where.rentalId = rentalId
    }

    if (status) {
      where.status = status
    }

    const rentalRequests = await db.rentalRequest.findMany({
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
            storeName: true,
            specialty: true,
            wilaya: true,
            avatar: true,
          },
        },
        rental: {
          select: {
            id: true,
            title: true,
            dailyRate: true,
            deposit: true,
            deliveryAvailable: true,
            deliveryFee: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Parse rental images
    const enrichedRequests = rentalRequests.map((req) => ({
      ...req,
      rental: {
        ...req.rental,
        images: (() => {
          try {
            return JSON.parse(req.rental.images)
          } catch {
            return []
          }
        })(),
      },
    }))

    return NextResponse.json({
      data: enrichedRequests,
    })
  } catch (error) {
    console.error('RentalRequests GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل طبات التأجير' },
      { status: 500 }
    )
  }
}

// POST /api/rental-requests - Create rental request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      providerId,
      rentalId,
      startDate,
      endDate,
      withDelivery,
      deliveryAddress,
      notes,
    } = body

    if (!customerId || !providerId || !rentalId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      )
    }

    // Get rental to verify and get rates
    const rental = await db.rental.findUnique({
      where: { id: rentalId },
    })

    if (!rental) {
      return NextResponse.json(
        { error: 'المعدة غير موجودة' },
        { status: 404 }
      )
    }

    // Calculate total days
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = end.getTime() - start.getTime()
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    // Calculate total price based on daily rate
    const totalPrice = rental.dailyRate * totalDays

    // Add delivery fee if applicable
    const finalPrice = withDelivery && rental.deliveryFee
      ? totalPrice + rental.deliveryFee
      : totalPrice

    // Calculate deposit amount
    const depositAmount = rental.deposit || 0

    // Calculate commission (1.5%)
    const commissionAmount = finalPrice * 0.015

    const rentalRequest = await db.rentalRequest.create({
      data: {
        customerId,
        providerId,
        rentalId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays,
        totalPrice: finalPrice,
        depositAmount,
        commissionAmount,
        status: 'pending',
        withDelivery: withDelivery || false,
        deliveryAddress: deliveryAddress || null,
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
            storeName: true,
            specialty: true,
          },
        },
        rental: {
          select: {
            id: true,
            title: true,
            dailyRate: true,
            deposit: true,
            images: true,
          },
        },
      },
    })

    // Notify provider
    await db.notification.create({
      data: {
        userId: providerId,
        title: 'طلب تأجير جديد',
        message: `لقد استلمت طلب تأجير جديدًا: ${rental.title}`,
        type: 'order',
      },
    })

    // Parse rental images for response
    const enrichedRequest = {
      ...rentalRequest,
      rental: {
        ...rentalRequest.rental,
        images: (() => {
          try {
            return JSON.parse(rentalRequest.rental.images)
          } catch {
            return []
          }
        })(),
      },
    }

    return NextResponse.json(
      {
        data: enrichedRequest,
        message: 'تم إنشاء طلب التأجير بنجاح',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('RentalRequests POST error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء طلب التأجير' },
      { status: 500 }
    )
  }
}
