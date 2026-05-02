import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/products - List products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const wilaya = searchParams.get('wilaya')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: 'active',
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (wilaya) {
      where.merchant = { wilaya }
    }

    // Build order by
    let orderBy: Record<string, string> = { createdAt: 'desc' }
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { createdAt: 'desc' } // Will sort by rating in JS
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              username: true,
              storeName: true,
              wilaya: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              nameAr: true,
              nameFr: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    // Get reviews for all products and calculate ratings
    const productIds = products.map((p) => p.id)

    const reviews = await db.review.findMany({
      where: {
        targetId: { in: productIds },
        targetType: 'product',
      },
      select: {
        targetId: true,
        rating: true,
      },
    })

    // Build rating map
    const ratingMap = new Map<string, { sum: number; count: number }>()
    for (const review of reviews) {
      const existing = ratingMap.get(review.targetId) || { sum: 0, count: 0 }
      existing.sum += review.rating
      existing.count += 1
      ratingMap.set(review.targetId, existing)
    }

    // Enrich products with rating info and parsed images
    const enrichedProducts = products.map((product) => {
      const ratingInfo = ratingMap.get(product.id)
      const avgRating = ratingInfo ? ratingInfo.sum / ratingInfo.count : 0
      const reviewCount = ratingInfo?.count || 0

      let parsedImages: string[] = []
      try {
        parsedImages = JSON.parse(product.images)
      } catch {
        parsedImages = []
      }

      const { images: _images, ...productWithoutImages } = product

      return {
        ...productWithoutImages,
        images: parsedImages,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount,
      }
    })

    // Sort by rating if needed
    if (sortBy === 'rating') {
      enrichedProducts.sort((a, b) => b.avgRating - a.avgRating)
    }

    return NextResponse.json({
      data: enrichedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل المنتجات' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, categoryId, title, description, price, stock, images, isOnSale, salePrice } = body

    if (!merchantId || !categoryId || !title || price === undefined) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        merchantId,
        categoryId,
        title,
        description: description || null,
        price: parseFloat(price),
        stock: stock || 0,
        images: JSON.stringify(images || []),
        isOnSale: isOnSale || false,
        salePrice: salePrice ? parseFloat(salePrice) : null,
      },
      include: {
        merchant: {
          select: {
            id: true,
            username: true,
            storeName: true,
          },
        },
        category: {
          select: {
            id: true,
            nameAr: true,
            nameFr: true,
          },
        },
      },
    })

    // Parse images for response
    let parsedImages: string[] = []
    try {
      parsedImages = JSON.parse(product.images)
    } catch {
      parsedImages = []
    }

    return NextResponse.json(
      {
        data: { ...product, images: parsedImages },
        message: 'تم إنشاء المنتج بنجاح',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المنتج' },
      { status: 500 }
    )
  }
}
