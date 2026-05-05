'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type Rental, type RentalRequest, type Wallet } from '@/lib/store'
import { t, formatPrice } from '@/lib/i18n'
import MessagePanel from '@/components/deal/MessagePanel'
import { Wrench, Calendar, Star, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Image as ImageIcon, X, Loader2, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

const rentalStatusLabels: Record<string, { ar: string; fr: string; cls: string }> = {
  pending: { ar: 'معلق 🔴', fr: 'En attente 🔴', cls: 'bg-red-500 text-white' },
  confirmed: { ar: 'مؤكد 🟡', fr: 'Confirmé 🟡', cls: 'bg-yellow-500 text-white' },
  active: { ar: 'نشط 🔵', fr: 'Actif 🔵', cls: 'bg-blue-500 text-white' },
  completed: { ar: 'مكتمل ✅', fr: 'Terminé ✅', cls: 'bg-emerald-500 text-white' },
  cancelled: { ar: 'ملغى ❌', fr: 'Annulé ❌', cls: 'bg-gray-400 text-white' },
}

export default function RentalProviderDashboard() {
  const { user, rentalProviderTab, setRentalProviderTab, language } = useAppStore()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [bookings, setBookings] = useState<RentalRequest[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: string; nameAr: string; nameFr?: string }[]>([])
  const [newRental, setNewRental] = useState({
    title: '',
    description: '',
    categoryId: '',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    deposit: '',
    minRentalDays: '1',
    maxRentalDays: '',
    deliveryAvailable: false,
    deliveryFee: '',
    coverageWilayas: '',
  })
  const [rentalImages, setRentalImages] = useState<File[]>([])
  const [rentalImagePreviews, setRentalImagePreviews] = useState<string[]>([])
  const [uploadingRental, setUploadingRental] = useState(false)
  const isArabic = language === 'ar'

  async function loadData() {
    if (!user?.id) return
    setLoading(true)
    try {
      const [rentalRes, bookRes, walletRes, catRes] = await Promise.all([
        fetch(`/api/rentals?providerId=${user.id}&limit=100`),
        fetch(`/api/rental-requests?providerId=${user.id}`),
        fetch(`/api/wallet?merchantId=${user.id}`),
        fetch('/api/categories?type=rental'),
      ])
      const rentalData = await rentalRes.json()
      const bookData = await bookRes.json()
      const walletData = await walletRes.json()
      const catData = await catRes.json()

      setRentals(rentalData.data || [])
      setBookings(bookData.data || [])
      setWallet(walletData.data || null)
      setCategories(catData.data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  async function handleAddRental(e: React.FormEvent) {
    e.preventDefault()
    try {
      const imageUrls: string[] = []

      if (rentalImages.length > 0) {
        setUploadingRental(true)
        for (const file of rentalImages) {
          const formData = new FormData()
          formData.append('file', file)
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
          const uploadData = await uploadRes.json()
          if (uploadData.data?.url) {
            imageUrls.push(uploadData.data.url)
          }
        }
        setUploadingRental(false)
      }

      const wilayaCodes = newRental.coverageWilayas
        .split(',')
        .map(w => w.trim())
        .filter(Boolean)

      await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: user!.id,
          title: newRental.title,
          description: newRental.description,
          categoryId: newRental.categoryId,
          dailyRate: parseFloat(newRental.dailyRate) || 0,
          weeklyRate: newRental.weeklyRate ? parseFloat(newRental.weeklyRate) : null,
          monthlyRate: newRental.monthlyRate ? parseFloat(newRental.monthlyRate) : null,
          deposit: parseFloat(newRental.deposit) || 0,
          minRentalDays: parseInt(newRental.minRentalDays) || 1,
          maxRentalDays: newRental.maxRentalDays ? parseInt(newRental.maxRentalDays) : null,
          deliveryAvailable: newRental.deliveryAvailable,
          deliveryFee: newRental.deliveryFee ? parseFloat(newRental.deliveryFee) : null,
          images: JSON.stringify(imageUrls),
          coverageWilayas: JSON.stringify(wilayaCodes),
        }),
      })
      setAddDialogOpen(false)
      setNewRental({
        title: '', description: '', categoryId: '', dailyRate: '', weeklyRate: '', monthlyRate: '',
        deposit: '', minRentalDays: '1', maxRentalDays: '', deliveryAvailable: false, deliveryFee: '', coverageWilayas: '',
      })
      setRentalImages([])
      setRentalImagePreviews([])
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  function handleRentalImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const newFiles: File[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      if (file.size > 5 * 1024 * 1024) continue
      newFiles.push(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setRentalImagePreviews(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    }
    setRentalImages(prev => [...prev, ...newFiles])
  }

  function removeRentalImage(index: number) {
    setRentalImages(prev => prev.filter((_, i) => i !== index))
    setRentalImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function updateBookingStatus(id: string, status: string) {
    try {
      await fetch(`/api/rental-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const totalEarnings = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.totalPrice, 0)
  const commission = totalEarnings * 0.015
  const netProfit = totalEarnings - commission
  const completedRentalsCount = bookings.filter(b => b.status === 'completed').length
  const activeRentalsCount = bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">🏗️</div>
          <div>
            <h1 className="text-2xl font-black">{t('rentalPanel', language)}</h1>
            <p className="text-sm text-gray-500">{user?.storeName || user?.specialty || user?.username}</p>
          </div>
        </div>

        <Tabs value={rentalProviderTab} onValueChange={(v) => setRentalProviderTab(v as any)} dir="rtl">
          <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-lg font-bold">📊 {t('overview', language)}</TabsTrigger>
            <TabsTrigger value="rentals" className="rounded-lg font-bold">🏗️ {t('rentals', language)}</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-lg font-bold">📋 {t('bookings', language)}</TabsTrigger>
            <TabsTrigger value="wallet" className="rounded-lg font-bold">💰 {t('wallet', language)}</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg font-bold">⭐ {t('reviews', language)}</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg font-bold">💬 {t('chat', language)}</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: '🏗️', label: t('rentals', language), value: rentals.length.toString(), color: 'from-emerald-50 to-teal-50 border-emerald-200' },
                { icon: '📋', label: isArabic ? 'إيجارات نشطة' : 'Locations actives', value: activeRentalsCount.toString(), color: 'from-blue-50 to-indigo-50 border-blue-200' },
                { icon: '✅', label: t('completedRentals', language), value: completedRentalsCount.toString(), color: 'from-amber-50 to-yellow-50 border-amber-200' },
                { icon: '💰', label: t('totalEarned', language), value: formatPrice(totalEarnings, language), color: 'from-teal-50 to-cyan-50 border-teal-200' },
              ].map((card, i) => (
                <Card key={i} className={`bg-gradient-to-br ${card.color} border-2`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-1">{card.icon}</div>
                    <div className="text-xl font-black">{card.value}</div>
                    <div className="text-xs text-gray-500 font-bold">{card.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Commission Calculator */}
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">🧮 {isArabic ? 'حاسبة العمولة' : 'Calculateur de commission'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-sm text-gray-500 font-bold">{t('totalEarned', language)}</div><div className="text-xl font-black">{formatPrice(totalEarnings, language)}</div></div>
                  <div><div className="text-sm text-gray-500 font-bold">{t('platformCommission', language)} (1.5%)</div><div className="text-xl font-black text-red-500">{formatPrice(commission, language)}</div></div>
                  <div><div className="text-sm text-gray-500 font-bold">{t('netProfit', language)}</div><div className="text-xl font-black text-emerald-600">{formatPrice(netProfit, language)}</div></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rentals */}
          <TabsContent value="rentals">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black">{t('rentals', language)} ({rentals.length})</h2>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <button className="btn-3d py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition shadow-md"><Plus className="w-4 h-4 inline mr-1" /> {t('addRental', language)}</button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
                  <DialogHeader><DialogTitle className="font-black">{t('addRental', language)}</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddRental} className="space-y-3">
                    <div><Label className="font-bold">{isArabic ? 'اسم المعدة' : "Nom de l'équipement"}</Label><Input value={newRental.title} onChange={e => setNewRental(s => ({ ...s, title: e.target.value }))} required className="rounded-xl" /></div>
                    <div><Label className="font-bold">{isArabic ? 'الوصف' : 'Description'}</Label><Textarea value={newRental.description} onChange={e => setNewRental(s => ({ ...s, description: e.target.value }))} className="rounded-xl" /></div>
                    <div><Label className="font-bold">{t('category', language)}</Label>
                      <Select value={newRental.categoryId} onValueChange={v => setNewRental(s => ({ ...s, categoryId: v }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder={isArabic ? 'اختر الفئة' : 'Choisir catégorie'} /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{isArabic ? c.nameAr : (c.nameFr || c.nameAr)}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="font-bold">{t('dailyRate', language)}</Label><Input type="number" value={newRental.dailyRate} onChange={e => setNewRental(s => ({ ...s, dailyRate: e.target.value }))} className="rounded-xl" dir="ltr" required /></div>
                      <div><Label className="font-bold">{t('weeklyRate', language)}</Label><Input type="number" value={newRental.weeklyRate} onChange={e => setNewRental(s => ({ ...s, weeklyRate: e.target.value }))} className="rounded-xl" dir="ltr" /></div>
                      <div><Label className="font-bold">{t('monthlyRate', language)}</Label><Input type="number" value={newRental.monthlyRate} onChange={e => setNewRental(s => ({ ...s, monthlyRate: e.target.value }))} className="rounded-xl" dir="ltr" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="font-bold">{t('deposit', language)}</Label><Input type="number" value={newRental.deposit} onChange={e => setNewRental(s => ({ ...s, deposit: e.target.value }))} className="rounded-xl" dir="ltr" /></div>
                      <div><Label className="font-bold">{t('minRentalDays', language)}</Label><Input type="number" value={newRental.minRentalDays} onChange={e => setNewRental(s => ({ ...s, minRentalDays: e.target.value }))} className="rounded-xl" dir="ltr" min="1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="font-bold">{t('maxRentalDays', language)}</Label><Input type="number" value={newRental.maxRentalDays} onChange={e => setNewRental(s => ({ ...s, maxRentalDays: e.target.value }))} className="rounded-xl" dir="ltr" /></div>
                      <div><Label className="font-bold">{t('deliveryFee', language)}</Label><Input type="number" value={newRental.deliveryFee} onChange={e => setNewRental(s => ({ ...s, deliveryFee: e.target.value }))} className="rounded-xl" dir="ltr" /></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="deliveryAvailable"
                        checked={newRental.deliveryAvailable}
                        onCheckedChange={(checked) => setNewRental(s => ({ ...s, deliveryAvailable: !!checked }))}
                      />
                      <Label htmlFor="deliveryAvailable" className="font-bold flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" /> {t('deliveryAvailable', language)}
                      </Label>
                    </div>
                    <div>
                      <Label className="font-bold">{t('coverageWilayas', language)}</Label>
                      <Input
                        value={newRental.coverageWilayas}
                        onChange={e => setNewRental(s => ({ ...s, coverageWilayas: e.target.value }))}
                        placeholder={isArabic ? 'أدخل أسماء الولايات مفصولة بفواصل' : 'Noms de wilayas séparés par virgules'}
                        className="rounded-xl mt-1"
                      />
                    </div>
                    {/* Image Upload */}
                    <div>
                      <Label className="font-bold">{t('image', language)} ({isArabic ? 'يمكنك اختيار عدة صور' : 'Plusieurs photos possibles'})</Label>
                      <div className="mt-1 space-y-2">
                        {rentalImagePreviews.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {rentalImagePreviews.map((preview, idx) => (
                              <div key={idx} className="relative">
                                <img src={preview} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-200" />
                                <button
                                  type="button"
                                  onClick={() => removeRentalImage(idx)}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-500">{t('uploadImage', language)}</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleRentalImageSelect} />
                        </label>
                      </div>
                    </div>
                    <button type="submit" disabled={uploadingRental} className="btn-3d w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50">
                      {uploadingRental ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t('addRental', language)}
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4">
              {rentals.map(rental => {
                const hasImage = rental.images && rental.images.length > 0
                return (
                  <Card key={rental.id} className="shadow-sm hover:shadow-md transition overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Rental Image */}
                        <div className="w-28 h-28 md:w-36 md:h-36 shrink-0 bg-gradient-to-br from-emerald-50 to-teal-100 overflow-hidden">
                          {hasImage ? (
                            <img src={rental.images[0]} alt={rental.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Wrench className="w-10 h-10 text-emerald-300" />
                            </div>
                          )}
                        </div>
                        {/* Rental Details */}
                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-base truncate">{rental.title}</h3>
                            <Badge className={rental.status === 'active' ? 'bg-emerald-100 text-emerald-700 shrink-0' : 'bg-gray-100 text-gray-600 shrink-0'}>
                              {rental.status === 'active' ? (isArabic ? 'نشط' : 'Actif') : (isArabic ? 'مخفي' : 'Masqué')}
                            </Badge>
                          </div>
                          {rental.description && (
                            <p className="text-xs text-gray-400 line-clamp-1 mb-2">{rental.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm mb-2 flex-wrap">
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5">
                              {t('dailyRate', language)}: {formatPrice(rental.dailyRate, language)}
                            </Badge>
                            {rental.weeklyRate && (
                              <Badge className="bg-teal-100 text-teal-700 text-[10px] px-1.5">
                                {t('weeklyRate', language)}: {formatPrice(rental.weeklyRate, language)}
                              </Badge>
                            )}
                            {rental.monthlyRate && (
                              <Badge className="bg-cyan-100 text-cyan-700 text-[10px] px-1.5">
                                {t('monthlyRate', language)}: {formatPrice(rental.monthlyRate, language)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {rental.completedRentals > 0 && (
                                <span className="text-xs text-gray-400">✅ {rental.completedRentals} {isArabic ? 'إيجار' : 'locations'}</span>
                              )}
                              {rental.deliveryAvailable && (
                                <span className="text-xs text-emerald-500 flex items-center gap-1"><Truck className="w-3 h-3" /> {t('deliveryAvailable', language)}</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {rentals.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400">
                  <Wrench className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>{isArabic ? 'لا توجد معدات بعد' : 'Aucun équipement pour le moment'}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Bookings */}
          <TabsContent value="bookings">
            <h2 className="text-lg font-black mb-4">{t('bookings', language)} ({bookings.length})</h2>
            <div className="grid gap-3">
              {bookings.map(b => {
                const st = rentalStatusLabels[b.status] || { ar: b.status, fr: b.status, cls: 'bg-gray-200' }
                return (
                  <Card key={b.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`${st.cls} font-bold text-xs`}>{isArabic ? st.ar : st.fr}</Badge>
                        <span className="font-black text-emerald-600">{formatPrice(b.totalPrice, language)}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1 font-bold">
                        {b.rentalTitle && <span>{b.rentalTitle}</span>}
                      </div>
                      <div className="text-sm text-gray-500 mb-2 flex flex-wrap gap-3">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.startDate} → {b.endDate}</span>
                        <span>{t('totalDays', language)}: {b.totalDays}</span>
                        {b.withDelivery && <span className="flex items-center gap-1 text-emerald-500"><Truck className="w-3.5 h-3.5" /> {t('deliveryAvailable', language)}</span>}
                      </div>
                      {b.customerName && (
                        <div className="text-xs text-gray-400 mb-2">
                          {isArabic ? 'الزبون' : 'Client'}: {b.customerName}
                        </div>
                      )}
                      {b.notes && (
                        <div className="text-xs text-gray-400 mb-2 bg-gray-50 p-2 rounded-lg">
                          {b.notes}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        {b.status === 'pending' && (
                          <>
                            <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="btn-3d py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-bold text-xs transition shadow-sm"><CheckCircle className="w-3 h-3 inline mr-1" /> {t('confirmed', language)}</button>
                            <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="btn-3d py-1.5 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-xs transition shadow-sm"><XCircle className="w-3 h-3 inline mr-1" /> {isArabic ? 'رفض' : 'Refuser'}</button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => updateBookingStatus(b.id, 'active')} className="btn-3d py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-xs transition shadow-sm">{isArabic ? 'بدء الإيجار' : 'Démarrer'}</button>
                        )}
                        {b.status === 'active' && (
                          <button onClick={() => updateBookingStatus(b.id, 'completed')} className="btn-3d py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-bold text-xs transition shadow-sm">{t('completed', language)}</button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {bookings.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>{isArabic ? 'لا توجد حجوزات بعد' : 'Aucune réservation pour le moment'}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Wallet */}
          <TabsContent value="wallet">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 mb-6">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-500 font-bold mb-1">💰 {t('balance', language)}</div>
                <div className="text-4xl font-black text-emerald-600 mb-4">{formatPrice(wallet?.balance || 0, language)}</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-xs text-gray-400">{t('totalEarned', language)}</div><div className="font-bold">{formatPrice(wallet?.totalEarned || 0, language)}</div></div>
                  <div><div className="text-xs text-gray-400">{t('commissionPaid', language)}</div><div className="font-bold text-red-500">{formatPrice(wallet?.totalCommissionPaid || 0, language)}</div></div>
                  <div><div className="text-xs text-gray-400">{t('pendingWithdrawal', language)}</div><div className="font-bold text-yellow-600">{formatPrice(wallet?.pendingWithdrawal || 0, language)}</div></div>
                </div>
              </CardContent>
            </Card>
            <button className="btn-3d w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition shadow-md">{t('withdrawRequest', language)}</button>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <div className="text-center py-12">
              <Star className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-black mb-2">{t('yourRating', language)}: 4.7 ⭐</h3>
              <p className="text-gray-400">{isArabic ? 'بناءً على تقييمات العملاء' : 'Basé sur les avis des clients'}</p>
            </div>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat">
            {user ? (
              <MessagePanel userId={user.id} userRole={user.role} language={language} />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
