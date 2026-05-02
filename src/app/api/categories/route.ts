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

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nameAr, nameFr, icon, type, parentId } = body

    // Validate required fields
    if (!nameAr || !type) {
      return NextResponse.json(
        { error: 'اسم الفئة بالعربية والنوع مطلوبان' },
        { status: 400 }
      )
    }

    // Validate type value
    if (type !== 'product' && type !== 'service') {
      return NextResponse.json(
        { error: 'النوع يجب أن يكون "منتج" أو "خدمة"' },
        { status: 400 }
      )
    }

    // Validate parentId exists if provided
    if (parentId) {
      const parentCategory = await db.category.findUnique({
        where: { id: parentId },
      })
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'الفئة الأم غير موجودة' },
          { status: 400 }
        )
      }
    }

    const category = await db.category.create({
      data: {
        nameAr,
        nameFr: nameFr || null,
        icon: icon || null,
        type,
        parentId: parentId || null,
      },
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
    })

    return NextResponse.json(
      {
        data: category,
        message: 'تم إنشاء الفئة بنجاح',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الفئة' },
      { status: 500 }
    )
  }
}
