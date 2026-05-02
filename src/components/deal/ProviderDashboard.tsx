'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type Service, type ServiceRequest, type Wallet, WILAYAS, WILAYAS_FR } from '@/lib/store'
import { t, formatPrice } from '@/lib/i18n'
import MessagePanel from '@/components/deal/MessagePanel'
import { Wrench, Calendar, Star, DollarSign, Award, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const statusLabels: Record<string, { ar: string; fr: string; cls: string }> = {
  pending: { ar: 'معلق 🔴', fr: 'En attente 🔴', cls: 'bg-red-500 text-white' },
  confirmed: { ar: 'مؤكد 🟡', fr: 'Confirmé 🟡', cls: 'bg-yellow-500 text-white' },
  in_progress: { ar: 'قيد التنفيذ 🔵', fr: 'En cours 🔵', cls: 'bg-blue-500 text-white' },
  completed: { ar: 'مكتمل ✅', fr: 'Terminé ✅', cls: 'bg-amber-500 text-white' },
  cancelled: { ar: 'ملغى ❌', fr: 'Annulé ❌', cls: 'bg-gray-400 text-white' },
}

export default function ProviderDashboard() {
  const { user, providerTab, setProviderTab, language } = useAppStore()
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<ServiceRequest[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: string; nameAr: string }[]>([])
  const [newSvc, setNewSvc] = useState({ title: '', description: '', priceType: 'fixed', price: '', categoryId: '', coverageWilayas: '', availabilityDays: [] as string[] })
  const [svcImages, setSvcImages] = useState<File[]>([])
  const [svcImagePreviews, setSvcImagePreviews] = useState<string[]>([])
  const [uploadingSvc, setUploadingSvc] = useState(false)
  const isArabic = language === 'ar'

  const DAYS = [
    { key: 'saturday', ar: 'السبت', fr: 'Samedi' },
    { key: 'sunday', ar: 'الأحد', fr: 'Dimanche' },
    { key: 'monday', ar: 'الاثنين', fr: 'Lundi' },
    { key: 'tuesday', ar: 'الثلاثاء', fr: 'Mardi' },
    { key: 'wednesday', ar: 'الأربعاء', fr: 'Mercredi' },
    { key: 'thursday', ar: 'الخميس', fr: 'Jeudi' },
    { key: 'friday', ar: 'الجمعة', fr: 'Vendredi' },
  ]

  async function loadData() {
    if (!user?.id) return
    setLoading(true)
    try {
      const [svcRes, bookRes, walletRes, catRes] = await Promise.all([
        fetch(`/api/services?providerId=${user.id}&limit=100`),
        fetch(`/api/service-requests?userId=${user.id}&role=service_provider`),
        fetch(`/api/wallet?merchantId=${user.id}`),
        fetch('/api/categories?type=service'),
      ])
      const svcData = await svcRes.json()
      const bookData = await bookRes.json()
      const walletData = await walletRes.json()
      const catData = await catRes.json()

      setServices(svcData.data || [])
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

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault()
    try {
      const imageUrls: string[] = []

      // Upload images if selected
      if (svcImages.length > 0) {
        setUploadingSvc(true)
        for (const file of svcImages) {
          const formData = new FormData()
          formData.append('file', file)
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
          const uploadData = await uploadRes.json()
          if (uploadData.data?.url) {
            imageUrls.push(uploadData.data.url)
          }
        }
        setUploadingSvc(false)
      }

      // Parse coverage wilayas
      const wilayaCodes = newSvc.coverageWilayas
        .split(',')
        .map(w => w.trim())
        .filter(Boolean)

      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: user!.id,
          title: newSvc.title,
          description: newSvc.description,
          priceType: newSvc.priceType,
          price: parseFloat(newSvc.price) || null,
          categoryId: newSvc.categoryId,
          images: JSON.stringify(imageUrls),
          availabilityDays: JSON.stringify(newSvc.availabilityDays),
          coverageWilayas: JSON.stringify(wilayaCodes),
        }),
      })
      setAddDialogOpen(false)
      setNewSvc({ title: '', description: '', priceType: 'fixed', price: '', categoryId: '', coverageWilayas: '', availabilityDays: [] })
      setSvcImages([])
      setSvcImagePreviews([])
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  function handleSvcImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
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
        setSvcImagePreviews(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    }
    setSvcImages(prev => [...prev, ...newFiles])
  }

  function removeSvcImage(index: number) {
    setSvcImages(prev => prev.filter((_, i) => i !== index))
    setSvcImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  function toggleDay(day: string) {
    setNewSvc(s => ({
      ...s,
      availabilityDays: s.availabilityDays.includes(day)
        ? s.availabilityDays.filter(d => d !== day)
        : [...s.availabilityDays, day],
    }))
  }

  async function updateBookingStatus(id: string, status: string) {
    try {
      await fetch(`/api/service-requests/${id}`, {
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
  const completedProjects = bookings.filter(b => b.status === 'completed').length

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">🔧</div>
          <div>
            <h1 className="text-2xl font-black">{t('providerPanel', language)}</h1>
            <p className="text-sm text-gray-500">{user?.specialty || user?.username}</p>
          </div>
        </div>

        <Tabs value={providerTab} onValueChange={(v) => setProviderTab(v as any)} dir="rtl">
          <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-lg font-bold">📊 {t('overview', language)}</TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg font-bold">🛠️ {t('services', language)}</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-lg font-bold">📋 {t('bookings', language)}</TabsTrigger>
            <TabsTrigger value="wallet" className="rounded-lg font-bold">💰 {t('wallet', language)}</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg font-bold">⭐ {t('reviews', language)}</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg font-bold">💬 {t('chat', language)}</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: '💰', label: t('todaySales', language), value: formatPrice(totalEarnings, language), color: 'from-amber-50 to-yellow-50 border-amber-200' },
                { icon: '📋', label: language === 'ar' ? 'حجوزات جديدة' : 'Nouvelles réservations', value: bookings.filter(b => b.status === 'pending').length.toString(), color: 'from-purple-50 to-violet-50 border-purple-200' },
                { icon: '⭐', label: t('yourRating', language), value: '4.7', color: 'from-yellow-50 to-amber-50 border-yellow-200' },
                { icon: '🏗️', label: t('completedProjects', language), value: completedProjects.toString(), color: 'from-pink-50 to-rose-50 border-pink-200' },
              ].map((card, i) => (
                <Card key={i} className={`bg-gradient-to-br ${card.color} border-2`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-1">{card.icon}</div>
                    <div className="text-2xl font-black">{card.value}</div>
                    <div className="text-xs text-gray-500 font-bold">{card.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Commission Calculator */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-300">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">🧮 {language === 'ar' ? 'حاسبة العمولة' : 'Calculateur de commission'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-sm text-gray-500 font-bold">{t('totalEarned', language)}</div><div className="text-xl font-black">{formatPrice(totalEarnings, language)}</div></div>
                  <div><div className="text-sm text-gray-500 font-bold">{t('platformCommission', language)} (1.5%)</div><div className="text-xl font-black text-red-500">{formatPrice(commission, language)}</div></div>
                  <div><div className="text-sm text-gray-500 font-bold">{t('netProfit', language)}</div><div className="text-xl font-black text-amber-600">{formatPrice(netProfit, language)}</div></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services */}
          <TabsContent value="services">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black">{t('services', language)} ({services.length})</h2>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <button className="btn-3d btn-3d-primary"><Plus className="w-4 h-4" /> {t('addService', language)}</button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader><DialogTitle className="font-black">{t('addService', language)}</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddService} className="space-y-3">
                    <div><Label className="font-bold">{t('serviceName', language)}</Label><Input value={newSvc.title} onChange={e => setNewSvc(s => ({ ...s, title: e.target.value }))} required className="rounded-xl" /></div>
                    <div><Label className="font-bold">{t('serviceDescription', language)}</Label><Textarea value={newSvc.description} onChange={e => setNewSvc(s => ({ ...s, description: e.target.value }))} className="rounded-xl" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="font-bold">{t('priceType', language)}</Label>
                        <Select value={newSvc.priceType} onValueChange={v => setNewSvc(s => ({ ...s, priceType: v }))}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">{t('fixed', language)}</SelectItem>
                            <SelectItem value="hourly">{t('hourly', language)}</SelectItem>
                            <SelectItem value="negotiable">{t('negotiable', language)}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="font-bold">{t('price', language)} ({t('currency', language)})</Label><Input type="number" value={newSvc.price} onChange={e => setNewSvc(s => ({ ...s, price: e.target.value }))} className="rounded-xl" dir="ltr" /></div>
                    </div>
                    <div><Label className="font-bold">{t('category', language)}</Label>
                      <Select value={newSvc.categoryId} onValueChange={v => setNewSvc(s => ({ ...s, categoryId: v }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder={isArabic ? 'اختر الفئة' : 'Choisir catégorie'} /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {/* Coverage Wilayas */}
                    <div>
                      <Label className="font-bold">{t('coverageWilayas', language)}</Label>
                      <Input
                        value={newSvc.coverageWilayas}
                        onChange={e => setNewSvc(s => ({ ...s, coverageWilayas: e.target.value }))}
                        placeholder={isArabic ? 'أدخل أرقام الولايات مفصولة بفواصل (مثال: 16,06,31)' : 'Codes wilayas séparés par virgules (ex: 16,06,31)'}
                        className="rounded-xl mt-1"
                        dir="ltr"
                      />
                    </div>
                    {/* Availability Days */}
                    <div>
                      <Label className="font-bold">{isArabic ? 'أيام التوفر' : 'Jours de disponibilité'}</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {DAYS.map(day => (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => toggleDay(day.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition ${
                              newSvc.availabilityDays.includes(day.key)
                                ? 'bg-purple-100 border-purple-400 text-purple-700'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-purple-200'
                            }`}
                          >
                            {isArabic ? day.ar : day.fr}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Image Upload - Multiple */}
                    <div>
                      <Label className="font-bold">{t('image', language)} ({isArabic ? 'يمكنك اختيار عدة صور' : 'Plusieurs photos possibles'})</Label>
                      <div className="mt-1 space-y-2">
                        {svcImagePreviews.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {svcImagePreviews.map((preview, idx) => (
                              <div key={idx} className="relative">
                                <img src={preview} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-amber-200" />
                                <button
                                  type="button"
                                  onClick={() => removeSvcImage(idx)}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-500">{t('uploadImage', language)}</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleSvcImageSelect} />
                        </label>
                      </div>
                    </div>
                    <button type="submit" disabled={uploadingSvc} className="btn-3d btn-3d-primary w-full disabled:opacity-50">
                      {uploadingSvc ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t('addService', language)}
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4">
              {services.map(svc => {
                const hasImage = svc.images && svc.images.length > 0
                return (
                  <Card key={svc.id} className="shadow-sm hover:shadow-md transition overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Service Image */}
                        <div className="w-28 h-28 md:w-36 md:h-36 shrink-0 bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden">
                          {hasImage ? (
                            <img src={svc.images[0]} alt={svc.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Wrench className="w-10 h-10 text-purple-300" />
                            </div>
                          )}
                        </div>
                        {/* Service Details */}
                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-base truncate">{svc.title}</h3>
                            <Badge className={svc.status === 'active' ? 'bg-green-100 text-green-700 shrink-0' : 'bg-gray-100 text-gray-600 shrink-0'}>
                              {svc.status === 'active' ? (isArabic ? 'نشط' : 'Actif') : (isArabic ? 'مخفي' : 'Masqué')}
                            </Badge>
                          </div>
                          {svc.description && (
                            <p className="text-xs text-gray-400 line-clamp-1 mb-2">{svc.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm mb-2">
                            <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5">
                              {svc.priceType === 'fixed' ? t('fixed', language) : svc.priceType === 'hourly' ? t('hourly', language) : t('negotiable', language)}
                            </Badge>
                            {svc.price && <span className="font-black text-purple-600">{formatPrice(svc.price, language)}</span>}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {svc.completedProjects > 0 && (
                                <span className="text-xs text-gray-400">✅ {svc.completedProjects} {isArabic ? 'مشروع' : 'projets'}</span>
                              )}
                              {hasImage && svc.images.length > 1 && (
                                <span className="text-xs text-gray-400">📷 {svc.images.length}</span>
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
            </div>
          </TabsContent>

          {/* Bookings */}
          <TabsContent value="bookings">
            <h2 className="text-lg font-black mb-4">{t('bookings', language)} ({bookings.length})</h2>
            <div className="grid gap-3">
              {bookings.map(b => {
                const st = statusLabels[b.status] || { ar: b.status, fr: b.status, cls: 'bg-gray-200' }
                return (
                  <Card key={b.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`${st.cls} font-bold text-xs`}>{isArabic ? st.ar : st.fr}</Badge>
                        <span className="font-black text-amber-600">{formatPrice(b.totalPrice, language)}</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        {b.serviceTitle && <span>{t('services', language)}: {b.serviceTitle}</span>}
                        {b.scheduledDate && <span className="mr-3">📅 {new Date(b.scheduledDate).toLocaleDateString(isArabic ? 'ar-DZ' : 'fr-DZ')}</span>}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {b.status === 'pending' && (
                          <>
                            <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="btn-3d btn-3d-primary text-xs py-1.5 px-3"><CheckCircle className="w-3 h-3" /> {t('confirmed', language)}</button>
                            <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="btn-3d btn-3d-danger text-xs py-1.5 px-3"><XCircle className="w-3 h-3" /> {isArabic ? 'رفض' : 'Refuser'}</button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => updateBookingStatus(b.id, 'in_progress')} className="btn-3d btn-3d-secondary text-xs py-1.5 px-3">{t('inProgress', language)}</button>
                        )}
                        {b.status === 'in_progress' && (
                          <button onClick={() => updateBookingStatus(b.id, 'completed')} className="btn-3d btn-3d-primary text-xs py-1.5 px-3">{t('completed', language)}</button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {bookings.length === 0 && <div className="text-center py-12 text-gray-400"><Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>{isArabic ? 'لا توجد حجوزات بعد' : 'Aucune réservation pour le moment'}</p></div>}
            </div>
          </TabsContent>

          {/* Wallet */}
          <TabsContent value="wallet">
            <Card className="bg-gradient-to-br from-purple-50 to-amber-50 border-2 border-purple-200 mb-6">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-500 font-bold mb-1">💰 {t('balance', language)}</div>
                <div className="text-4xl font-black text-purple-600 mb-4">{formatPrice(wallet?.balance || 0, language)}</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-xs text-gray-400">{t('totalEarned', language)}</div><div className="font-bold">{formatPrice(wallet?.totalEarned || 0, language)}</div></div>
                  <div><div className="text-xs text-gray-400">{t('commissionPaid', language)}</div><div className="font-bold text-red-500">{formatPrice(wallet?.totalCommissionPaid || 0, language)}</div></div>
                  <div><div className="text-xs text-gray-400">{t('pendingWithdrawal', language)}</div><div className="font-bold text-yellow-600">{formatPrice(wallet?.pendingWithdrawal || 0, language)}</div></div>
                </div>
              </CardContent>
            </Card>
            <button className="btn-3d btn-3d-primary w-full">{t('withdrawRequest', language)}</button>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <div className="text-center py-12">
              <Star className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-black mb-2">{t('yourRating', language)}: 4.7 ⭐</h3>
              <p className="text-gray-400">{isArabic ? 'بناءً على 18 تقييم' : 'Basé sur 18 avis'}</p>
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
