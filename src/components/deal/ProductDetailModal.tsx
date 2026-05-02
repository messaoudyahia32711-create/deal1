'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type Product, type Review } from '@/lib/store'
import { t, formatPrice } from '@/lib/i18n'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Star,
  ShoppingCart,
  Zap,
  Share2,
  MapPin,
  Package,
  Award,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react'

export default function ProductDetailModal() {
  const { selectedProduct, setSelectedProduct, language, addToCart, user, setCurrentView } = useAppStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewSummary, setReviewSummary] = useState({ avgRating: 0, totalReviews: 0 })
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [currentImageIdx, setCurrentImageIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [sharing, setSharing] = useState(false)

  const product: Product | null = selectedProduct

  const loadReviews = useCallback(async () => {
    if (!product) return
    try {
      const res = await fetch(`/api/reviews?targetId=${product.id}&targetType=product&limit=20`)
      const data = await res.json()
      if (data.data) {
        setReviews(
          data.data.map((r: any) => ({
            id: r.id,
            reviewerId: r.reviewerId,
            targetId: r.targetId,
            targetType: r.targetType,
            rating: r.rating,
            comment: r.comment || undefined,
            images: r.images || [],
            createdAt: r.createdAt,
            reviewerName: r.reviewer?.username || '',
            reviewerAvatar: r.reviewer?.avatar || undefined,
          }))
        )
      }
      if (data.summary) {
        setReviewSummary(data.summary)
      }
    } catch (e) {
      console.error(e)
    }
  }, [product])

  useEffect(() => {
    if (product) {
      loadReviews()
      setCurrentImageIdx(0)
      setNewRating(0)
      setNewComment('')
    }
  }, [product, loadReviews])

  function handleClose() {
    setSelectedProduct(null)
  }

  async function handleSubmitReview() {
    if (!user || !product || newRating === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId: user.id,
          targetId: product.id,
          targetType: 'product',
          rating: newRating,
          comment: newComment,
        }),
      })
      if (res.ok) {
        setNewRating(0)
        setNewComment('')
        loadReviews()
      }
    } catch (e) {
      console.error(e)
    }
    setSubmitting(false)
  }

  function handleAddToCart() {
    if (!product) return
    addToCart(product)
  }

  function handleBuyNow() {
    if (!product) return
    addToCart(product)
    if (user) {
      setCurrentView('customer-dashboard')
    } else {
      setCurrentView('auth')
    }
    handleClose()
  }

  async function handleShare() {
    if (!product) return
    setSharing(true)
    try {
      const shareText = `${product.title} - ${formatPrice(product.isOnSale && product.salePrice ? product.salePrice : product.price, language)} | DEAL`
      if (navigator.share) {
        await navigator.share({ title: product.title, text: shareText })
      } else {
        await navigator.clipboard.writeText(shareText)
      }
    } catch (e) {
      // User cancelled share or clipboard failed
    }
    setSharing(false)
  }

  function renderStars(rating: number, size: string = 'w-4 h-4') {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  function getStockStatus(stock: number) {
    if (stock > 10) return { label: language === 'ar' ? 'متوفر' : 'En stock', color: 'text-green-600', icon: <CheckCircle className="w-4 h-4" /> }
    if (stock > 0) return { label: language === 'ar' ? 'متبقي القليل' : 'Stock limité', color: 'text-orange-500', icon: <AlertTriangle className="w-4 h-4" /> }
    return { label: language === 'ar' ? 'نفذ المخزون' : 'Rupture de stock', color: 'text-red-500', icon: <XCircle className="w-4 h-4" /> }
  }

  if (!product) return null

  const images = product.images && product.images.length > 0 ? product.images : []
  const stockStatus = getStockStatus(product.stock)
  const displayRating = reviewSummary.avgRating || product.rating || 0
  const displayReviewCount = reviewSummary.totalReviews || product.reviewCount || 0

  return (
    <Dialog open={!!product} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0" showCloseButton={false}>
        <DialogTitle className="sr-only">{product.title}</DialogTitle>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 left-3 z-50 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition"
        >
          <XIcon className="w-4 h-4" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 relative">
            {images.length > 0 ? (
              <>
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={images[currentImageIdx]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Image Navigation */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIdx((prev) => (prev + 1) % images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      {/* Dots */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImageIdx(i)}
                            className={`w-2 h-2 rounded-full transition ${i === currentImageIdx ? 'bg-white w-4' : 'bg-white/50'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-2 overflow-x-auto">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIdx(i)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${i === currentImageIdx ? 'border-yellow-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square flex items-center justify-center">
                <div className="text-center">
                  <Package className="w-20 h-20 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">{language === 'ar' ? 'لا توجد صورة' : 'Aucune image'}</p>
                </div>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5">
              {product.isNew && (
                <Badge className="bg-red-500 text-white text-xs">{t('newBadge', language)}</Badge>
              )}
              {product.isOnSale && product.salePrice && (
                <Badge className="bg-orange-500 text-white text-xs">{t('onSale', language)}</Badge>
              )}
              {product.isFeatured && (
                <Badge className="bg-yellow-500 text-white text-xs">{t('featured', language)}</Badge>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 p-5 flex flex-col">
            {/* Category Badge */}
            {product.categoryName && (
              <Badge variant="outline" className="w-fit text-xs mb-2 border-purple-300 text-purple-700 bg-purple-50">
                {product.categoryName}
              </Badge>
            )}

            {/* Title */}
            <h2 className="text-xl font-black mb-2 leading-tight">{product.title}</h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-0.5">{renderStars(displayRating)}</div>
              <span className="text-sm font-bold text-gray-600">{displayRating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({displayReviewCount} {t('reviews', language)})</span>
            </div>

            {/* Price */}
            <div className="mb-3">
              {product.isOnSale && product.salePrice ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-yellow-700">{formatPrice(product.salePrice, language)}</span>
                  <span className="text-sm text-gray-400 line-through">{formatPrice(product.price, language)}</span>
                  <Badge className="bg-red-100 text-red-600 text-xs">
                    -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                  </Badge>
                </div>
              ) : (
                <span className="text-2xl font-black text-yellow-700">{formatPrice(product.price, language)}</span>
              )}
            </div>

            {/* Stock Status */}
            <div className={`flex items-center gap-1.5 mb-3 text-sm font-bold ${stockStatus.color}`}>
              {stockStatus.icon}
              <span>{stockStatus.label}</span>
              {product.stock > 0 && product.stock <= 10 && (
                <span className="text-gray-400 font-normal">({product.stock})</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{product.description}</p>
            )}

            {/* Merchant Info */}
            {product.merchant && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600">
                    <AvatarFallback className="bg-transparent text-white font-bold text-sm">
                      {product.merchant.storeName?.[0] || product.merchant.username?.[0] || 'م'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm truncate">{product.merchant.storeName || product.merchant.username}</span>
                      {product.merchant.isVerified && (
                        <Award className="w-4 h-4 text-blue-500 fill-blue-500" />
                      )}
                    </div>
                    {product.merchant.wilaya && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        <span>{product.merchant.wilaya}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                className="btn-3d btn-3d-primary flex-1"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="w-5 h-5" />
                {t('addToCart', language)}
              </button>
              <button
                className="btn-3d btn-3d-secondary flex-1"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                <Zap className="w-5 h-5" />
                {t('buyNow', language)}
              </button>
            </div>

            {/* Share & Location */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition"
                disabled={sharing}
              >
                <Share2 className="w-4 h-4" />
                {t('share', language)}
              </button>
              {product.merchant?.wilaya && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {t('location', language)}: {product.merchant.wilaya}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t my-2" />

            {/* Reviews Section */}
            <div className="flex-1 overflow-y-auto max-h-72 pr-1" style={{ scrollbarWidth: 'thin' }}>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                {t('reviews', language)} ({displayReviewCount})
              </h3>

              {reviews.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{t('noReviews', language)}</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-xs font-bold bg-purple-100 text-purple-700">
                            {review.reviewerName?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-xs">{review.reviewerName}</span>
                        <div className="flex items-center gap-0.5 mr-auto">
                          {renderStars(review.rating, 'w-3 h-3')}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-gray-600 leading-relaxed mt-1">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Review Form */}
            {user && (
              <div className="border-t pt-3 mt-3">
                <h4 className="font-bold text-xs mb-2">{t('addReview', language)}</h4>
                {/* Star Selector */}
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      className="review-star"
                      onClick={() => setNewRating(i + 1)}
                      onMouseEnter={() => setHoverRating(i + 1)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        className={`w-6 h-6 transition ${
                          i < (hoverRating || newRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  {newRating > 0 && (
                    <span className="text-xs text-gray-500 mr-1">{newRating}/5</span>
                  )}
                </div>
                {/* Comment */}
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('comment', language) + '...'}
                  className="text-sm min-h-[60px] mb-2 resize-none"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                <button
                  className="btn-3d btn-3d-primary text-sm py-2 w-full"
                  onClick={handleSubmitReview}
                  disabled={newRating === 0 || submitting}
                >
                  <Send className="w-4 h-4" />
                  {t('submitReview', language)}
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Need XIcon import
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
