import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/stats - Platform statistics
export async function GET() {
  try {
    const [
      totalUsers,
      totalMerchants,
      totalServiceProviders,
      totalCustomers,
      totalProducts,
      activeProducts,
      totalServices,
      activeServices,
      totalOrders,
      recentOrders,
      totalCommissions,
      totalRevenue,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'merchant' } }),
      db.user.count({ where: { role: 'service_provider' } }),
      db.user.count({ where: { role: 'customer' } }),
      db.product.count(),
      db.product.count({ where: { status: 'active' } }),
      db.service.count(),
      db.service.count({ where: { status: 'active' } }),
      db.order.count(),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { username: true, avatar: true },
          },
          merchant: {
            select: { username: true, storeName: true },
          },
          items: {
            select: {
              productId: true,
              quantity: true,
              unitPrice: true,
              product: {
                select: { title: true },
              },
            },
          },
        },
      }),
      // Total commissions from all orders
      db.order.aggregate({
        _sum: {
          commissionAmount: true,
        },
      }),
      // Total revenue from all orders
      db.order.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
    ])

    // Order status breakdown
    const orderStatusBreakdown = await db.order.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    })

    const ordersByStatus = orderStatusBreakdown.reduce(
      (acc: Record<string, number>, item: { status: string; _count: { status: number } }) => {
        acc[item.status] = item._count.status
        return acc
      },
      {} as Record<string, number>
    )

    // Recent registrations
    const recentUsers = await db.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      data: {
        users: {
          total: totalUsers,
          merchants: totalMerchants,
          serviceProviders: totalServiceProviders,
          customers: totalCustomers,
          recent: recentUsers,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
        },
        services: {
          total: totalServices,
          active: activeServices,
        },
        orders: {
          total: totalOrders,
          byStatus: ordersByStatus,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          totalCommissions: totalCommissions._sum.commissionAmount || 0,
          recent: recentOrders,
        },
      },
    })
  } catch (error) {
    console.error('Stats GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل الإحصائيات' },
      { status: 500 }
    )
  }
}
