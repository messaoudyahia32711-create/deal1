import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/service-requests/[id] - Update service request status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'حالة الطلب مطلوبة' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'حالة الطلب غير صالحة' },
        { status: 400 }
      )
    }

    // Get current service request
    const currentRequest = await db.serviceRequest.findUnique({
      where: { id },
    })

    if (!currentRequest) {
      return NextResponse.json(
        { error: 'طلب الخدمة غير موجود' },
        { status: 404 }
      )
    }

    // Update service request
    const serviceRequest = await db.serviceRequest.update({
      where: { id },
      data: { status },
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
    })

    // If completed, update provider wallet
    if (status === 'completed') {
      const netAmount = currentRequest.totalPrice - currentRequest.commissionAmount

      // Upsert wallet
      const existingWallet = await db.merchantWallet.findUnique({
        where: { merchantId: currentRequest.providerId },
      })

      if (existingWallet) {
        await db.merchantWallet.update({
          where: { merchantId: currentRequest.providerId },
          data: {
            balance: { increment: netAmount },
            totalEarned: { increment: netAmount },
            totalCommissionPaid: { increment: currentRequest.commissionAmount },
          },
        })
      } else {
        await db.merchantWallet.create({
          data: {
            merchantId: currentRequest.providerId,
            balance: netAmount,
            totalEarned: netAmount,
            totalCommissionPaid: currentRequest.commissionAmount,
          },
        })
      }

      // Create transaction record
      await db.transaction.create({
        data: {
          orderId: currentRequest.id,
          amount: netAmount,
          commission: currentRequest.commissionAmount,
          type: 'service_payment',
          status: 'completed',
        },
      })

      // Notify provider
      await db.notification.create({
        data: {
          userId: currentRequest.providerId,
          title: 'خدمة مكتملة',
          message: `تم إكمال الخدمة #${id.slice(-8)} - تم إضافة ${netAmount.toFixed(2)} د.ج إلى محفظتك`,
          type: 'payment',
        },
      })

      // Notify customer
      await db.notification.create({
        data: {
          userId: currentRequest.customerId,
          title: 'خدمة مكتملة',
          message: `تم إكمال الخدمة #${id.slice(-8)} بنجاح`,
          type: 'order',
        },
      })
    }

    // If confirmed, notify customer
    if (status === 'confirmed') {
      await db.notification.create({
        data: {
          userId: currentRequest.customerId,
          title: 'تم تأكيد الحجز',
          message: `تم تأكيد حجزك للخدمة #${id.slice(-8)} من قبل مقدم الخدمة`,
          type: 'order',
        },
      })
    }

    // If in_progress, notify customer
    if (status === 'in_progress') {
      await db.notification.create({
        data: {
          userId: currentRequest.customerId,
          title: 'بدء تنفيذ الخدمة',
          message: `بدأ مقدم الخدمة تنفيذ الخدمة #${id.slice(-8)}`,
          type: 'order',
        },
      })
    }

    // If cancelled, notify both
    if (status === 'cancelled') {
      await db.notification.create({
        data: {
          userId: currentRequest.providerId,
          title: 'حجز ملغي',
          message: `تم إلغاء الحجز #${id.slice(-8)}`,
          type: 'order',
        },
      })
      await db.notification.create({
        data: {
          userId: currentRequest.customerId,
          title: 'حجز ملغي',
          message: `تم إلغاء حجزك #${id.slice(-8)}`,
          type: 'order',
        },
      })
    }

    // Parse service images
    const enrichedRequest = {
      ...serviceRequest,
      service: {
        ...serviceRequest.service,
        images: (() => {
          try {
            return JSON.parse(serviceRequest.service.images)
          } catch {
            return []
          }
        })(),
      },
    }

    return NextResponse.json({
      data: enrichedRequest,
      message: 'تم تحديث حالة الحجز بنجاح',
    })
  } catch (error) {
    console.error('ServiceRequest PUT error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الحجز' },
      { status: 500 }
    )
  }
}
