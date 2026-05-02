import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/wallet - Get wallet by merchantId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json(
        { error: 'معرف التاجر مطلوب' },
        { status: 400 }
      )
    }

    const wallet = await db.merchantWallet.findUnique({
      where: { merchantId },
      include: {
        merchant: {
          select: {
            id: true,
            username: true,
            storeName: true,
            email: true,
          },
        },
      },
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'المحفظة غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: wallet,
    })
  } catch (error) {
    console.error('Wallet GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل المحفظة' },
      { status: 500 }
    )
  }
}
