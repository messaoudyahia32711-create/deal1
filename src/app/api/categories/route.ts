import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/categories - List categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // product or service

    const where: Record<string, unknown> = {}

    if (type) {
      where.type = type
    }

    const categories = await db.category.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            nameAr: true,
            nameFr: true,
          },
        },
        children: {
          select: {
            id: true,
            nameAr: true,
            nameFr: true,
            icon: true,
          },
        },
        _count: {
          select: {
            products: true,
            services: true,
          },
        },
      },
      orderBy: { nameAr: 'asc' },
    })

    return NextResponse.json({
      data: categories,
    })
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل الفئات' },
      { status: 500 }
    )
  }
}
