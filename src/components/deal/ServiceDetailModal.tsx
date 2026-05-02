'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type Service, type Review } from '@/lib/store'
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
  Star, Calendar, MapPin, Award, Briefcase, Clock, Send, MessageCircle,
  ChevronLeft, ChevronRight, Wrench,
} from 'lucide-react'

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  )
}

function getServiceEmoji(categoryName?: string): string {
  if (!categoryName) return '🛠️'
  const map: Record<string, string> = {
    'سباكة': '🔧', 'كهرباء': '⚡', 'تكييف': '❄️', 'نجارة': '🪚', 'دهان': '🎨', 'نقل': '🚚', 'تنظيف': '🧹',
    'Plomberie': '🔧', 'Électricité': '⚡', 'Climatisation': '❄️', 'Menuiserie': '🪚', 'Peinture': '🎨', 'Transport': '🚚', 'Nettoyage': '🧹',
  }
  return map[categoryName] || '🛠️'
}

function getPriceTypeLabel(priceType: string, language: 'ar' | 'fr'): string {
  switch (priceType) {
    case 'fixed': return t('fixed', language)
    case 'hourly': return t('hourly', language)
    case 'negotiable': return t('negotiable', language)
    default: return priceType
  }
}

export default function ServiceDetailModal() {
  const { selectedService, setSelectedService, language, user, setCurrentView, setContactOwner } = useAppStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewSummary, setReviewSummary] = useState({ avgRating: 0, totalReviews: 0, distribution: [0, 0, 0, 0, 0] })
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [currentImageIdx, setCurrentImageIdx] = useState(0)

  const service: Service | null = selectedService

  const loadReviews = useCallback(async () => {
    if (!service) return
    try {
      const res = await fetch(`/api/reviews?targetId=${service.id}&targetType=service&limit=20`)
      const data = await res.json()
      if (data.data) {
        setReviews(
          data.data.map((r: any) => ({
            id: r.id, reviewerId: r.reviewerId, targetId: r.targetId, targetType: r.targetType,
            rating: r.rating, comment: r.comment || undefined, images: r.images || [],
            createdAt: r.createdAt, reviewerName: r.reviewer?.username || '', reviewerAvatar: r.reviewer?.avatar || undefined,
          }))
        )
        const allRatings = data.data.map((r: any) => r.rating)
        const totalReviews = allRatings.length
        const avgRating = totalReviews > 0 ? allRatings.reduce((a: number, b: number) => a + b, 0) / totalReviews : 0
        const distribution = [0, 0, 0, 0, 0]
        allRatings.forEach((r: number) => { if (r >= 1 && r <= 5) distribution[r - 1]++ })
        setReviewSummary({ avgRating, totalReviews, distribution })
      }
      if (data.summary) {
        setReviewSummary(prev => ({ ...prev, avgRating: data.summary.avgRating || prev.avgRating, totalReviews: data.summary.totalReviews || prev.totalReviews }))
      }
    } catch (e) { console.error(e) }
  }, [service])

  useEffect(() => {
    if (service) { loadReviews(); setNewRating(0); setNewComment(''); setCurrentImageIdx(0) }
  }, [service, loadReviews])

  function handleClose() { setSelectedService(null) }

  async function handleSubmitReview() {
    if (!user || !service || newRating === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: user.id, targetId: service.id, targetType: 'service', rating: newRating, comment: newComment }),
      })
      if (res.ok) { setNewRating(0); setNewComment(''); loadReviews() }
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }

  function handleBookNow() {
    if (!user) { setCurrentView('auth'); handleClose() }
  }

  function handleContactProvider() {
    if (!service?.provider) return
    if (!user) { setCurrentView('auth'); handleClose(); return }
    const dashboardView = user.role === 'merchant' ? 'merchant-dashboard'
      : user.role === 'service_provider' ? 'provider-dashboard'
      : user.role === 'admin' ? 'admin-dashboard'
      : 'customer-dashboard'
    setContactOwner(service.providerId, service.provider?.username || '')
    setCurrentView(dashboardView)
    handleClose()
    const store = useAppStore.getState()
    if (user.role === 'merchant') store.setMerchantTab('chat')
    else if (user.role === 'service_provider') store.setProviderTab('chat')
    else if (user.role === 'customer') store.setCustomerTab('chat')
    else if (user.role === 'admin') store.setAdminTab('chat')
  }

  function renderStars(rating: number, size: string = 'w-4 h-4') {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`${size} ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ))
  }

  if (!service) return null

  const displayRating = reviewSummary.avgRating || service.rating || 0
  const displayReviewCount = reviewSummary.totalReviews || service.reviewCount || 0
  const emoji = getServiceEmoji(service.categoryName)
  const images = service.images && service.images.length > 0 ? service.images : []

  return (
    <Dialog open={!!service} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0" showCloseButton={false}>
        <DialogTitle className="sr-only">{service.title}</DialogTitle>

        {/* Close Button */}
        <button onClick={handleClose} className="absolute top-3 left-3 z-50 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition">
          <XIcon className="w-4 h-4" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 relative">
            {images.length > 0 ? (
              <>
                <div className="aspect-square relative overflow-hidden">
                  <img src={images[currentImageIdx]} alt={service.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImageIdx((prev) => (prev + 1) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg z-10">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={() => setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg z-10">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {images.map((_, i) => (
                          <button key={i} onClick={() => setCurrentImageIdx(i)} className={`w-2.5 h-2.5 rounded-full transition ${i === currentImageIdx ? 'bg-white w-5' : 'bg-white/50'}`} />
                        ))}
                      </div>
                    </>
                  )}
                  {/* Image counter */}
                  <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg z-10">
                    {currentImageIdx + 1} / {images.length}
                  </div>
                  {/* Content overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
                    {service.categoryName && (
                      <Badge className="bg-white/20 text-white text-xs mb-2 border-0 backdrop-blur-sm">{service.categoryName}</Badge>
                    )}
                    <h2 className="text-xl font-black leading-tight mb-1">{service.title}</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">{renderStars(displayRating, 'w-4 h-4')}</div>
                      <span className="text-sm font-bold">{displayRating.toFixed(1)}</span>
                      <span className="text-xs opacity-70">({displayReviewCount} {t('reviews', language)})</span>
                    </div>
                  </div>
                </div>
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setCurrentImageIdx(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${i === currentImageIdx ? 'border-purple-500 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                <div className="text-center">
                  <div className="w-28 h-28 mx-auto rounded-3xl bg-white/30 backdrop-blur-sm flex items-center justify-center text-6xl shadow-xl mb-4">
                    {emoji}
                  </div>
                  <p className="text-purple-400 text-sm font-bold">{service.categoryName || (language === 'ar' ? 'خدمة' : 'Service')}</p>
                  <p className="text-purple-300 text-xs mt-1">{language === 'ar' ? 'يمكن لمزود الخدمة إضافة صور لاحقاً' : 'Le prestataire peut ajouter des photos plus tard'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 p-6 flex flex-col">
            {/* Category + Title (when no image) */}
            {images.length === 0 && (
              <>
                {service.categoryName && (
                  <Badge variant="outline" className="w-fit text-xs mb-2 border-purple-300 text-purple-700 bg-purple-50">{service.categoryName}</Badge>
                )}
                <h2 className="text-2xl font-black mb-3 leading-tight">{service.title}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">{renderStars(displayRating, 'w-5 h-5')}</div>
                  <span className="text-base font-bold text-gray-600">{displayRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({displayReviewCount} {t('reviews', language)})</span>
                </div>
              </>
            )}

            {/* Description */}
            {service.description && (
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{service.description}</p>
            )}

            {/* Price Section */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-bold block mb-0.5">
                    {getPriceTypeLabel(service.priceType, language)}
                  </span>
                  {service.price ? (
                    <span className="text-2xl font-black text-yellow-700">{formatPrice(service.price, language)}</span>
                  ) : (
                    <span className="text-lg font-bold text-yellow-700">{t('negotiable', language)}</span>
                  )}
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-0">
                  <Clock className="w-3 h-3 ml-1" />
                  {getPriceTypeLabel(service.priceType, language)}
                </Badge>
              </div>
            </div>

            {/* Provider Info */}
            {service.provider && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600">
                    <AvatarFallback className="bg-transparent text-white font-bold text-lg">
                      {service.provider.username?.[0] || 'م'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-base">{service.provider.username}</span>
                      {service.provider.isVerified && <Award className="w-4 h-4 text-blue-500 fill-blue-500" />}
                    </div>
                    {service.provider.specialty && <p className="text-xs text-gray-500">{service.provider.specialty}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      {service.provider.experience && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {service.provider.experience} {t('experience', language)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                <Briefcase className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                <div className="font-black text-xl text-blue-700">{service.completedProjects}</div>
                <div className="text-xs text-blue-500 font-bold">{t('completedProjects', language)}</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
                <Star className="w-6 h-6 mx-auto text-yellow-500 fill-yellow-500 mb-1" />
                <div className="font-black text-xl text-yellow-700">{displayRating.toFixed(1)}</div>
                <div className="text-xs text-yellow-500 font-bold">{t('rating', language)}</div>
              </div>
            </div>

            {/* Rating Distribution */}
            {displayReviewCount > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <h4 className="font-bold text-xs mb-2">{language === 'ar' ? 'توزيع التقييمات' : 'Distribution des notes'}</h4>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviewSummary.distribution[star - 1]
                  const pct = displayReviewCount > 0 ? (count / displayReviewCount) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-3 text-gray-500 font-bold">{star}</span>
                      <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-5 text-gray-400 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Coverage Wilayas */}
            {service.coverageWilayas && service.coverageWilayas.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5 text-gray-600">
                  <MapPin className="w-3.5 h-3.5" /> {t('coverageWilayas', language)}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {service.coverageWilayas.map((w, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">{w}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
              <button className="btn-3d btn-3d-primary flex-1 text-base" onClick={handleBookNow}>
                <Calendar className="w-5 h-5" /> {t('bookNow', language)}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-xl font-bold text-sm transition shadow-md hover:shadow-lg" onClick={handleContactProvider}>
                <MessageCircle className="w-5 h-5" />
                {language === 'ar' ? `تواصل مع ${service.provider?.username || 'مزود الخدمة'}` : `Contacter ${service.provider?.username || 'le prestataire'}`}
              </button>
            </div>

            {/* Divider */}
            <div className="border-t my-2" />

            {/* Reviews Section */}
            <div className="max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {t('reviews', language)} ({displayReviewCount})
              </h3>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{t('noReviews', language)}</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="w-7 h-7"><AvatarFallback className="text-xs font-bold bg-purple-100 text-purple-700">{review.reviewerName?.[0] || '?'}</AvatarFallback></Avatar>
                        <span className="font-bold text-xs">{review.reviewerName}</span>
                        <div className="flex items-center gap-0.5 mr-auto">{renderStars(review.rating, 'w-3 h-3')}</div>
                        <span className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                      </div>
                      {review.comment && <p className="text-xs text-gray-600 leading-relaxed mt-1">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Review Form */}
            {user && (
              <div className="border-t pt-3 mt-3">
                <h4 className="font-bold text-xs mb-2">{t('addReview', language)}</h4>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button key={i} className="review-star" onClick={() => setNewRating(i + 1)} onMouseEnter={() => setHoverRating(i + 1)} onMouseLeave={() => setHoverRating(0)}>
                      <Star className={`w-6 h-6 transition ${i < (hoverRating || newRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  {newRating > 0 && <span className="text-xs text-gray-500 mr-1">{newRating}/5</span>}
                </div>
                <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={t('comment', language) + '...'} className="text-sm min-h-[60px] mb-2 resize-none" dir={language === 'ar' ? 'rtl' : 'ltr'} />
                <button className="btn-3d btn-3d-primary text-sm py-2 w-full" onClick={handleSubmitReview} disabled={newRating === 0 || submitting}>
                  <Send className="w-4 h-4" /> {t('submitReview', language)}
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
