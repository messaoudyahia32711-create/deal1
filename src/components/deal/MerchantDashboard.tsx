'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type Product, type Order, type Wallet } from '@/lib/store'
import { t, formatPrice } from '@/lib/i18n'
import MessagePanel from '@/components/deal/MessagePanel'
import { Package, ShoppingCart, Star, Eye, Plus, Edit, Trash2, ToggleLeft, TrendingUp, Wallet as WalletIcon, ChevronDown, ChevronUp, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function StatusBadge({ status, language }: { status: string; language: 'ar' | 'fr' }) {
  const statusLabels: Record<string, { ar: string; fr: string; cls: string }> = {
    new: { ar: 'جديد 🔴', fr: 'Nouvelle 🔴', cls: 'bg-red-500 text-white' },
    processing: { ar: 'قيد التجهيز 🟡', fr: 'En préparation 🟡', cls: 'bg-yellow-500 text-white' },
    shipped: { ar: 'تم الشحن 🔵', fr: 'Expédiée 🔵', cls: 'bg-blue-500 text-white' },
    delivered: { ar: 'مكتمل ✅', fr: 'Livrée ✅', cls: 'bg-amber-500 text-white' },
    cancelled: { ar: 'ملغى ❌', fr: 'Annulée ❌', cls: 'bg-gray-400 text-white' },
  }
  const s = statusLabels[status] || { ar: status, fr: status, cls: 'bg-gray-200' }
  return <Badge className={`${s.cls} font-bold text-xs`}>{language === 'ar' ? s.ar : s.fr}</Badge>
}

export default function MerchantDashboard() {
  const { user, merchantTab, setMerchantTab, language } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [stats, setStats] = useState({ todaySales: 0, newOrders: 0, rating: 0, views: 0 })
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: string; nameAr: string }[]>([])

  // Add product form
  const [newProd, setNewProd] = useState({ title: '', description: '', price: '', stock: '', categoryId: '', isOnSale: false, salePrice: '' })
  const [prodImages, setProdImages] = useState<File[]>([])
  const [prodImagePreviews, setProdImagePreviews] = useState<string[]>([])
  const [uploadingProd, setUploadingProd] = useState(false)

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
      const imageUrls: string[] = []

      // Upload images if selected
      if (prodImages.length > 0) {
        setUploadingProd(true)
        for (const file of prodImages) {
          const formData = new FormData()
          formData.append('file', file)
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
          const uploadData = await uploadRes.json()
          if (uploadData.data?.url) {
            imageUrls.push(uploadData.data.url)
          }
        }
        setUploadingProd(false)
      }

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
          images: JSON.stringify(imageUrls),
          isOnSale: newProd.isOnSale,
          salePrice: newProd.isOnSale && newProd.salePrice ? parseFloat(newProd.salePrice) : null,
        }),
      })
      setAddDialogOpen(false)
      setNewProd({ title: '', description: '', price: '', stock: '', categoryId: '', isOnSale: false, salePrice: '' })
      setProdImages([])
      setProdImagePreviews([])
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  function handleProdImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const newFiles: File[] = []
    const newPreviews: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      if (file.size > 5 * 1024 * 1024) continue
      newFiles.push(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setProdImagePreviews(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    }
    setProdImages(prev => [...prev, ...newFiles])
  }

  function removeProdImage(index: number) {
    setProdImages(prev => prev.filter((_, i) => i !== index))
    setProdImagePreviews(prev => prev.filter((_, i) => i !== index))
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
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">🏪</div>
          <div>
            <h1 className="text-2xl font-black">{t('merchantPanel', language)}</h1>
            <p className="text-sm text-gray-500">{user?.storeName || user?.username}</p>
          </div>
        </div>

        <Tabs value={merchantTab} onValueChange={(v) => setMerchantTab(v as any)} dir="rtl">
          <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-lg font-bold">📊 {t('overview', language)}</TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg font-bold">📦 {t('products', language)}</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg font-bold">🛒 {t('orders', language)}</TabsTrigger>
            <TabsTrigger value="wallet" className="rounded-lg font-bold">💰 {t('wallet', language)}</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg font-bold">⭐ {t('reviews', language)}</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg font-bold">💬 {t('chat', language)}</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: '💰', label: t('todaySales', language), value: formatPrice(stats.todaySales, language), color: 'from-amber-50 to-yellow-50 border-amber-200' },
                { icon: '📦', label: t('newOrders', language), value: stats.newOrders.toString(), color: 'from-purple-50 to-violet-50 border-purple-200' },
                { icon: '⭐', label: t('yourRating', language), value: stats.rating.toFixed(1), color: 'from-yellow-50 to-amber-50 border-yellow-200' },
                { icon: '👁️', label: t('todayViews', language), value: stats.views.toString(), color: 'from-pink-50 to-rose-50 border-pink-200' },
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
                  <div>
                    <div className="text-sm text-gray-500 font-bold">{t('totalSales', language)}</div>
                    <div className="text-xl font-black">{formatPrice(totalSales, language)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-bold">{t('platformCommission', language)} (1.5%)</div>
                    <div className="text-xl font-black text-red-500">{formatPrice(commission, language)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-bold">{t('netProfit', language)}</div>
                    <div className="text-xl font-black text-amber-600">{formatPrice(netProfit, language)}</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded-xl text-center text-sm font-bold text-gray-600">
                  {language === 'ar' 
                    ? `مثال: مبيعات: 10,000 دج → عمولة: 150 دج → صافي: 9,850 دج ✅`
                    : `Exemple: ventes: 10 000 DA → commission: 150 DA → net: 9 850 DA ✅`
                  }
                </div>
                {totalSales > 0 && (
                  <div className="mt-3 p-2 bg-amber-50 rounded-xl text-center text-sm font-bold text-amber-700">
                    ⚠️ {language === 'ar' 
                      ? `سيتم خصم ${formatPrice(commission, language)} كعمولة للمنصة`
                      : `${formatPrice(commission, language)} sera déduit comme commission plateforme`
                    }
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-4 p-4 bg-white rounded-xl shadow-sm">
              <p className="text-lg font-bold text-amber-600">📈 {language === 'ar' ? 'مبيعاتك ارتفعت 12% هذا الأسبوع' : 'Vos ventes ont augmenté de 12% cette semaine'}</p>
            </div>
          </TabsContent>

          {/* Products */}
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black">{t('products', language)} ({products.length})</h2>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <button className="btn-3d btn-3d-primary"><Plus className="w-4 h-4" /> {t('addProduct', language)}</button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="font-black">{t('addProduct', language)}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-3">
                    <div><Label className="font-bold">{t('productName', language)}</Label><Input value={newProd.title} onChange={e => setNewProd(p => ({ ...p, title: e.target.value }))} required className="rounded-xl" /></div>
                    <div><Label className="font-bold">{t('productDescription', language)}</Label><Textarea value={newProd.description} onChange={e => setNewProd(p => ({ ...p, description: e.target.value }))} className="rounded-xl" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="font-bold">{t('price', language)} ({t('currency', language)})</Label><Input type="number" value={newProd.price} onChange={e => setNewProd(p => ({ ...p, price: e.target.value }))} required className="rounded-xl" dir="ltr" /></div>
                      <div><Label className="font-bold">{t('stock', language)}</Label><Input type="number" value={newProd.stock} onChange={e => setNewProd(p => ({ ...p, stock: e.target.value }))} required className="rounded-xl" dir="ltr" /></div>
                    </div>
                    <div>
                      <Label className="font-bold">{t('category', language)}</Label>
                      <Select value={newProd.categoryId} onValueChange={v => setNewProd(p => ({ ...p, categoryId: v }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Choisir catégorie'} /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {/* Image Upload - Multiple */}
                    <div>
                      <Label className="font-bold">{t('image', language)} ({language === 'ar' ? 'يمكنك اختيار عدة صور' : 'Vous pouvez sélectionner plusieurs photos'})</Label>
                      <div className="mt-1 space-y-2">
                        {/* Image Previews */}
                        {prodImagePreviews.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {prodImagePreviews.map((preview, idx) => (
                              <div key={idx} className="relative">
                                <img src={preview} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-purple-200" />
                                <button
                                  type="button"
                                  onClick={() => removeProdImage(idx)}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Upload button */}
                        <label className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-500">{t('uploadImage', language)}</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleProdImageSelect} />
                        </label>
                      </div>
                    </div>
                    {/* On Sale Toggle */}
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newProd.isOnSale}
                          onChange={e => setNewProd(p => ({ ...p, isOnSale: e.target.checked }))}
                          className="w-4 h-4 accent-yellow-500"
                        />
                        <span className="font-bold text-sm">{t('onSale', language)}</span>
                      </label>
                    </div>
                    {newProd.isOnSale && (
                      <div>
                        <Label className="font-bold">{language === 'ar' ? 'سعر التخفيض' : 'Prix promo'} ({t('currency', language)})</Label>
                        <Input type="number" value={newProd.salePrice} onChange={e => setNewProd(p => ({ ...p, salePrice: e.target.value }))} className="rounded-xl" dir="ltr" />
                      </div>
                    )}
                    <button type="submit" disabled={uploadingProd} className="btn-3d btn-3d-primary w-full disabled:opacity-50">
                      {uploadingProd ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t('addProduct', language)}
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {products.map(product => {
                const hasImage = product.images && product.images.length > 0
                return (
                  <Card key={product.id} className="shadow-sm hover:shadow-md transition overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Product Image */}
                        <div className="w-28 h-28 md:w-36 md:h-36 shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                          {hasImage ? (
                            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-gray-300" />
                            </div>
                          )}
                        </div>
                        {/* Product Details */}
                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-base truncate">{product.title}</h3>
                            <Badge className={product.status === 'active' ? 'bg-green-100 text-green-700 shrink-0' : 'bg-gray-100 text-gray-600 shrink-0'}>
                              {product.status === 'active' ? (language === 'ar' ? 'نشط' : 'Actif') : (language === 'ar' ? 'مخفي' : 'Masqué')}
                            </Badge>
                          </div>
                          {product.description && (
                            <p className="text-xs text-gray-400 line-clamp-1 mb-2">{product.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm mb-2">
                            {product.isOnSale && product.salePrice ? (
                              <div className="flex items-center gap-2">
                                <span className="font-black text-amber-600">{formatPrice(product.salePrice, language)}</span>
                                <span className="text-xs text-gray-400 line-through">{formatPrice(product.price, language)}</span>
                                <Badge className="bg-red-100 text-red-600 text-[10px] px-1.5">-{Math.round(((product.price - product.salePrice) / product.price) * 100)}%</Badge>
                              </div>
                            ) : (
                              <span className="font-black text-amber-600">{formatPrice(product.price, language)}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                                {t('stock', language)}: {product.stock}
                              </span>
                              {hasImage && product.images.length > 1 && (
                                <span className="text-xs text-gray-400">📷 {product.images.length}</span>
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

          {/* Orders */}
          <TabsContent value="orders">
            <h2 className="text-lg font-black mb-4">{t('orders', language)} ({orders.length})</h2>
            <div className="grid gap-3">
              {orders.map(order => (
                <Card key={order.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} language={language} />
                        <span className="text-sm text-gray-500">#{order.id.slice(-6)}</span>
                      </div>
                      <span className="font-black text-amber-600">{formatPrice(order.totalAmount, language)}</span>
                    </div>
                    <div className="text-sm text-gray-500 mb-3">
                      <span>{t('commission', language)}: {formatPrice(order.commissionAmount, language)}</span>
                      <span className="mx-2">|</span>
                      <span>{t('paymentMethod', language)}: {order.paymentMethod === 'cod' ? t('cod', language) : order.paymentMethod === 'bank_transfer' ? t('bankTransfer', language) : t('ccp', language)}</span>
                    </div>
                    {order.items && order.items.map(item => (
                      <div key={item.id} className="text-sm bg-gray-50 rounded-lg p-2 mb-1 flex justify-between">
                        <span>{item.productTitle || `${t('products', language)} #${item.productId.slice(-6)}`}</span>
                        <span>×{item.quantity} = {formatPrice(item.unitPrice * item.quantity, language)}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-3">
                      {order.status === 'new' && (
                        <button onClick={() => updateOrderStatus(order.id, 'processing')} className="btn-3d btn-3d-secondary text-xs py-1.5 px-3">{language === 'ar' ? 'بدء التجهيز' : 'Commencer la préparation'}</button>
                      )}
                      {order.status === 'processing' && (
                        <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="btn-3d btn-3d-primary text-xs py-1.5 px-3">{language === 'ar' ? 'تم الشحن' : 'Expédiée'}</button>
                      )}
                      {order.status === 'shipped' && (
                        <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="btn-3d btn-3d-primary text-xs py-1.5 px-3">{language === 'ar' ? 'تم التسليم' : 'Livrée'}</button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {orders.length === 0 && <div className="text-center py-12 text-gray-400"><Package className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>{language === 'ar' ? 'لا توجد طلبات بعد' : 'Aucune commande pour le moment'}</p></div>}
            </div>
          </TabsContent>

          {/* Wallet */}
          <TabsContent value="wallet">
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 mb-6">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-500 font-bold mb-1">💰 {t('balance', language)}</div>
                <div className="text-4xl font-black text-amber-600 mb-4">{formatPrice(wallet?.balance || 0, language)}</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-xs text-gray-400">{t('totalEarned', language)}</div><div className="font-bold">{formatPrice(wallet?.totalEarned || 0, language)}</div></div>
                  <div><div className="text-xs text-gray-400">{t('commissionPaid', language)}</div><div className="font-bold text-red-500">{formatPrice(wallet?.totalCommissionPaid || 0, language)}</div></div>
                  <div><div className="text-xs text-gray-400">{t('pendingWithdrawal', language)}</div><div className="font-bold text-yellow-600">{formatPrice(wallet?.pendingWithdrawal || 0, language)}</div></div>
                </div>
              </CardContent>
            </Card>
            <button className="btn-3d btn-3d-primary w-full mb-6">{t('withdrawRequest', language)}</button>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <div className="text-center py-12">
              <Star className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-black mb-2">{t('yourRating', language)}: 4.8 ⭐</h3>
              <p className="text-gray-400">{language === 'ar' ? 'بناءً على 24 تقييم' : 'Basé sur 24 avis'}</p>
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
