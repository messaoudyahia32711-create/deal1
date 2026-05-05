import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/rentals - List rentals with filters
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
    const providerId = searchParams.get('providerId')

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
      where.dailyRate = {}
      if (minPrice) where.dailyRate.gte = parseFloat(minPrice)
      if (maxPrice) where.dailyRate.lte = parseFloat(maxPrice)
    }

    if (wilaya) {
      where.provider = { wilaya }
    }

    if (providerId) {
      where.providerId = providerId
    }

    // Build order by
    let orderBy: Record<string, string> = { createdAt: 'desc' }
    switch (sortBy) {
      case 'price_asc':
        orderBy = { dailyRate: 'asc' }
        break
      case 'price_desc':
        orderBy = { dailyRate: 'desc' }
        break
      case 'rating':
        orderBy = { createdAt: 'desc' } // Will sort by rating in JS
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const [rentals, total] = await Promise.all([
      db.rental.findMany({
        where,
        include: {
          provider: {
            select: {
              id: true,
              username: true,
              storeName: true,
              wilaya: true,
              isVerified: true,
              specialty: true,
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
      db.rental.count({ where }),
    ])

    // Get reviews for all rentals
    const rentalIds = rentals.map((r) => r.id)

    const reviews = await db.review.findMany({
      where: {
        targetId: { in: rentalIds },
        targetType: 'rental',
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

    // Enrich rentals with rating info and parsed JSON fields
    const enrichedRentals = rentals.map((rental) => {
      const ratingInfo = ratingMap.get(rental.id)
      const avgRating = ratingInfo ? ratingInfo.sum / ratingInfo.count : 0
      const reviewCount = ratingInfo?.count || 0

      let parsedImages: string[] = []
      let parsedCoverageWilayas: string[] = []
      let parsedAvailabilityDays: string[] = []

      try {
        parsedImages = JSON.parse(rental.images)
      } catch {
        parsedImages = []
      }
      try {
        parsedCoverageWilayas = JSON.parse(rental.coverageWilayas)
      } catch {
        parsedCoverageWilayas = []
      }
      try {
        parsedAvailabilityDays = JSON.parse(rental.availabilityDays)
      } catch {
        parsedAvailabilityDays = []
      }

      return {
        ...rental,
        images: parsedImages,
        coverageWilayas: parsedCoverageWilayas,
        availabilityDays: parsedAvailabilityDays,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount,
      }
    })

    // Sort by rating if needed
    if (sortBy === 'rating') {
      enrichedRentals.sort((a, b) => b.avgRating - a.avgRating)
    }

    return NextResponse.json({
      data: enrichedRentals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Rentals GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل المعدات' },
      { status: 500 }
    )
  }
}

// POST /api/rentals - Create rental
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      providerId,
      categoryId,
      title,
      description,
      dailyRate,
      weeklyRate,
      monthlyRate,
      deposit,
      minRentalDays,
      maxRentalDays,
      availabilityDays,
      images,
      coverageWilayas,
      deliveryAvailable,
      deliveryFee,
    } = body

    if (!providerId || !categoryId || !title || dailyRate === undefined) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      )
    }

    const rental = await db.rental.create({
      data: {
        providerId,
        categoryId,
        title,
        description: description || null,
        dailyRate: parseFloat(dailyRate),
        weeklyRate: weeklyRate ? parseFloat(weeklyRate) : null,
        monthlyRate: monthlyRate ? parseFloat(monthlyRate) : null,
        deposit: deposit ? parseFloat(deposit) : 0,
        minRentalDays: minRentalDays || 1,
        maxRentalDays: maxRentalDays || null,
        availabilityDays: JSON.stringify(availabilityDays || []),
        images: JSON.stringify(images || []),
        coverageWilayas: JSON.stringify(coverageWilayas || []),
        deliveryAvailable: deliveryAvailable || false,
        deliveryFee: deliveryFee ? parseFloat(deliveryFee) : null,
      },
      include: {
        provider: {
          select: {
            id: true,
            username: true,
            storeName: true,
            wilaya: true,
            isVerified: true,
            specialty: true,
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

    // Parse JSON fields for response
    let parsedImages: string[] = []
    let parsedCoverageWilayas: string[] = []
    let parsedAvailabilityDays: string[] = []

    try {
      parsedImages = JSON.parse(rental.images)
    } catch {
      parsedImages = []
    }
    try {
      parsedCoverageWilayas = JSON.parse(rental.coverageWilayas)
    } catch {
      parsedCoverageWilayas = []
    }
    try {
      parsedAvailabilityDays = JSON.parse(rental.availabilityDays)
    } catch {
      parsedAvailabilityDays = []
    }

    return NextResponse.json(
      {
        data: {
          ...rental,
          images: parsedImages,
          coverageWilayas: parsedCoverageWilayas,
          availabilityDays: parsedAvailabilityDays,
        },
        message: 'تم إنشاء المعدة بنجاح',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Rentals POST error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المعدة' },
      { status: 500 }
    )
  }
}
