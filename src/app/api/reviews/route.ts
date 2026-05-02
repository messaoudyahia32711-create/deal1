import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/reviews - Get reviews for a target
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('targetId')
    const targetType = searchParams.get('targetType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}

    if (targetId) {
      where.targetId = targetId
    }

    if (targetType) {
      where.targetType = targetType
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.review.count({ where }),
    ])

    // Enrich reviews with parsed images and calculate summary
    const enrichedReviews = reviews.map((review) => {
      let parsedImages: string[] = []
      try {
        parsedImages = JSON.parse(review.images)
      } catch {
        parsedImages = []
      }

      const { images: _images, ...reviewWithoutImages } = review

      return {
        ...reviewWithoutImages,
        images: parsedImages,
      }
    })

    // Calculate average rating if filtering by target
    let avgRating = 0
    if (targetId) {
      const allReviews = await db.review.findMany({
        where: { targetId, targetType },
        select: { rating: true },
      })
      if (allReviews.length > 0) {
        avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      }
    }

    return NextResponse.json({
      data: enrichedReviews,
      summary: targetId
        ? {
            avgRating: Math.round(avgRating * 10) / 10,
            totalReviews: total,
          }
        : undefined,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Reviews GET error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحميل التقييمات' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviewerId, targetId, targetType, rating, comment, images } = body

    if (!reviewerId || !targetId || !targetType || rating === undefined) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'التقييم يجب أن يكون بين 1 و 5' },
        { status: 400 }
      )
    }

    const validTargetTypes = ['product', 'service', 'merchant', 'provider']
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: 'نوع الهدف غير صالح' },
        { status: 400 }
      )
    }

    // Check if user already reviewed this target
    const existingReview = await db.review.findFirst({
      where: {
        reviewerId,
        targetId,
        targetType,
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'لقد قمت بتقييم هذا العنصر من قبل' },
        { status: 409 }
      )
    }

    const review = await db.review.create({
      data: {
        reviewerId,
        targetId,
        targetType,
        rating: parseInt(rating),
        comment: comment || null,
        images: JSON.stringify(images || []),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        data: review,
        message: 'تم إضافة التقييم بنجاح',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Reviews POST error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة التقييم' },
      { status: 500 }
    )
  }
}
