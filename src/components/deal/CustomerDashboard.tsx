'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type Order, type Product } from '@/lib/store'
import { t, formatPrice } from '@/lib/i18n'
import { ShoppingCart, Package, Heart, MessageCircle, Star, Plus, Minus, Trash2, CreditCard, MapPin, Truck, CheckCircle, Clock, Home } from 'lucide-react'
import MessagePanel from '@/components/deal/MessagePanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const orderStatusMap: Record<string, { icon: string; cls: string }> = {
  new: { icon: '📦', cls: 'bg-red-100 text-red-700 border-red-200' },
  processing: { icon: '⚙️', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  shipped: { icon: '🚚', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  delivered: { icon: '✅', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  cancelled: { icon: '❌', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
}

function getOrderStatusLabel(status: string, language: 'ar' | 'fr'): string {
  const key = status as keyof typeof import('@/lib/i18n').translations.ar.orderStatus
  try {
    const statusMap = language === 'ar' 
      ? import('@/lib/i18n').translations.ar.orderStatus 
      : import('@/lib/i18n').translations.fr.orderStatus
    return (statusMap as Record<string, string>)[status] || status
  } catch {
    return status
  }
}

export default function CustomerDashboard() {
  const { user, customerTab, setCustomerTab, cart, removeFromCart, updateCartQuantity, clearCart, cartTotal, setCurrentView, language } = useAppStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [reviewDialogId, setReviewDialogId] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  async function loadOrders() {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/orders?userId=${user.id}&role=customer`)
      const data = await res.json()
      setOrders(data.data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [user?.id])

  async function handleCheckout() {
    try {
      // Group cart items by merchant
      const merchantItems: Record<string, { productId: string; quantity: number }[]> = {}
      cart.forEach(item => {
        const mid = item.product.merchantId
        if (!merchantItems[mid]) merchantItems[mid] = []
        merchantItems[mid].push({ productId: item.product.id, quantity: item.quantity })
      })

      // Create one order per merchant
      for (const [merchantId, items] of Object.entries(merchantItems)) {
        const totalAmount = items.reduce((sum, item) => {
          const p = cart.find(c => c.product.id === item.productId)?.product
          const price = p?.isOnSale && p?.salePrice ? p.salePrice : (p?.price || 0)
          return sum + price * item.quantity
        }, 0)

        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: user!.id,
            merchantId,
            items,
            paymentMethod,
            deliveryAddress: deliveryAddress || user?.address || (language === 'ar' ? 'الجزائر' : 'Alger'),
          }),
        })
      }

      clearCart()
      setOrderSuccess(true)
      setTimeout(() => { setOrderSuccess(false); setCustomerTab('orders') }, 2000)
      loadOrders()
    } catch (e) {
      console.error(e)
    }
  }

  async function submitReview(targetId: string) {
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId: user!.id,
          targetId,
          targetType: 'merchant',
          rating: reviewRating,
          comment: reviewComment,
        }),
      })
      setReviewDialogId(null)
      setReviewComment('')
      setReviewRating(5)
    } catch (e) {
      console.error(e)
    }
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const total = cartTotal()

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">👤</div>
          <div>
            <h1 className="text-2xl font-black">{language === 'ar' ? 'مرحباً' : 'Bonjour'} {user?.username} 👋</h1>
            <p className="text-sm text-gray-500">
              {orders.filter(o => o.status === 'shipped').length > 0
                ? (language === 'ar' 
                    ? `لديك ${orders.filter(o => o.status === 'shipped').length} طلب قيد التوصيل` 
                    : `Vous avez ${orders.filter(o => o.status === 'shipped').length} commande(s) en livraison`)
                : (language === 'ar' ? 'تسوق واستمتع!' : 'Achetez et profitez !')
              }
            </p>
          </div>
        </div>

        <Tabs value={customerTab} onValueChange={(v) => setCustomerTab(v as any)} dir="rtl">
          <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-lg font-bold">🏠 {t('home', language)}</TabsTrigger>
            <TabsTrigger value="cart" className="rounded-lg font-bold">🛒 {t('cart', language)} {cartCount > 0 && <Badge className="mr-1 bg-red-500 text-white text-xs">{cartCount}</Badge>}</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg font-bold">📦 {t('orders', language)}</TabsTrigger>
            <TabsTrigger value="favorites" className="rounded-lg font-bold">❤️ {t('favorites', language)}</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg font-bold">💬 {t('chat', language)}</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: '📦', label: t('orders', language), value: orders.length.toString(), color: 'from-purple-50 to-violet-50 border-purple-200', action: () => setCustomerTab('orders') },
                { icon: '❤️', label: t('favorites', language), value: '0', color: 'from-pink-50 to-rose-50 border-pink-200', action: () => setCustomerTab('favorites') },
                { icon: '💬', label: t('chat', language), value: '0', color: 'from-amber-50 to-yellow-50 border-amber-200', action: () => setCustomerTab('chat') },
                { icon: '⭐', label: language === 'ar' ? 'نقاط مكتسبة' : 'Points gagnés', value: '120', color: 'from-yellow-50 to-amber-50 border-yellow-200', action: () => {} },
              ].map((card, i) => (
                <Card key={i} className={`bg-gradient-to-br ${card.color} border-2 cursor-pointer hover:shadow-md transition`} onClick={card.action}>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-1">{card.icon}</div>
                    <div className="text-2xl font-black">{card.value}</div>
                    <div className="text-xs text-gray-500 font-bold">{card.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-black mb-2">🛍️ {language === 'ar' ? 'تابع التسوق' : 'Continuez vos achats'}</h3>
                <p className="text-gray-400 mb-4">{language === 'ar' ? 'اكتشف أحدث المنتجات والخدمات' : 'Découvrez les derniers produits et services'}</p>
                <button onClick={() => setCurrentView('home')} className="btn-3d btn-3d-primary">{t('browseProducts', language)}</button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cart */}
          <TabsContent value="cart">
            {orderSuccess && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4 text-center">
                <CheckCircle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <p className="font-bold text-amber-700">{language === 'ar' ? 'تم تأكيد طلبك بنجاح! 🎉' : 'Votre commande a été confirmée ! 🎉'}</p>
              </div>
            )}
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-400">{language === 'ar' ? 'السلة فارغة' : 'Le panier est vide'}</h3>
                <button onClick={() => setCurrentView('home')} className="btn-3d btn-3d-primary mt-4">{t('shopNow', language)}</button>
              </div>
            ) : (
              <>
                <div className="grid gap-3 mb-4">
                  {cart.map(item => {
                    const price = item.product.isOnSale && item.product.salePrice ? item.product.salePrice : item.product.price
                    return (
                      <Card key={item.product.id} className="shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">📦</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold truncate">{item.product.title}</h3>
                            <span className="font-bold text-amber-600 text-sm">{formatPrice(price, language)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold w-8 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center hover:bg-amber-200">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="font-black text-amber-600 w-24 text-left">{formatPrice(price * item.quantity, language)}</span>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Checkout */}
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-black mb-4">💳 {t('checkout', language)}</h3>
                    <div className="space-y-3 mb-4">
                      <div>
                        <Label className="font-bold">{t('deliveryAddress', language)}</Label>
                        <Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder={language === 'ar' ? 'أدخل عنوانك الكامل مع الولاية' : 'Entrez votre adresse complète avec la wilaya'} className="rounded-xl" />
                      </div>
                      <div>
                        <Label className="font-bold">{t('paymentMethod', language)}</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cod">💵 {t('cod', language)}</SelectItem>
                            <SelectItem value="ccp">📮 {t('ccp', language)}</SelectItem>
                            <SelectItem value="bank_transfer">🏦 {t('bankTransfer', language)}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="border-t pt-3 space-y-1">
                      <div className="flex justify-between text-sm"><span>{t('subtotal', language)}</span><span className="font-bold">{formatPrice(total, language)}</span></div>
                      <div className="flex justify-between text-sm"><span>{t('deliveryFee', language)}</span><span className="font-bold text-amber-600">{t('free', language)}</span></div>
                      <div className="flex justify-between text-lg font-black border-t pt-2"><span>{t('total', language)}</span><span className="text-amber-600">{formatPrice(total, language)}</span></div>
                    </div>
                    <button onClick={handleCheckout} className="btn-3d btn-3d-primary w-full mt-4 text-lg">
                      <CreditCard className="w-5 h-5" /> {language === 'ar' ? 'تأكيد الطلب' : 'Confirmer la commande'}
                    </button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders">
            <h2 className="text-lg font-black mb-4">{t('orders', language)} ({orders.length})</h2>
            <div className="grid gap-3">
              {orders.map(order => {
                const st = orderStatusMap[order.status] || { icon: '❓', cls: 'bg-gray-100' }
                return (
                  <Card key={order.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{st.icon}</span>
                          <div>
                            <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${st.cls}`}>{getOrderStatusLabel(order.status, language)}</div>
                            <div className="text-xs text-gray-400 mt-1">#{order.id.slice(-6)}</div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-black text-amber-600">{formatPrice(order.totalAmount, language)}</div>
                          <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}</div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center justify-between mb-3 px-2">
                        {['new', 'processing', 'shipped', 'delivered'].map((s, i) => {
                          const sInfo = orderStatusMap[s]
                          const isActive = ['new', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= i
                          return (
                            <div key={s} className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isActive ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                {isActive ? '✓' : (i + 1)}
                              </div>
                              <span className="text-[10px] text-gray-400 mt-1">{getOrderStatusLabel(s, language)}</span>
                            </div>
                          )
                        })}
                      </div>

                      {order.items && order.items.map(item => (
                        <div key={item.id} className="text-sm bg-gray-50 rounded-lg p-2 mb-1 flex justify-between">
                          <span>{item.productTitle || (language === 'ar' ? 'منتج' : 'Produit')}</span>
                          <span>×{item.quantity}</span>
                        </div>
                      ))}

                      {order.status === 'delivered' && (
                        <button onClick={() => setReviewDialogId(order.merchantId)} className="btn-3d btn-3d-secondary text-xs py-1.5 px-3 mt-2 w-full">
                          ⭐ {t('addReview', language)}
                        </button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
              {orders.length === 0 && <div className="text-center py-12 text-gray-400"><Package className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>{language === 'ar' ? 'لا توجد طلبات بعد' : 'Aucune commande pour le moment'}</p></div>}
            </div>

            {/* Review Dialog */}
            {reviewDialogId && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-sm">
                  <CardContent className="p-6" dir="rtl">
                    <h3 className="font-black text-lg mb-4">⭐ {t('addReview', language)}</h3>
                    <div className="flex justify-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setReviewRating(n)} className="text-3xl transition">
                          {n <= reviewRating ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                    <Textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder={language === 'ar' ? 'اكتب تعليقك (اختياري)' : 'Écrivez votre commentaire (optionnel)'} className="rounded-xl mb-4" />
                    <div className="flex gap-2">
                      <button onClick={() => submitReview(reviewDialogId)} className="btn-3d btn-3d-primary flex-1">{t('submitReview', language)}</button>
                      <button onClick={() => setReviewDialogId(null)} className="btn-3d btn-3d-outline flex-1">{t('cancel', language)}</button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites">
            <div className="text-center py-16">
              <Heart className="w-16 h-16 mx-auto text-red-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-400">{language === 'ar' ? 'لا توجد مفضلات بعد' : 'Aucun favori pour le moment'}</h3>
              <p className="text-gray-300 mt-2">{language === 'ar' ? 'أضف منتجات لمفضلتك أثناء التصفح' : 'Ajoutez des produits à vos favoris pendant la navigation'}</p>
            </div>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat">
            {user ? (
              <MessagePanel userId={user.id} userRole={user.role} language={language} />
            ) : (
              <div className="text-center py-16">
                <MessageCircle className="w-16 h-16 mx-auto text-amber-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-400">{t('noConversations', language)}</h3>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
