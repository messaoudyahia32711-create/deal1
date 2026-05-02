'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Users, DollarSign, Package, AlertTriangle, TrendingUp, Shield, Settings, Download, Eye, Ban, CheckCircle, Search, FileText, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

function formatPrice(price: number) {
  return new Intl.NumberFormat('ar-DZ').format(price) + ' دج'
}

interface Stats {
  totalUsers: number
  totalProducts: number
  totalServices: number
  totalOrders: number
  totalCommissions: number
  usersByRole: Record<string, number>
  ordersByStatus: Record<string, number>
}

interface UserItem {
  id: string
  username: string
  email: string
  role: string
  isVerified: boolean
  isActive: boolean
  wilaya?: string
  storeName?: string
  specialty?: string
}

interface CategoryItem {
  id: string
  nameAr: string
  nameFr?: string
  type: string
  icon?: string
}

interface ComplaintItem {
  id: string
  subject: string
  description: string
  priority: string
  status: string
  userId: string
  createdAt: string
}

export default function AdminDashboard() {
  const { adminTab, setAdminTab } = useAppStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchUsers, setSearchUsers] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, catRes, compRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/users'),
        fetch('/api/categories'),
        fetch('/api/complaints'),
      ])
      const statsData = await statsRes.json()
      const usersData = await usersRes.json()
      const catData = await catRes.json()
      const compData = await compRes.json()

      setStats(statsData.data || null)
      setUsers(usersData.data || [])
      setCategories(catData.data || [])
      setComplaints(compData.data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function toggleUserVerification(userId: string, isVerified: boolean) {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !isVerified }),
      })
      loadData()
    } catch (e) { console.error(e) }
  }

  async function toggleUserActive(userId: string, isActive: boolean) {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      loadData()
    } catch (e) { console.error(e) }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = !searchUsers || u.username.includes(searchUsers) || u.email.includes(searchUsers)
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const roleLabel: Record<string, string> = {
    admin: '👑 مدير',
    merchant: '🏪 تاجر',
    service_provider: '🔧 مزود خدمة',
    customer: '👤 زبون',
  }

  const priorityMap: Record<string, { label: string; cls: string }> = {
    high: { label: 'عالية 🔴', cls: 'bg-red-500 text-white' },
    medium: { label: 'متوسطة 🟡', cls: 'bg-yellow-500 text-white' },
    low: { label: 'منخفضة 🟢', cls: 'bg-green-500 text-white' },
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">🛡️</div>
          <div>
            <h1 className="text-2xl font-black">لوحة تحكم الإدارة</h1>
            <p className="text-sm text-gray-500">إدارة شاملة لمنصة DEAL</p>
          </div>
        </div>

        <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as any)} dir="rtl">
          <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-lg font-bold text-xs">📊 الإحصائيات</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg font-bold text-xs">👥 المستخدمين</TabsTrigger>
            <TabsTrigger value="commissions" className="rounded-lg font-bold text-xs">💰 العمولات</TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg font-bold text-xs">📂 الفئات</TabsTrigger>
            <TabsTrigger value="complaints" className="rounded-lg font-bold text-xs">🚨 الشكاوى</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg font-bold text-xs">⚙️ الإعدادات</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: '💰', label: 'إجمالي العمولات', value: formatPrice(stats?.totalCommissions || 0), color: 'from-green-50 to-emerald-50 border-green-200' },
                { icon: '👥', label: 'المستخدمين النشطين', value: (stats?.totalUsers || 0).toString(), color: 'from-blue-50 to-cyan-50 border-blue-200' },
                { icon: '📦', label: 'الطلبات اليومية', value: (stats?.ordersByStatus?.new || 0).toString(), color: 'from-yellow-50 to-amber-50 border-yellow-200' },
                { icon: '🚨', label: 'الشكاوى المفتوحة', value: complaints.filter(c => c.status === 'open').length.toString(), color: 'from-red-50 to-pink-50 border-red-200' },
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

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-black">👥 توزيع المستخدمين</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats?.usersByRole || {}).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="font-bold">{roleLabel[role] || role}</span>
                        <Badge className="bg-blue-100 text-blue-700 font-bold text-lg px-3">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-black">📦 حالة الطلبات</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats?.ordersByStatus || {}).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="font-bold">{status === 'new' ? 'جديد' : status === 'processing' ? 'قيد التجهيز' : status === 'shipped' ? 'تم الشحن' : status === 'delivered' ? 'مكتمل' : 'ملغى'}</span>
                        <Badge className="bg-green-100 text-green-700 font-bold text-lg px-3">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={searchUsers} onChange={e => setSearchUsers(e.target.value)} placeholder="بحث بالاسم أو البريد..." className="pr-9 rounded-xl" />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="merchant">تجار</SelectItem>
                  <SelectItem value="service_provider">مزودو خدمة</SelectItem>
                  <SelectItem value="customer">زبائن</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 max-h-[70vh] overflow-y-auto">
              {filteredUsers.map(u => (
                <Card key={u.id} className="shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                      {u.role === 'admin' ? '👑' : u.role === 'merchant' ? '🏪' : u.role === 'service_provider' ? '🔧' : '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{u.username} {u.storeName && <span className="text-gray-400 text-sm">({u.storeName})</span>}</div>
                      <div className="text-xs text-gray-400">{u.email} {u.wilaya && `• ${u.wilaya}`}</div>
                    </div>
                    <Badge className={`text-xs ${u.role === 'merchant' ? 'bg-green-100 text-green-700' : u.role === 'service_provider' ? 'bg-orange-100 text-orange-700' : u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {roleLabel[u.role]}
                    </Badge>
                    {u.isVerified && <Badge className="bg-blue-50 text-blue-600 text-xs">✅ موثّق</Badge>}
                    {!u.isActive && <Badge className="bg-red-50 text-red-600 text-xs">⏸️ معلّق</Badge>}
                    <div className="flex gap-1">
                      {(u.role === 'merchant' || u.role === 'service_provider') && !u.isVerified && (
                        <Button size="sm" variant="ghost" onClick={() => toggleUserVerification(u.id, u.isVerified)} className="text-blue-500" title="توثيق">
                          <Shield className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => toggleUserActive(u.id, u.isActive)} className={u.isActive ? 'text-red-500' : 'text-green-500'} title={u.isActive ? 'تعليق' : 'تفعيل'}>
                        {u.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Commissions */}
          <TabsContent value="commissions">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 mb-6">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-500 font-bold mb-1">💰 إجمالي العمولات المحصّلة هذا الشهر</div>
                <div className="text-4xl font-black text-green-600 mb-2">{formatPrice(stats?.totalCommissions || 0)}</div>
                <div className="text-sm text-gray-500">نسبة العمولة: 1.5%</div>
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-black mb-2">📊 ملخص مالي</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>إجمالي المبيعات</span><span className="font-bold">{formatPrice((stats?.totalCommissions || 0) / 0.015)}</span></div>
                    <div className="flex justify-between"><span>عمولة المنصة</span><span className="font-bold text-green-600">{formatPrice(stats?.totalCommissions || 0)}</span></div>
                    <div className="flex justify-between border-t pt-2"><span>عدد المعاملات</span><span className="font-bold">{stats?.totalOrders || 0}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <Download className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <h3 className="font-black mb-2">تصدير التقرير</h3>
                  <p className="text-sm text-gray-400 mb-3">تصدير تقرير مالي شهري</p>
                  <button className="btn-3d btn-3d-primary text-sm">📥 تصدير CSV</button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            <h2 className="text-lg font-black mb-4">إدارة الفئات ({categories.length})</h2>
            <div className="grid gap-2">
              {categories.map(cat => (
                <Card key={cat.id} className="shadow-sm">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon || '📁'}</span>
                      <div>
                        <div className="font-bold">{cat.nameAr}</div>
                        <div className="text-xs text-gray-400">{cat.nameFr} • {cat.type === 'product' ? 'منتجات' : 'خدمات'}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost"><FileText className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Complaints */}
          <TabsContent value="complaints">
            <h2 className="text-lg font-black mb-4">الشكاوى والنزاعات ({complaints.length})</h2>
            <div className="grid gap-3">
              {complaints.map(comp => {
                const p = priorityMap[comp.priority] || { label: comp.priority, cls: 'bg-gray-200' }
                return (
                  <Card key={comp.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`${p.cls} font-bold text-xs`}>{p.label}</Badge>
                        <Badge className={comp.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                          {comp.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                        </Badge>
                      </div>
                      <h3 className="font-bold mb-1">{comp.subject}</h3>
                      <p className="text-sm text-gray-500">{comp.description}</p>
                      <div className="flex gap-2 mt-3">
                        <button className="btn-3d btn-3d-primary text-xs py-1.5 px-3">معالجة</button>
                        <button className="btn-3d btn-3d-danger text-xs py-1.5 px-3">إغلاق</button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {complaints.length === 0 && <div className="text-center py-12 text-gray-400"><AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>لا توجد شكاوى مفتوحة</p></div>}
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <div className="grid gap-4">
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-black">⚙️ إعدادات عامة</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div><div className="font-bold">وضع الصيانة</div><div className="text-sm text-gray-400">تعطيل المنصة مؤقتاً</div></div>
                    <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div><div className="font-bold">الإشعارات البريدية</div><div className="text-sm text-gray-400">إرسال إشعارات عبر البريد</div></div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-black">💰 إعدادات العمولة</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="font-bold text-sm">نسبة العمولة الحالية</label>
                    <div className="text-2xl font-black text-green-600">1.5%</div>
                  </div>
                  <div className="text-sm text-gray-400">يمكن تعديل نسبة العمولة مستقبلاً من هنا</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-black">🗄️ الصيانة</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <button className="btn-3d btn-3d-primary w-full">💾 نسخ احتياطي لقاعدة البيانات</button>
                  <button className="btn-3d btn-3d-secondary w-full">📋 سجل الأخطاء</button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
