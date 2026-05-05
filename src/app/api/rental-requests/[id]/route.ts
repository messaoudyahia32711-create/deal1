import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/rental-requests/[id] - Update rental request status
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

    const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'حالة الطلب غير صالحة' },
        { status: 400 }
      )
    }

    // Get current rental request
    const currentRequest = await db.rentalRequest.findUnique({
      where: { id },
    })

    if (!currentRequest) {
      return NextResponse.json(
        { error: 'طلب التأجير غير موجود' },
        { status: 404 }
      )
    }

    // Update rental request
    const rentalRequest = await db.rentalRequest.update({
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
          requestId: currentRequest.id,
          amount: netAmount,
          commission: currentRequest.commissionAmount,
          type: 'sale',
          status: 'completed',
        },
      })

      // Update rental completedRentals count
      await db.rental.update({
        where: { id: currentRequest.rentalId },
        data: {
          completedRentals: { increment: 1 },
        },
      })

      // Notify provider
      await db.notification.create({
        data: {
          userId: currentRequest.providerId,
          title: 'تأجير مكتمل',
          message: `تم إكمال التأجير #${id.slice(-8)} - تم إضافة ${netAmount.toFixed(2)} د.ج إلى محفظتك`,
          type: 'payment',
        },
      })

      // Notify customer
      await db.notification.create({
        data: {
          userId: currentRequest.customerId,
          title: 'تأجير مكتمل',
          message: `تم إكمال التأجير #${id.slice(-8)} بنجاح`,
          type: 'order',
        },
      })
    }

    // If confirmed, notify customer
    if (status === 'confirmed') {
      await db.notification.create({
        data: {
          userId: currentRequest.customerId,
          title: 'تم تأكيد طلب التأجير',
          message: `تم تأكيد طلب تأجيرك #${id.slice(-8)} من قبل مقدم الخدمة`,
          type: 'order',
        },
      })
    }

    // If active, notify customer
    if (status === 'active') {
      await db.notification.create({
        data: {
          userId: currentRequest.customerId,
          title: 'بدء التأجير',
          message: `بدأ تأجير المعدة #${id.slice(-8)}`,
          type: 'order',
        },
      })
    }

    // If cancelled, notify both
    if (status === 'cancelled') {
      await db.notification.create({
        data: {
          userId: currentRequest.providerId,
          title: 'طلب تأجير ملغي',
          message: `تم إلغاء طلب التأجير #${id.slice(-8)}`,
          type: 'order',
        },
      })
      await db.notification.create({
        data: {
          userId: currentRequest.customerId,
          title: 'طلب تأجير ملغي',
          message: `تم إلغاء طلب تأجيرك #${id.slice(-8)}`,
          type: 'order',
        },
      })
    }

    // Parse rental images
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

    return NextResponse.json({
      data: enrichedRequest,
      message: 'تم تحديث حالة طلب التأجير بنجاح',
    })
  } catch (error) {
    console.error('RentalRequest PUT error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث طلب التأجير' },
      { status: 500 }
    )
  }
}
