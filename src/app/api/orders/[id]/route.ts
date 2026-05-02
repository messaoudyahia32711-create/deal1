import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/orders/[id] - Update order status
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

    const validStatuses = ['new', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'حالة الطلب غير صالحة' },
        { status: 400 }
      )
    }

    // Get current order
    const currentOrder = await db.order.findUnique({
      where: { id },
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      )
    }

    // Update order
    const order = await db.order.update({
      where: { id },
      data: { status },
      include: {
        customer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        merchant: {
          select: {
            id: true,
            username: true,
            storeName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                images: true,
              },
            },
          },
        },
      },
    })

    // If delivered, update merchant wallet
    if (status === 'delivered') {
      const netAmount = currentOrder.totalAmount - currentOrder.commissionAmount

      // Upsert wallet
      const existingWallet = await db.merchantWallet.findUnique({
        where: { merchantId: currentOrder.merchantId },
      })

      if (existingWallet) {
        await db.merchantWallet.update({
          where: { merchantId: currentOrder.merchantId },
          data: {
            balance: { increment: netAmount },
            totalEarned: { increment: netAmount },
            totalCommissionPaid: { increment: currentOrder.commissionAmount },
          },
        })
      } else {
        await db.merchantWallet.create({
          data: {
            merchantId: currentOrder.merchantId,
            balance: netAmount,
            totalEarned: netAmount,
            totalCommissionPaid: currentOrder.commissionAmount,
          },
        })
      }

      // Create transaction record
      await db.transaction.create({
        data: {
          orderId: currentOrder.id,
          amount: netAmount,
          commission: currentOrder.commissionAmount,
          type: 'sale',
          status: 'completed',
        },
      })

      // Notify merchant
      await db.notification.create({
        data: {
          userId: currentOrder.merchantId,
          title: 'تم التوصيل',
          message: `تم تأكيد توصيل الطلب #${id.slice(-8)} - تم إضافة ${netAmount.toFixed(2)} د.ج إلى محفظتك`,
          type: 'payment',
        },
      })

      // Notify customer
      await db.notification.create({
        data: {
          userId: currentOrder.customerId,
          title: 'تم التوصيل',
          message: `تم تأكيد توصيل طلبك #${id.slice(-8)}`,
          type: 'order',
        },
      })
    }

    // If cancelled, notify relevant parties
    if (status === 'cancelled') {
      await db.notification.create({
        data: {
          userId: currentOrder.merchantId,
          title: 'طلب ملغي',
          message: `تم إلغاء الطلب #${id.slice(-8)}`,
          type: 'order',
        },
      })
      await db.notification.create({
        data: {
          userId: currentOrder.customerId,
          title: 'طلب ملغي',
          message: `تم إلغاء طلبك #${id.slice(-8)}`,
          type: 'order',
        },
      })
    }

    // Parse product images
    const enrichedOrder = {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          images: (() => {
            try {
              return JSON.parse(item.product.images)
            } catch {
              return []
            }
          })(),
        },
      })),
    }

    return NextResponse.json({
      data: enrichedOrder,
      message: 'تم تحديث حالة الطلب بنجاح',
    })
  } catch (error) {
    console.error('Order PUT error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الطلب' },
      { status: 500 }
    )
  }
}
