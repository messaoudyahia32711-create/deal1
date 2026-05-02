'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { t, formatPrice } from '@/lib/i18n'
import MessagePanel from '@/components/deal/MessagePanel'
import { Users, DollarSign, Package, AlertTriangle, TrendingUp, Shield, Settings, Download, Eye, Ban, CheckCircle, Search, FileText, Bell, Plus, Pencil, Trash2, X, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

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
  _count?: {
    products: number
    services: number
  }
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

const roleLabels: Record<string, { ar: string; fr: string }> = {
  admin: { ar: '👑 مدير', fr: '👑 Admin' },
  merchant: { ar: '🏪 تاجر', fr: '🏪 Commerçant' },
  service_provider: { ar: '🔧 مزود خدمة', fr: '🔧 Prestataire' },
  customer: { ar: '👤 زبون', fr: '👤 Client' },
}

const priorityLabels: Record<string, { ar: string; fr: string; cls: string }> = {
  high: { ar: 'عالية 🔴', fr: 'Haute 🔴', cls: 'bg-red-500 text-white' },
  medium: { ar: 'متوسطة 🟡', fr: 'Moyenne 🟡', cls: 'bg-yellow-500 text-white' },
  low: { ar: 'منخفضة 🟢', fr: 'Basse 🟢', cls: 'bg-amber-500 text-white' },
}

export default function AdminDashboard() {
  const { adminTab, setAdminTab, user, language } = useAppStore()
  const { toast } = useToast()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchUsers, setSearchUsers] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const isArabic = language === 'ar'

  // Category management state
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [catForm, setCatForm] = useState({ nameAr: '', nameFr: '', icon: '📁', type: 'product' })
  const [catFilterType, setCatFilterType] = useState<'all' | 'product' | 'service'>('all')
  const [catSearch, setCatSearch] = useState('')
  const [catSubmitting, setCatSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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

  // Category CRUD functions
  function openAddCategoryDialog() {
    setEditingCategory(null)
    setCatForm({ nameAr: '', nameFr: '', icon: '📁', type: 'product' })
    setCatDialogOpen(true)
  }

  function openEditCategoryDialog(cat: CategoryItem) {
    setEditingCategory(cat)
    setCatForm({ nameAr: cat.nameAr, nameFr: cat.nameFr || '', icon: cat.icon || '📁', type: cat.type })
    setCatDialogOpen(true)
  }

  async function handleCategorySubmit() {
    if (!catForm.nameAr.trim()) {
      toast({ title: isArabic ? 'خطأ' : 'Erreur', description: isArabic ? 'اسم الصنف بالعربية مطلوب' : 'Le nom arabe est requis', variant: 'destructive' })
      return
    }
    setCatSubmitting(true)
    try {
      if (editingCategory) {
        // Update
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(catForm),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error')
        }
        toast({ title: isArabic ? 'تم التحديث' : 'Mis à jour', description: isArabic ? 'تم تحديث الصنف بنجاح' : 'Catégorie mise à jour avec succès' })
      } else {
        // Create
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(catForm),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error')
        }
        toast({ title: isArabic ? 'تمت الإضافة' : 'Ajoutée', description: isArabic ? 'تم إضافة الصنف بنجاح' : 'Catégorie ajoutée avec succès' })
      }
      setCatDialogOpen(false)
      loadData()
    } catch (e: any) {
      toast({ title: isArabic ? 'خطأ' : 'Erreur', description: e.message || (isArabic ? 'حدث خطأ' : 'Une erreur est survenue'), variant: 'destructive' })
    }
    setCatSubmitting(false)
  }

  async function handleDeleteCategory(id: string) {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error')
      }
      toast({ title: isArabic ? 'تم الحذف' : 'Supprimée', description: isArabic ? 'تم حذف الصنف بنجاح' : 'Catégorie supprimée avec succès' })
      setDeleteConfirmId(null)
      loadData()
    } catch (e: any) {
      toast({ title: isArabic ? 'خطأ' : 'Erreur', description: e.message || (isArabic ? 'لا يمكن حذف هذا الصنف' : 'Impossible de supprimer cette catégorie'), variant: 'destructive' })
      setDeleteConfirmId(null)
    }
  }

  const filteredCategories = categories.filter(c => {
    const matchType = catFilterType === 'all' || c.type === catFilterType
    const matchSearch = !catSearch || c.nameAr.includes(catSearch) || (c.nameFr && c.nameFr.toLowerCase().includes(catSearch.toLowerCase()))
    return matchType && matchSearch
  })

  const productCatCount = categories.filter(c => c.type === 'product').length
  const serviceCatCount = categories.filter(c => c.type === 'service').length

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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">🛡️</div>
          <div>
            <h1 className="text-2xl font-black">{t('adminPanel', language)}</h1>
            <p className="text-sm text-gray-500">{isArabic ? 'إدارة شاملة لمنصة DEAL' : 'Gestion complète de la plateforme DEAL'}</p>
          </div>
        </div>

        <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as any)} dir="rtl">
          <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-lg font-bold text-xs">📊 {t('overview', language)}</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg font-bold text-xs">👥 {t('users', language)}</TabsTrigger>
            <TabsTrigger value="commissions" className="rounded-lg font-bold text-xs">💰 {t('commissions', language)}</TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg font-bold text-xs">📂 {t('categories', language)}</TabsTrigger>
            <TabsTrigger value="complaints" className="rounded-lg font-bold text-xs">🚨 {t('complaints', language)}</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg font-bold text-xs">⚙️ {t('settings', language)}</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg font-bold text-xs">💬 {t('chat', language)}</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: '💰', label: t('totalCommissions', language), value: formatPrice(stats?.totalCommissions || 0, language), color: 'from-amber-50 to-yellow-50 border-amber-200' },
                { icon: '👥', label: t('activeUsers', language), value: (stats?.totalUsers || 0).toString(), color: 'from-purple-50 to-violet-50 border-purple-200' },
                { icon: '📦', label: t('dailyOrders', language), value: (stats?.ordersByStatus?.new || 0).toString(), color: 'from-yellow-50 to-amber-50 border-yellow-200' },
                { icon: '🚨', label: t('openComplaints', language), value: complaints.filter(c => c.status === 'open').length.toString(), color: 'from-pink-50 to-rose-50 border-pink-200' },
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
                <CardHeader><CardTitle className="font-black">👥 {isArabic ? 'توزيع المستخدمين' : 'Répartition des utilisateurs'}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats?.usersByRole || {}).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="font-bold">{isArabic ? roleLabels[role]?.ar || role : roleLabels[role]?.fr || role}</span>
                        <Badge className="bg-purple-100 text-purple-700 font-bold text-lg px-3">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-black">📦 {isArabic ? 'حالة الطلبات' : 'Statut des commandes'}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats?.ordersByStatus || {}).map(([status, count]) => {
                      const statusLabelMap: Record<string, { ar: string; fr: string }> = {
                        new: { ar: 'جديد', fr: 'Nouvelle' },
                        processing: { ar: 'قيد التجهيز', fr: 'En préparation' },
                        shipped: { ar: 'تم الشحن', fr: 'Expédiée' },
                        delivered: { ar: 'مكتمل', fr: 'Livrée' },
                        cancelled: { ar: 'ملغى', fr: 'Annulée' },
                      }
                      const sl = statusLabelMap[status] || { ar: status, fr: status }
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <span className="font-bold">{isArabic ? sl.ar : sl.fr}</span>
                          <Badge className="bg-amber-100 text-amber-700 font-bold text-lg px-3">{count as number}</Badge>
                        </div>
                      )
                    })}
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
                <Input value={searchUsers} onChange={e => setSearchUsers(e.target.value)} placeholder={isArabic ? 'بحث بالاسم أو البريد...' : 'Rechercher par nom ou e-mail...'} className="pr-9 rounded-xl" />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all', language)}</SelectItem>
                  <SelectItem value="merchant">{isArabic ? 'تجار' : 'Commerçants'}</SelectItem>
                  <SelectItem value="service_provider">{isArabic ? 'مزودو خدمة' : 'Prestataires'}</SelectItem>
                  <SelectItem value="customer">{isArabic ? 'زبائن' : 'Clients'}</SelectItem>
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
                    <Badge className={`text-xs ${u.role === 'merchant' ? 'bg-amber-100 text-amber-700' : u.role === 'service_provider' ? 'bg-purple-100 text-purple-700' : u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isArabic ? roleLabels[u.role]?.ar || u.role : roleLabels[u.role]?.fr || u.role}
                    </Badge>
                    {u.isVerified && <Badge className="bg-amber-50 text-amber-600 text-xs">✅ {t('verified', language)}</Badge>}
                    {!u.isActive && <Badge className="bg-red-50 text-red-600 text-xs">⏸️ {t('suspended', language)}</Badge>}
                    <div className="flex gap-1">
                      {(u.role === 'merchant' || u.role === 'service_provider') && !u.isVerified && (
                        <Button size="sm" variant="ghost" onClick={() => toggleUserVerification(u.id, u.isVerified)} className="text-amber-500" title={t('verified', language)}>
                          <Shield className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => toggleUserActive(u.id, u.isActive)} className={u.isActive ? 'text-red-500' : 'text-amber-500'} title={u.isActive ? (isArabic ? 'تعليق' : 'Suspendre') : (isArabic ? 'تفعيل' : 'Activer')}>
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
            <Card className="bg-gradient-to-br from-amber-50 via-purple-50 to-yellow-50 border-2 border-amber-300 mb-6">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-500 font-bold mb-1">💰 {isArabic ? 'إجمالي العمولات المحصّلة هذا الشهر' : 'Total des commissions collectées ce mois'}</div>
                <div className="text-4xl font-black text-amber-600 mb-2">{formatPrice(stats?.totalCommissions || 0, language)}</div>
                <div className="text-sm text-gray-500">{t('commissionRate', language)}: 1.5%</div>
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-black mb-2">📊 {t('financialSummary', language)}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>{t('totalSales', language)}</span><span className="font-bold">{formatPrice((stats?.totalCommissions || 0) / 0.015, language)}</span></div>
                    <div className="flex justify-between"><span>{t('platformCommission', language)}</span><span className="font-bold text-amber-600">{formatPrice(stats?.totalCommissions || 0, language)}</span></div>
                    <div className="flex justify-between border-t pt-2"><span>{t('transactionsCount', language)}</span><span className="font-bold">{stats?.totalOrders || 0}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <Download className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <h3 className="font-black mb-2">{t('exportReport', language)}</h3>
                  <p className="text-sm text-gray-400 mb-3">{isArabic ? 'تصدير تقرير مالي شهري' : 'Exporter un rapport financier mensuel'}</p>
                  <button className="btn-3d btn-3d-primary text-sm">📥 {t('exportCSV', language)}</button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-black text-yellow-700">{categories.length}</div>
                  <div className="text-xs text-yellow-600 font-bold">{isArabic ? 'إجمالي الأصناف' : 'Total catégories'}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-black text-purple-700">{productCatCount}</div>
                  <div className="text-xs text-purple-600 font-bold">{isArabic ? 'أصناف المنتجات' : 'Catégories produits'}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-black text-blue-700">{serviceCatCount}</div>
                  <div className="text-xs text-blue-600 font-bold">{isArabic ? 'أصناف الخدمات' : 'Catégories services'}</div>
                </CardContent>
              </Card>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder={isArabic ? 'بحث في الأصناف...' : 'Rechercher catégories...'} className="pr-9 rounded-xl" />
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button onClick={() => setCatFilterType('all')} className={`px-3 py-1.5 rounded-lg font-bold text-sm transition ${catFilterType === 'all' ? 'bg-yellow-500 text-white shadow-md' : 'hover:bg-gray-200'}`}>
                  {t('all', language)}
                </button>
                <button onClick={() => setCatFilterType('product')} className={`px-3 py-1.5 rounded-lg font-bold text-sm transition ${catFilterType === 'product' ? 'bg-yellow-500 text-white shadow-md' : 'hover:bg-gray-200'}`}>
                  📦 {isArabic ? 'منتجات' : 'Produits'}
                </button>
                <button onClick={() => setCatFilterType('service')} className={`px-3 py-1.5 rounded-lg font-bold text-sm transition ${catFilterType === 'service' ? 'bg-purple-500 text-white shadow-md' : 'hover:bg-gray-200'}`}>
                  🔧 {isArabic ? 'خدمات' : 'Services'}
                </button>
              </div>
              <Button onClick={openAddCategoryDialog} className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-md">
                <Plus className="w-4 h-4 ml-1" />
                {isArabic ? 'إضافة صنف جديد' : 'Ajouter catégorie'}
              </Button>
            </div>

            {/* Categories List */}
            <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
              {filteredCategories.map(cat => (
                <Card key={cat.id} className="shadow-sm hover:shadow-md transition">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon || '📁'}</span>
                      <div>
                        <div className="font-bold">{isArabic ? cat.nameAr : (cat.nameFr || cat.nameAr)}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{cat.nameFr}</span>
                          <span>•</span>
                          <Badge className={`text-[10px] px-1.5 py-0 ${cat.type === 'product' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'}`}>
                            {cat.type === 'product' ? (isArabic ? 'منتجات' : 'Produit') : (isArabic ? 'خدمات' : 'Service')}
                          </Badge>
                          {(cat._count?.products || cat._count?.services) ? (
                            <span className="text-gray-500">
                              ({cat._count?.products || 0} {isArabic ? 'منتج' : 'prod'} {cat._count?.services ? `• ${cat._count.services} ${isArabic ? 'خدمة' : 'serv'}` : ''})
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditCategoryDialog(cat)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50" title={isArabic ? 'تعديل' : 'Modifier'}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {deleteConfirmId === cat.id ? (
                        <div className="flex gap-1 items-center">
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-xs">
                            {isArabic ? 'تأكيد' : 'Confirmer'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)} className="text-gray-500 hover:text-gray-700">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(cat.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50" title={isArabic ? 'حذف' : 'Supprimer'}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredCategories.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>{isArabic ? 'لا توجد أصناف' : 'Aucune catégorie trouvée'}</p>
                </div>
              )}
            </div>

            {/* Add/Edit Category Dialog */}
            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
              <DialogContent className="sm:max-w-md" dir={isArabic ? 'rtl' : 'ltr'}>
                <DialogHeader>
                  <DialogTitle className="font-black text-xl">
                    {editingCategory
                      ? (isArabic ? '✏️ تعديل الصنف' : '✏️ Modifier la catégorie')
                      : (isArabic ? '➕ إضافة صنف جديد' : '➕ Ajouter une catégorie')
                    }
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="font-bold">{isArabic ? 'اسم الصنف بالعربية *' : 'Nom en arabe *'}</Label>
                    <Input
                      value={catForm.nameAr}
                      onChange={e => setCatForm({ ...catForm, nameAr: e.target.value })}
                      placeholder={isArabic ? 'مثال: حرف يدوية' : 'Ex: Artisanat'}
                      dir="rtl"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">{isArabic ? 'اسم الصنف بالفرنسية' : 'Nom en français'}</Label>
                    <Input
                      value={catForm.nameFr}
                      onChange={e => setCatForm({ ...catForm, nameFr: e.target.value })}
                      placeholder={isArabic ? 'مثال: Artisanat' : 'Ex: Artisanat'}
                      dir="ltr"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">{isArabic ? 'الأيقونة (إيموجي)' : 'Icône (emoji)'}</Label>
                    <Input
                      value={catForm.icon}
                      onChange={e => setCatForm({ ...catForm, icon: e.target.value })}
                      placeholder="🧶"
                      className="rounded-xl w-20 text-center text-2xl"
                      maxLength={4}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {['📁', '📦', '🛒', '📺', '📱', '💻', '👔', '👗', '🏠', '🪑', '✨', '💍', '🧵', '🏺', '🥿', '🌿', '🍯', '📚', '🔧', '⚽', '👶', '🧶', '🎨', '🪚', '🚚', '🚗', '💇', '🍳', '📖', '⚙️', '🌱', '📸', '🛠️', '📊', '🖨️', '🏡', '🫖', '❄️', '⚡', '🧹'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setCatForm({ ...catForm, icon: emoji })}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-gray-100 transition ${catForm.icon === emoji ? 'bg-yellow-100 ring-2 ring-yellow-400' : ''}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">{isArabic ? 'نوع الصنف *' : 'Type de catégorie *'}</Label>
                    <Select value={catForm.type} onValueChange={v => setCatForm({ ...catForm, type: v })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">📦 {isArabic ? 'منتجات' : 'Produits'}</SelectItem>
                        <SelectItem value="service">🔧 {isArabic ? 'خدمات' : 'Services'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-xl">{isArabic ? 'إلغاء' : 'Annuler'}</Button>
                  </DialogClose>
                  <Button
                    onClick={handleCategorySubmit}
                    disabled={catSubmitting || !catForm.nameAr.trim()}
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold rounded-xl"
                  >
                    {catSubmitting ? '...' : (editingCategory ? (isArabic ? 'حفظ التعديلات' : 'Enregistrer') : (isArabic ? 'إضافة الصنف' : 'Ajouter'))}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Complaints */}
          <TabsContent value="complaints">
            <h2 className="text-lg font-black mb-4">{t('complaints', language)} ({complaints.length})</h2>
            <div className="grid gap-3">
              {complaints.map(comp => {
                const p = priorityLabels[comp.priority] || { ar: comp.priority, fr: comp.priority, cls: 'bg-gray-200' }
                return (
                  <Card key={comp.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`${p.cls} font-bold text-xs`}>{isArabic ? p.ar : p.fr}</Badge>
                        <Badge className={comp.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {comp.status === 'open' ? (isArabic ? 'مفتوحة' : 'Ouverte') : (isArabic ? 'مغلقة' : 'Fermée')}
                        </Badge>
                      </div>
                      <h3 className="font-bold mb-1">{comp.subject}</h3>
                      <p className="text-sm text-gray-500">{comp.description}</p>
                      <div className="flex gap-2 mt-3">
                        <button className="btn-3d btn-3d-primary text-xs py-1.5 px-3">{t('process', language)}</button>
                        <button className="btn-3d btn-3d-danger text-xs py-1.5 px-3">{t('close', language)}</button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {complaints.length === 0 && <div className="text-center py-12 text-gray-400"><AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>{isArabic ? 'لا توجد شكاوى مفتوحة' : 'Aucune plainte ouverte'}</p></div>}
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <div className="grid gap-4">
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-black">⚙️ {t('generalSettings', language)}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div><div className="font-bold">{t('maintenanceMode', language)}</div><div className="text-sm text-gray-400">{isArabic ? 'تعطيل المنصة مؤقتاً' : 'Désactiver la plateforme temporairement'}</div></div>
                    <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div><div className="font-bold">{t('emailNotifications', language)}</div><div className="text-sm text-gray-400">{isArabic ? 'إرسال إشعارات عبر البريد' : 'Envoyer des notifications par e-mail'}</div></div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-black">💰 {t('commissionSettings', language)}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="font-bold text-sm">{t('currentRate', language)}</label>
                    <div className="text-2xl font-black text-amber-600">1.5%</div>
                  </div>
                  <div className="text-sm text-gray-400">{isArabic ? 'يمكن تعديل نسبة العمولة مستقبلاً من هنا' : 'Le taux de commission peut être modifié ultérieurement ici'}</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-black">🗄️ {t('maintenance', language)}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <button className="btn-3d btn-3d-primary w-full">💾 {t('backup', language)}</button>
                  <button className="btn-3d btn-3d-secondary w-full">📋 {t('errorLog', language)}</button>
                </CardContent>
              </Card>
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
