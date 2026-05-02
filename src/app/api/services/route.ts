import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/services - List services with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')
    const wilaya = searchParams.get('wilaya')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const skip = (page - 1) * limit

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

    if (wilaya) {
      where.provider = { wilaya }
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' }
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { createdAt: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const [services, total] = await Promise.all([
      db.service.findMany({
        where,
        include: {
          provider: {
            select: {
              id: true,
              username: true,
              specialty: true,
              wilaya: true,
              avatar: true,
              experience: true,
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
      db.service.count({ where }),
    ])

    // Get reviews for all services
    const serviceIds = services.map((s) => s.id)

    const reviews = await db.review.findMany({
      where: {
        targetId: { in: serviceIds },
        targetType: 'service',
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

    // Enrich services with rating info and parsed JSON fields
    const enrichedServices = services.map((service) => {
      const ratingInfo = ratingMap.get(service.id)
      const avgRating = ratingInfo ? ratingInfo.sum / ratingInfo.count : 0
      const reviewCount = ratingInfo?.count || 0

      let parsedImages: string[] = []
      let parsedCoverageWilayas: string[] = []
      let parsedAvailabilityDays: string[] = []

      try {
        parsedImages = JSON.parse(service.images)
      } catch {
        parsedImages = []
      }
      try {
        parsedCoverageWilayas = JSON.parse(service.coverageWilayas)
      } catch {
        parsedCoverageWilayas = []
      }
      try {
        parsedAvailabilityDays = JSON.parse(service.availabilityDays)
      } catch {
        parsedAvailabilityDays = []
      }

      return {
        ...service,
        images: parsedImages,
        coverageWilayas: parsedCoverageWilayas,
        availabilityDays: parsedAvailabilityDays,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount,
      }
    })

    // Sort by rating if needed
    if (sortBy === 'rating') {
      enrichedServices.sort((a, b) => b.avgRating - a.avgRating)
    }

    return NextResponse.json({
      data: enrichedServices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Services GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل الخدمات' },
      { status: 500 }
    )
  }
}

// POST /api/services - Create service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      providerId,
      categoryId,
      title,
      description,
      priceType,
      price,
      availabilityDays,
      images,
      coverageWilayas,
      serviceLocation,
    } = body

    if (!providerId || !categoryId || !title) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      )
    }

    const service = await db.service.create({
      data: {
        providerId,
        categoryId,
        title,
        description: description || null,
        priceType: priceType || 'fixed',
        price: price ? parseFloat(price) : null,
        availabilityDays: JSON.stringify(availabilityDays || []),
        images: JSON.stringify(images || []),
        coverageWilayas: JSON.stringify(coverageWilayas || []),
      },
      include: {
        provider: {
          select: {
            id: true,
            username: true,
            specialty: true,
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
    })

    return NextResponse.json(
      {
        data: service,
        message: 'تم إنشاء الخدمة بنجاح',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Services POST error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الخدمة' },
      { status: 500 }
    )
  }
}
