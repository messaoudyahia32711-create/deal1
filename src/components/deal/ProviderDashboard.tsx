'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type Service, type ServiceRequest, type Wallet } from '@/lib/store'
import { Wrench, Calendar, Star, DollarSign, Award, Plus, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function formatPrice(price: number) {
  return new Intl.NumberFormat('ar-DZ').format(price) + ' دج'
}

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: 'معلق 🔴', cls: 'bg-red-500 text-white' },
  confirmed: { label: 'مؤكد 🟡', cls: 'bg-yellow-500 text-white' },
  in_progress: { label: 'قيد التنفيذ 🔵', cls: 'bg-blue-500 text-white' },
  completed: { label: 'مكتمل ✅', cls: 'bg-green-500 text-white' },
  cancelled: { label: 'ملغى ❌', cls: 'bg-gray-400 text-white' },
}

export default function ProviderDashboard() {
  const { user, providerTab, setProviderTab } = useAppStore()
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<ServiceRequest[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: string; nameAr: string }[]>([])
  const [newSvc, setNewSvc] = useState({ title: '', description: '', priceType: 'fixed', price: '', categoryId: '' })

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
          images: '[]',
          availabilityDays: '[]',
          coverageWilayas: '[]',
        }),
      })
      setAddDialogOpen(false)
      setNewSvc({ title: '', description: '', priceType: 'fixed', price: '', categoryId: '' })
      loadData()
    } catch (e) {
      console.error(e)
    }
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
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">🔧</div>
          <div>
            <h1 className="text-2xl font-black">لوحة تحكم مزود الخدمة</h1>
            <p className="text-sm text-gray-500">{user?.specialty || user?.username}</p>
          </div>
        </div>

        <Tabs value={providerTab} onValueChange={(v) => setProviderTab(v as any)} dir="rtl">
          <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-lg font-bold">📊 نظرة عامة</TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg font-bold">🛠️ الخدمات</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-lg font-bold">📋 الحجوزات</TabsTrigger>
            <TabsTrigger value="wallet" className="rounded-lg font-bold">💰 المحفظة</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg font-bold">⭐ التقييمات</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: '💰', label: 'أرباح اليوم', value: formatPrice(totalEarnings), color: 'from-green-50 to-emerald-50 border-green-200' },
                { icon: '📋', label: 'حجوزات جديدة', value: bookings.filter(b => b.status === 'pending').length.toString(), color: 'from-blue-50 to-cyan-50 border-blue-200' },
                { icon: '⭐', label: 'تقييمك', value: '4.7', color: 'from-yellow-50 to-amber-50 border-yellow-200' },
                { icon: '🏗️', label: 'مشاريع منجزة', value: completedProjects.toString(), color: 'from-purple-50 to-pink-50 border-purple-200' },
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
            <Card className="commission-highlight">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">🧮 حاسبة العمولة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-sm text-gray-500 font-bold">إجمالي الأرباح</div><div className="text-xl font-black">{formatPrice(totalEarnings)}</div></div>
                  <div><div className="text-sm text-gray-500 font-bold">عمولة المنصة (1.5%)</div><div className="text-xl font-black text-red-500">{formatPrice(commission)}</div></div>
                  <div><div className="text-sm text-gray-500 font-bold">صافي الربح</div><div className="text-xl font-black text-green-600">{formatPrice(netProfit)}</div></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services */}
          <TabsContent value="services">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black">الخدمات ({services.length})</h2>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <button className="btn-3d btn-3d-primary"><Plus className="w-4 h-4" /> إضافة خدمة</button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader><DialogTitle className="font-black">إضافة خدمة جديدة</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddService} className="space-y-3">
                    <div><Label className="font-bold">اسم الخدمة</Label><Input value={newSvc.title} onChange={e => setNewSvc(s => ({ ...s, title: e.target.value }))} required className="rounded-xl" /></div>
                    <div><Label className="font-bold">الوصف</Label><Textarea value={newSvc.description} onChange={e => setNewSvc(s => ({ ...s, description: e.target.value }))} className="rounded-xl" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="font-bold">نوع السعر</Label>
                        <Select value={newSvc.priceType} onValueChange={v => setNewSvc(s => ({ ...s, priceType: v }))}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">ثابت</SelectItem>
                            <SelectItem value="hourly">بالساعة</SelectItem>
                            <SelectItem value="negotiable">تفاوضي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="font-bold">السعر (دج)</Label><Input type="number" value={newSvc.price} onChange={e => setNewSvc(s => ({ ...s, price: e.target.value }))} className="rounded-xl" dir="ltr" /></div>
                    </div>
                    <div><Label className="font-bold">الفئة</Label>
                      <Select value={newSvc.categoryId} onValueChange={v => setNewSvc(s => ({ ...s, categoryId: v }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <button type="submit" className="btn-3d btn-3d-primary w-full">إضافة الخدمة</button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-3">
              {services.map(svc => (
                <Card key={svc.id} className="shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🛠️</div>
                    <div className="flex-1">
                      <h3 className="font-bold">{svc.title}</h3>
                      <div className="flex gap-3 text-sm">
                        <span className="text-gray-500">{svc.priceType === 'fixed' ? 'ثابت' : svc.priceType === 'hourly' ? 'بالساعة' : 'تفاوضي'}</span>
                        {svc.price && <span className="font-bold text-orange-600">{formatPrice(svc.price)}</span>}
                      </div>
                    </div>
                    <Badge className={svc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{svc.status === 'active' ? 'نشط' : 'مخفي'}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Bookings */}
          <TabsContent value="bookings">
            <h2 className="text-lg font-black mb-4">الحجوزات ({bookings.length})</h2>
            <div className="grid gap-3">
              {bookings.map(b => {
                const st = statusMap[b.status] || { label: b.status, cls: 'bg-gray-200' }
                return (
                  <Card key={b.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`${st.cls} font-bold text-xs`}>{st.label}</Badge>
                        <span className="font-black text-orange-600">{formatPrice(b.totalPrice)}</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        {b.serviceTitle && <span>الخدمة: {b.serviceTitle}</span>}
                        {b.scheduledDate && <span className="mr-3">📅 {new Date(b.scheduledDate).toLocaleDateString('ar-DZ')}</span>}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {b.status === 'pending' && (
                          <>
                            <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="btn-3d btn-3d-primary text-xs py-1.5 px-3"><CheckCircle className="w-3 h-3" /> تأكيد</button>
                            <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="btn-3d btn-3d-danger text-xs py-1.5 px-3"><XCircle className="w-3 h-3" /> رفض</button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => updateBookingStatus(b.id, 'in_progress')} className="btn-3d btn-3d-secondary text-xs py-1.5 px-3">بدء التنفيذ</button>
                        )}
                        {b.status === 'in_progress' && (
                          <button onClick={() => updateBookingStatus(b.id, 'completed')} className="btn-3d btn-3d-primary text-xs py-1.5 px-3">إتمام الخدمة</button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {bookings.length === 0 && <div className="text-center py-12 text-gray-400"><Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>لا توجد حجوزات بعد</p></div>}
            </div>
          </TabsContent>

          {/* Wallet */}
          <TabsContent value="wallet">
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 mb-6">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-500 font-bold mb-1">💰 رصيد المحفظة</div>
                <div className="text-4xl font-black text-orange-600 mb-4">{formatPrice(wallet?.balance || 0)}</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-xs text-gray-400">إجمالي الأرباح</div><div className="font-bold">{formatPrice(wallet?.totalEarned || 0)}</div></div>
                  <div><div className="text-xs text-gray-400">العمولات المدفوعة</div><div className="font-bold text-red-500">{formatPrice(wallet?.totalCommissionPaid || 0)}</div></div>
                  <div><div className="text-xs text-gray-400">قيد السحب</div><div className="font-bold text-yellow-600">{formatPrice(wallet?.pendingWithdrawal || 0)}</div></div>
                </div>
              </CardContent>
            </Card>
            <button className="btn-3d btn-3d-secondary w-full">طلب سحب الأرباح</button>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <div className="text-center py-12">
              <Star className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-black mb-2">تقييمك: 4.7 ⭐</h3>
              <p className="text-gray-400">بناءً على 18 تقييم</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
