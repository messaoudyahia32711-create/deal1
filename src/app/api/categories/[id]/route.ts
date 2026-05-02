import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/categories/[id] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nameAr, nameFr, icon, type, parentId } = body

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'الفئة غير موجودة' },
        { status: 404 }
      )
    }

    // Validate type if provided
    if (type && type !== 'product' && type !== 'service') {
      return NextResponse.json(
        { error: 'النوع يجب أن يكون "منتج" أو "خدمة"' },
        { status: 400 }
      )
    }

    // Validate parentId exists if provided
    if (parentId) {
      // Prevent setting self as parent
      if (parentId === id) {
        return NextResponse.json(
          { error: 'لا يمكن أن تكون الفئة أماً لنفسها' },
          { status: 400 }
        )
      }

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

    // Build update data - only include fields that were provided
    const updateData: Record<string, unknown> = {}
    if (nameAr !== undefined) updateData.nameAr = nameAr
    if (nameFr !== undefined) updateData.nameFr = nameFr || null
    if (icon !== undefined) updateData.icon = icon || null
    if (type !== undefined) updateData.type = type
    if (parentId !== undefined) updateData.parentId = parentId || null

    const category = await db.category.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      data: category,
      message: 'تم تحديث الفئة بنجاح',
    })
  } catch (error) {
    console.error('Categories PUT error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الفئة' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            services: true,
            children: true,
          },
        },
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'الفئة غير موجودة' },
        { status: 404 }
      )
    }

    // Check if category has products
    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الفئة لأنها تحتوي على منتجات. يرجى نقل أو حذف المنتجات أولاً' },
        { status: 400 }
      )
    }

    // Check if category has services
    if (existingCategory._count.services > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الفئة لأنها تحتوي على خدمات. يرجى نقل أو حذف الخدمات أولاً' },
        { status: 400 }
      )
    }

    // Check if category has child categories
    if (existingCategory._count.children > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الفئة لأنها تحتوي على فئات فرعية. يرجى نقل أو حذف الفئات الفرعية أولاً' },
        { status: 400 }
      )
    }

    await db.category.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'تم حذف الفئة بنجاح',
    })
  } catch (error) {
    console.error('Categories DELETE error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الفئة' },
      { status: 500 }
    )
  }
}
