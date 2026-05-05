'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type Rental, type Review } from '@/lib/store'
import { t, formatPrice } from '@/lib/i18n'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Star, Calendar, MapPin, Award, Briefcase, Clock, Send, MessageCircle,
  ChevronLeft, ChevronRight, Truck, Shield, Loader2,
} from 'lucide-react'

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  )
}

function getRentalEmoji(categoryName?: string): string {
  if (!categoryName) return '🏗️'
  const map: Record<string, string> = {
    'معدات بناء ثقيلة': '🚜', 'معدات بناء خفيفة': '🔨', 'سقالات ودعامات': '🏗️', 'خلاطة خرسانة': '⛲',
    'رافعات وشاحنات': '🚛', 'معدات حفر': '⛏️', 'ضواغط هواء': '💨', 'مولدات كهربائية': '⚡',
    'معدات زراعية': '🚜', 'معدات تنظيف صناعية': '🧹', 'معدات تصوير وأحداث': '📷', 'معدات تنقل': '🚗',
  }
  return map[categoryName] || '🏗️'
}

export default function RentalDetailModal() {
  const { selectedRental, setSelectedRental, language, user, setCurrentView, setContactOwner } = useAppStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewSummary, setReviewSummary] = useState({ avgRating: 0, totalReviews: 0, distribution: [0, 0, 0, 0, 0] })
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [currentImageIdx, setCurrentImageIdx] = useState(0)

  // Rent form state
  const [showRentForm, setShowRentForm] = useState(false)
  const [rentForm, setRentForm] = useState({
    startDate: '',
    endDate: '',
    withDelivery: false,
    deliveryAddress: '',
    notes: '',
  })
  const [submittingRental, setSubmittingRental] = useState(false)

  const rental: Rental | null = selectedRental

  const loadReviews = useCallback(async () => {
    if (!rental) return
    try {
      const res = await fetch(`/api/reviews?targetId=${rental.id}&targetType=rental&limit=20`)
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
  }, [rental])

  useEffect(() => {
    if (rental) { loadReviews(); setNewRating(0); setNewComment(''); setCurrentImageIdx(0); setShowRentForm(false); setRentForm({ startDate: '', endDate: '', withDelivery: false, deliveryAddress: '', notes: '' }) }
  }, [rental, loadReviews])

  // Calculate total days and price
  const totalDays = (() => {
    if (!rentForm.startDate || !rentForm.endDate) return 0
    const start = new Date(rentForm.startDate)
    const end = new Date(rentForm.endDate)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  })()

  const totalPrice = (() => {
    if (!rental || totalDays === 0) return 0
    let rate = rental.dailyRate
    // Use weekly rate if applicable
    if (rental.weeklyRate && totalDays >= 7) {
      const weeks = Math.floor(totalDays / 7)
      const remainingDays = totalDays % 7
      rate = (weeks * rental.weeklyRate + remainingDays * rental.dailyRate) / totalDays
    }
    // Use monthly rate if applicable
    if (rental.monthlyRate && totalDays >= 30) {
      const months = Math.floor(totalDays / 30)
      const remainingDays = totalDays % 30
      const remainingRate = remainingDays >= 7 && rental.weeklyRate
        ? Math.floor(remainingDays / 7) * rental.weeklyRate + (remainingDays % 7) * rental.dailyRate
        : remainingDays * rental.dailyRate
      rate = (months * rental.monthlyRate + remainingRate) / totalDays
    }
    let price = Math.round(rate * totalDays)
    if (rentForm.withDelivery && rental.deliveryFee) {
      price += rental.deliveryFee
    }
    return price
  })()

  function handleClose() { setSelectedRental(null) }

  async function handleSubmitReview() {
    if (!user || !rental || newRating === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: user.id, targetId: rental.id, targetType: 'rental', rating: newRating, comment: newComment }),
      })
      if (res.ok) { setNewRating(0); setNewComment(''); loadReviews() }
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }

  function handleRentNow() {
    if (!user) { setCurrentView('auth'); handleClose(); return }
    setShowRentForm(true)
  }

  async function handleSubmitRental(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !rental || totalDays === 0) return
    setSubmittingRental(true)
    try {
      const res = await fetch('/api/rental-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.id,
          providerId: rental.providerId,
          rentalId: rental.id,
          startDate: rentForm.startDate,
          endDate: rentForm.endDate,
          withDelivery: rentForm.withDelivery,
          deliveryAddress: rentForm.deliveryAddress || undefined,
          notes: rentForm.notes || undefined,
        }),
      })
      if (res.ok) {
        setShowRentForm(false)
        setRentForm({ startDate: '', endDate: '', withDelivery: false, deliveryAddress: '', notes: '' })
      }
    } catch (e) { console.error(e) }
    setSubmittingRental(false)
  }

  function handleContactProvider() {
    if (!rental?.provider) return
    if (!user) { setCurrentView('auth'); handleClose(); return }
    const dashboardView = user.role === 'merchant' ? 'merchant-dashboard'
      : user.role === 'service_provider' ? 'provider-dashboard'
      : user.role === 'rental_provider' ? 'rental-dashboard'
      : user.role === 'admin' ? 'admin-dashboard'
      : 'customer-dashboard'
    setContactOwner(rental.providerId, rental.provider?.username || '')
    setCurrentView(dashboardView)
    handleClose()
    const store = useAppStore.getState()
    if (user.role === 'merchant') store.setMerchantTab('chat')
    else if (user.role === 'service_provider') store.setProviderTab('chat')
    else if (user.role === 'rental_provider') store.setRentalProviderTab('chat')
    else if (user.role === 'customer') store.setCustomerTab('chat')
    else if (user.role === 'admin') store.setAdminTab('chat')
  }

  function renderStars(rating: number, size: string = 'w-4 h-4') {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`${size} ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ))
  }

  if (!rental) return null

  const displayRating = reviewSummary.avgRating || rental.rating || 0
  const displayReviewCount = reviewSummary.totalReviews || rental.reviewCount || 0
  const emoji = getRentalEmoji(rental.categoryName)
  const images = rental.images && rental.images.length > 0 ? rental.images : []

  return (
    <Dialog open={!!rental} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0" showCloseButton={false}>
        <DialogTitle className="sr-only">{rental.title}</DialogTitle>

        {/* Close Button */}
        <button onClick={handleClose} className="absolute top-3 left-3 z-50 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition">
          <XIcon className="w-4 h-4" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-1/2 bg-gradient-to-br from-emerald-50 to-teal-50 relative">
            {images.length > 0 ? (
              <>
                <div className="aspect-square relative overflow-hidden">
                  <img src={images[currentImageIdx]} alt={rental.title} className="w-full h-full object-cover" />
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
                  <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg z-10">
                    {currentImageIdx + 1} / {images.length}
                  </div>
                  {/* Content overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
                    {rental.categoryName && (
                      <Badge className="bg-white/20 text-white text-xs mb-2 border-0 backdrop-blur-sm">{rental.categoryName}</Badge>
                    )}
                    <h2 className="text-xl font-black leading-tight mb-1">{rental.title}</h2>
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
                      <button key={i} onClick={() => setCurrentImageIdx(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${i === currentImageIdx ? 'border-emerald-500 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-200">
                <div className="text-center">
                  <div className="w-28 h-28 mx-auto rounded-3xl bg-white/30 backdrop-blur-sm flex items-center justify-center text-6xl shadow-xl mb-4">
                    {emoji}
                  </div>
                  <p className="text-emerald-400 text-sm font-bold">{rental.categoryName || (language === 'ar' ? 'معدة للكراء' : 'Équipement en location')}</p>
                  <p className="text-emerald-300 text-xs mt-1">{language === 'ar' ? 'يمكن للمؤجر إضافة صور لاحقاً' : 'Le loueur peut ajouter des photos plus tard'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 p-6 flex flex-col">
            {/* Category + Title (when no image) */}
            {images.length === 0 && (
              <>
                {rental.categoryName && (
                  <Badge variant="outline" className="w-fit text-xs mb-2 border-emerald-300 text-emerald-700 bg-emerald-50">{rental.categoryName}</Badge>
                )}
                <h2 className="text-2xl font-black mb-3 leading-tight">{rental.title}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">{renderStars(displayRating, 'w-5 h-5')}</div>
                  <span className="text-base font-bold text-gray-600">{displayRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({displayReviewCount} {t('reviews', language)})</span>
                </div>
              </>
            )}

            {/* Description */}
            {rental.description && (
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{rental.description}</p>
            )}

            {/* Rates Section */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-4 border border-emerald-200">
              <h4 className="font-bold text-xs text-emerald-700 mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {t('rentalPeriod', language)}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-emerald-100">
                  <div className="text-lg font-black text-emerald-700">{formatPrice(rental.dailyRate, language)}</div>
                  <div className="text-xs text-gray-500 font-bold">{t('dailyRate', language)}{t('perDay', language)}</div>
                </div>
                {rental.weeklyRate && (
                  <div className="bg-white rounded-lg p-3 text-center border border-emerald-100">
                    <div className="text-lg font-black text-emerald-700">{formatPrice(rental.weeklyRate, language)}</div>
                    <div className="text-xs text-gray-500 font-bold">{t('weeklyRate', language)}{t('perWeek', language)}</div>
                  </div>
                )}
                {rental.monthlyRate && (
                  <div className="bg-white rounded-lg p-3 text-center border border-emerald-100">
                    <div className="text-lg font-black text-emerald-700">{formatPrice(rental.monthlyRate, language)}</div>
                    <div className="text-xs text-gray-500 font-bold">{t('monthlyRate', language)}{t('perMonth', language)}</div>
                  </div>
                )}
              </div>
              {/* Deposit & Duration info */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {rental.deposit > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    <Shield className="w-3 h-3 ml-1" />
                    {t('deposit', language)}: {formatPrice(rental.deposit, language)}
                  </Badge>
                )}
                <Badge className="bg-emerald-100 text-emerald-700 border-0">
                  <Clock className="w-3 h-3 ml-1" />
                  {t('minRentalDays', language)}: {rental.minRentalDays} {language === 'ar' ? 'يوم' : 'jours'}
                  {rental.maxRentalDays && ` / ${t('maxRentalDays', language)}: ${rental.maxRentalDays}`}
                </Badge>
              </div>
            </div>

            {/* Delivery Info */}
            {rental.deliveryAvailable && (
              <div className="bg-blue-50 rounded-xl p-3 mb-4 border border-blue-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-500" />
                <div>
                  <span className="text-xs font-bold text-blue-700 block">{t('deliveryAvailable', language)}</span>
                  {rental.deliveryFee ? (
                    <span className="text-xs text-blue-500">{formatPrice(rental.deliveryFee, language)}</span>
                  ) : (
                    <span className="text-xs text-blue-500">{t('free', language)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Provider Info */}
            {rental.provider && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600">
                    <AvatarFallback className="bg-transparent text-white font-bold text-lg">
                      {rental.provider.username?.[0] || 'م'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-base">{rental.provider.username}</span>
                      {rental.provider.isVerified && <Award className="w-4 h-4 text-blue-500 fill-blue-500" />}
                    </div>
                    {rental.provider.specialty && <p className="text-xs text-gray-500">{rental.provider.specialty}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      {rental.provider.experience && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rental.provider.experience} {t('experience', language)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                <Briefcase className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                <div className="font-black text-xl text-emerald-700">{rental.completedRentals}</div>
                <div className="text-xs text-emerald-500 font-bold">{t('completedRentals', language)}</div>
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
            {rental.coverageWilayas && rental.coverageWilayas.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5 text-gray-600">
                  <MapPin className="w-3.5 h-3.5" /> {t('coverageWilayas', language)}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {rental.coverageWilayas.map((w, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">{w}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!showRentForm && (
              <div className="flex gap-3 mb-4">
                <button className="btn-3d flex-1 text-base py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition shadow-md hover:shadow-lg" onClick={handleRentNow}>
                  <Calendar className="w-5 h-5 inline mr-1" /> {t('rentNow', language)}
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-sm transition shadow-md hover:shadow-lg" onClick={handleContactProvider}>
                  <MessageCircle className="w-5 h-5" />
                  {language === 'ar' ? `تواصل مع ${rental.provider?.username || 'المؤجر'}` : `Contacter ${rental.provider?.username || 'le loueur'}`}
                </button>
              </div>
            )}

            {/* Rent Form */}
            {showRentForm && (
              <form onSubmit={handleSubmitRental} className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200 space-y-3">
                <h4 className="font-black text-sm flex items-center gap-1.5 text-emerald-700">
                  <Calendar className="w-4 h-4" /> {t('rentNow', language)}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-bold text-xs">{language === 'ar' ? 'تاريخ البداية' : 'Date de début'}</Label>
                    <Input
                      type="date"
                      value={rentForm.startDate}
                      onChange={e => setRentForm(f => ({ ...f, startDate: e.target.value }))}
                      className="rounded-xl mt-1"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-bold text-xs">{language === 'ar' ? 'تاريخ النهاية' : 'Date de fin'}</Label>
                    <Input
                      type="date"
                      value={rentForm.endDate}
                      onChange={e => setRentForm(f => ({ ...f, endDate: e.target.value }))}
                      className="rounded-xl mt-1"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>
                {rental.deliveryAvailable && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="withDelivery"
                      checked={rentForm.withDelivery}
                      onChange={e => setRentForm(f => ({ ...f, withDelivery: e.target.checked }))}
                      className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <Label htmlFor="withDelivery" className="font-bold text-xs flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> {t('deliveryAvailable', language)}
                      {rental.deliveryFee ? ` (${formatPrice(rental.deliveryFee, language)})` : ` (${t('free', language)})`}
                    </Label>
                  </div>
                )}
                {rentForm.withDelivery && (
                  <div>
                    <Label className="font-bold text-xs">{t('deliveryAddress', language)}</Label>
                    <Input
                      value={rentForm.deliveryAddress}
                      onChange={e => setRentForm(f => ({ ...f, deliveryAddress: e.target.value }))}
                      placeholder={language === 'ar' ? 'عنوان التوصيل' : 'Adresse de livraison'}
                      className="rounded-xl mt-1"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                )}
                <div>
                  <Label className="font-bold text-xs">{language === 'ar' ? 'ملاحظات' : 'Remarques'}</Label>
                  <Textarea
                    value={rentForm.notes}
                    onChange={e => setRentForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Remarques supplémentaires...'}
                    className="rounded-xl mt-1 text-sm min-h-[50px] resize-none"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
                {/* Price Summary */}
                {totalDays > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-emerald-200">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">{t('totalDays', language)}:</span>
                      <span className="font-bold">{totalDays} {language === 'ar' ? 'يوم' : 'jours'}</span>
                    </div>
                    {rentForm.withDelivery && rental.deliveryFee && (
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-gray-500">{t('deliveryFee', language)}:</span>
                        <span className="font-bold">{formatPrice(rental.deliveryFee, language)}</span>
                      </div>
                    )}
                    {rental.deposit > 0 && (
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-gray-500">{t('deposit', language)}:</span>
                        <span className="font-bold text-amber-600">{formatPrice(rental.deposit, language)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm border-t pt-1 mt-1">
                      <span className="font-bold">{t('total', language)}:</span>
                      <span className="font-black text-emerald-700 text-lg">{formatPrice(totalPrice, language)}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submittingRental || totalDays === 0}
                    className="btn-3d flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50"
                  >
                    {submittingRental ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t('confirm', language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRentForm(false)}
                    className="btn-3d py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition"
                  >
                    {t('cancel', language)}
                  </button>
                </div>
              </form>
            )}

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
                        <Avatar className="w-7 h-7"><AvatarFallback className="text-xs font-bold bg-emerald-100 text-emerald-700">{review.reviewerName?.[0] || '?'}</AvatarFallback></Avatar>
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
                <button className="btn-3d flex items-center justify-center gap-1 py-2.5 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50" onClick={handleSubmitReview} disabled={newRating === 0 || submitting}>
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
