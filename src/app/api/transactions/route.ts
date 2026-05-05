import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/transactions - List transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}

    if (orderId) {
      where.orderId = orderId
    }

    if (type) {
      where.type = type
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              customer: {
                select: {
                  id: true,
                  username: true,
                },
              },
              merchant: {
                select: {
                  id: true,
                  username: true,
                  storeName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.transaction.count({ where }),
    ])

    // Calculate totals
    const totals = await db.transaction.aggregate({
      where,
      _sum: {
        amount: true,
        commission: true,
      },
    })

    return NextResponse.json({
      data: transactions,
      totals: {
        totalAmount: totals._sum.amount || 0,
        totalCommission: totals._sum.commission || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Transactions GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل المعاملات' },
      { status: 500 }
    )
  }
}
