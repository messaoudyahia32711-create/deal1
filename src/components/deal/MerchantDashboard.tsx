'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type Product, type Order, type Wallet } from '@/lib/store'
import { Package, ShoppingCart, Star, Eye, Plus, Edit, Trash2, ToggleLeft, TrendingUp, Wallet as WalletIcon, ChevronDown, ChevronUp } from 'lucide-react'
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: 'جديد 🔴', cls: 'bg-red-500 text-white' },
    processing: { label: 'قيد التجهيز 🟡', cls: 'bg-yellow-500 text-white' },
    shipped: { label: 'تم الشحن 🔵', cls: 'bg-blue-500 text-white' },
    delivered: { label: 'مكتمل ✅', cls: 'bg-green-500 text-white' },
    cancelled: { label: 'ملغى ❌', cls: 'bg-gray-400 text-white' },
  }
  const s = map[status] || { label: status, cls: 'bg-gray-200' }
  return <Badge className={`${s.cls} font-bold text-xs`}>{s.label}</Badge>
}

export default function MerchantDashboard() {
  const { user, merchantTab, setMerchantTab } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [stats, setStats] = useState({ todaySales: 0, newOrders: 0, rating: 0, views: 0 })
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: string; nameAr: string }[]>([])

  // Add product form
  const [newProd, setNewProd] = useState({ title: '', description: '', price: '', stock: '', categoryId: '' })

  async function loadData() {
    if (!user?.id) return
    setLoading(true)
    try {
      const [prodRes, orderRes, walletRes, catRes] = await Promise.all([
        fetch(`/api/products?merchantId=${user.id}&limit=100`),
        fetch(`/api/orders?userId=${user.id}&role=merchant`),
        fetch(`/api/wallet?merchantId=${user.id}`),
        fetch('/api/categories?type=product'),
      ])
      const prodData = await prodRes.json()
      const orderData = await orderRes.json()
      const walletData = await walletRes.json()
      const catData = await catRes.json()

      setProducts(prodData.data || [])
      setOrders(orderData.data || [])
      setWallet(walletData.data || null)
      setCategories(catData.data || [])

      // Calculate stats
      const delivered = (orderData.data || []).filter((o: Order) => o.status === 'delivered')
      const newOrders = (orderData.data || []).filter((o: Order) => o.status === 'new')
      setStats({
        todaySales: delivered.reduce((s: number, o: Order) => s + o.totalAmount, 0),
        newOrders: newOrders.length,
        rating: 4.8,
        views: 89,
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: user!.id,
          title: newProd.title,
          description: newProd.description,
          price: parseFloat(newProd.price),
          stock: parseInt(newProd.stock),
          categoryId: newProd.categoryId,
          images: '[]',
        }),
      })
      setAddDialogOpen(false)
      setNewProd({ title: '', description: '', price: '', stock: '', categoryId: '' })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const commissionRate = 0.015
  const totalSales = stats.todaySales
  const commission = totalSales * commissionRate
  const netProfit = totalSales - commission

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🏪</div>
          <div>
            <h1 className="text-2xl font-black">لوحة تحكم التاجر</h1>
            <p className="text-sm text-gray-500">{user?.storeName || user?.username}</p>
          </div>
        </div>

        <Tabs value={merchantTab} onValueChange={(v) => setMerchantTab(v as any)} dir="rtl">
          <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-lg font-bold">📊 نظرة عامة</TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg font-bold">📦 المنتجات</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg font-bold">🛒 الطلبات</TabsTrigger>
            <TabsTrigger value="wallet" className="rounded-lg font-bold">💰 المحفظة</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg font-bold">⭐ التقييمات</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: '💰', label: 'مبيعات اليوم', value: formatPrice(stats.todaySales), color: 'from-green-50 to-emerald-50 border-green-200' },
                { icon: '📦', label: 'طلبات جديدة', value: stats.newOrders.toString(), color: 'from-blue-50 to-cyan-50 border-blue-200' },
                { icon: '⭐', label: 'تقييمك', value: stats.rating.toFixed(1), color: 'from-yellow-50 to-amber-50 border-yellow-200' },
                { icon: '👁️', label: 'مشاهدات اليوم', value: stats.views.toString(), color: 'from-purple-50 to-pink-50 border-purple-200' },
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
                  <div>
                    <div className="text-sm text-gray-500 font-bold">إجمالي المبيعات</div>
                    <div className="text-xl font-black">{formatPrice(totalSales)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-bold">عمولة المنصة (1.5%)</div>
                    <div className="text-xl font-black text-red-500">{formatPrice(commission)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-bold">صافي الربح</div>
                    <div className="text-xl font-black text-green-600">{formatPrice(netProfit)}</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded-xl text-center text-sm font-bold text-gray-600">
                  مثال: مبيعات: 10,000 دج → عمولة: 150 دج → صافي: 9,850 دج ✅
                </div>
                {totalSales > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-xl text-center text-sm font-bold text-yellow-700">
                    ⚠️ سيتم خصم {formatPrice(commission)} كعمولة للمنصة
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-4 p-4 bg-white rounded-xl shadow-sm">
              <p className="text-lg font-bold text-green-600">📈 مبيعاتك ارتفعت 12% هذا الأسبوع</p>
            </div>
          </TabsContent>

          {/* Products */}
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black">المنتجات ({products.length})</h2>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <button className="btn-3d btn-3d-primary"><Plus className="w-4 h-4" /> إضافة منتج</button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="font-black">إضافة منتج جديد</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-3">
                    <div><Label className="font-bold">اسم المنتج</Label><Input value={newProd.title} onChange={e => setNewProd(p => ({ ...p, title: e.target.value }))} required className="rounded-xl" /></div>
                    <div><Label className="font-bold">الوصف</Label><Textarea value={newProd.description} onChange={e => setNewProd(p => ({ ...p, description: e.target.value }))} className="rounded-xl" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="font-bold">السعر (دج)</Label><Input type="number" value={newProd.price} onChange={e => setNewProd(p => ({ ...p, price: e.target.value }))} required className="rounded-xl" dir="ltr" /></div>
                      <div><Label className="font-bold">الكمية</Label><Input type="number" value={newProd.stock} onChange={e => setNewProd(p => ({ ...p, stock: e.target.value }))} required className="rounded-xl" dir="ltr" /></div>
                    </div>
                    <div>
                      <Label className="font-bold">الفئة</Label>
                      <Select value={newProd.categoryId} onValueChange={v => setNewProd(p => ({ ...p, categoryId: v }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <button type="submit" className="btn-3d btn-3d-primary w-full">إضافة المنتج</button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3">
              {products.map(product => (
                <Card key={product.id} className="shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">📦</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{product.title}</h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-bold text-green-600">{formatPrice(product.price)}</span>
                        <span className={`font-bold ${product.stock > 10 ? 'stock-green' : product.stock > 0 ? 'stock-orange' : 'stock-red'}`}>
                          المخزون: {product.stock}
                        </span>
                      </div>
                    </div>
                    <Badge className={product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                      {product.status === 'active' ? 'نشط' : 'مخفي'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders">
            <h2 className="text-lg font-black mb-4">الطلبات ({orders.length})</h2>
            <div className="grid gap-3">
              {orders.map(order => (
                <Card key={order.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="text-sm text-gray-500">#{order.id.slice(-6)}</span>
                      </div>
                      <span className="font-black text-green-600">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <div className="text-sm text-gray-500 mb-3">
                      <span>العمولة: {formatPrice(order.commissionAmount)}</span>
                      <span className="mx-2">|</span>
                      <span>الدفع: {order.paymentMethod === 'cod' ? 'عند الاستلام' : order.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'CCP'}</span>
                    </div>
                    {order.items && order.items.map(item => (
                      <div key={item.id} className="text-sm bg-gray-50 rounded-lg p-2 mb-1 flex justify-between">
                        <span>{item.productTitle || `منتج #${item.productId.slice(-6)}`}</span>
                        <span>×{item.quantity} = {formatPrice(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-3">
                      {order.status === 'new' && (
                        <button onClick={() => updateOrderStatus(order.id, 'processing')} className="btn-3d btn-3d-secondary text-xs py-1.5 px-3">بدء التجهيز</button>
                      )}
                      {order.status === 'processing' && (
                        <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="btn-3d btn-3d-primary text-xs py-1.5 px-3">تم الشحن</button>
                      )}
                      {order.status === 'shipped' && (
                        <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="btn-3d btn-3d-primary text-xs py-1.5 px-3">تم التسليم</button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {orders.length === 0 && <div className="text-center py-12 text-gray-400"><Package className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>لا توجد طلبات بعد</p></div>}
            </div>
          </TabsContent>

          {/* Wallet */}
          <TabsContent value="wallet">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 mb-6">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-500 font-bold mb-1">💰 رصيد المحفظة</div>
                <div className="text-4xl font-black text-green-600 mb-4">{formatPrice(wallet?.balance || 0)}</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-xs text-gray-400">إجمالي الأرباح</div><div className="font-bold">{formatPrice(wallet?.totalEarned || 0)}</div></div>
                  <div><div className="text-xs text-gray-400">العمولات المدفوعة</div><div className="font-bold text-red-500">{formatPrice(wallet?.totalCommissionPaid || 0)}</div></div>
                  <div><div className="text-xs text-gray-400">قيد السحب</div><div className="font-bold text-yellow-600">{formatPrice(wallet?.pendingWithdrawal || 0)}</div></div>
                </div>
              </CardContent>
            </Card>
            <button className="btn-3d btn-3d-primary w-full mb-6">طلب سحب الأرباح</button>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <div className="text-center py-12">
              <Star className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-black mb-2">تقييمك: 4.8 ⭐</h3>
              <p className="text-gray-400">بناءً على 24 تقييم</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
