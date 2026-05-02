import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (userId && role === 'customer') {
      where.customerId = userId
    } else if (userId && role === 'merchant') {
      where.merchantId = userId
    } else if (userId) {
      where.OR = [{ customerId: userId }, { merchantId: userId }]
    }

    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
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
          merchant: {
            select: {
              id: true,
              username: true,
              storeName: true,
              phone: true,
              wilaya: true,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.order.count({ where }),
    ])

    // Parse product images in order items
    const enrichedOrders = orders.map((order) => ({
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
    }))

    return NextResponse.json({
      data: enrichedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل الطلبات' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, merchantId, items, paymentMethod, deliveryAddress } = body

    if (!customerId || !merchantId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      )
    }

    // Verify products exist and get prices
    const productIds = items.map((item: { productId: string }) => item.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    // Calculate total and validate
    let totalAmount = 0
    const orderItemsData = []

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `المنتج ${item.productId} غير موجود` },
          { status: 404 }
        )
      }

      const unitPrice = product.isOnSale && product.salePrice
        ? product.salePrice
        : product.price

      totalAmount += unitPrice * item.quantity

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
      })
    }

    const commissionAmount = totalAmount * 0.015

    // Create order with items in a transaction
    const order = await db.order.create({
      data: {
        customerId,
        merchantId,
        totalAmount,
        commissionAmount,
        status: 'new',
        paymentMethod: paymentMethod || 'cod',
        deliveryAddress: deliveryAddress || null,
        items: {
          create: orderItemsData,
        },
      },
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

    // Create notification for merchant
    await db.notification.create({
      data: {
        userId: merchantId,
        title: 'طلب جديد',
        message: `لقد استلمت طلباً جديداً بقيمة ${totalAmount.toFixed(2)} د.ج`,
        type: 'order',
      },
    })

    // Parse product images in response
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

    return NextResponse.json(
      {
        data: enrichedOrder,
        message: 'تم إنشاء الطلب بنجاح',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Orders POST error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الطلب' },
      { status: 500 }
    )
  }
}
