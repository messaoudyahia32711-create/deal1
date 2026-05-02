'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore, type Product, type Service, type Category, WILAYAS, WILAYAS_FR } from '@/lib/store'
import { t, formatPrice } from '@/lib/i18n'
import { Search, SlidersHorizontal, MapPin, Star, ShoppingCart, Calendar, ChevronLeft, ChevronRight, Package, Wrench, TrendingUp, Users, Award, Zap, Globe, MessageCircle, Eye, Heart, Share2, Clock, Briefcase, CheckCircle, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import ProductDetailModal from '@/components/deal/ProductDetailModal'
import ServiceDetailModal from '@/components/deal/ServiceDetailModal'

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    if (end === 0) return
    let startTime: number | null = null
    let rafId: number

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [end, duration])

  return count
}

function StatCounter({ value, label, icon, delay = 0 }: { value: number; label: string; icon: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false)
  const count = useAnimatedCounter(visible ? value : 0, 1500)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className="glass rounded-xl px-6 py-3 text-center transform transition-all duration-500" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)' }}>
      <div className="flex items-center justify-center gap-2 mb-1">
        {icon}
        <span className="text-2xl font-black gold-shimmer">{count}+</span>
      </div>
      <div className="text-sm opacity-80 font-bold">{label}</div>
    </div>
  )
}

// Product Card - BIG and detailed
function ProductCard({ product, language, onSelect, onContact, onAddToCart, onFavorite }: {
  product: Product
  language: 'ar' | 'fr'
  onSelect: () => void
  onContact: (e: React.MouseEvent) => void
  onAddToCart: (e: React.MouseEvent) => void
  onFavorite: (e: React.MouseEvent) => void
}) {
  const hasImage = product.images && product.images.length > 0
  const discount = product.isOnSale && product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0
  const stockStatus = product.stock > 10 ? 'in_stock' : product.stock > 0 ? 'low_stock' : 'out_of_stock'

  return (
    <Card className="deal-card group cursor-pointer overflow-hidden" onClick={onSelect}>
      {/* Very Large Image Area */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {hasImage ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-yellow-50 to-amber-50">
            <Package className="w-24 h-24 text-yellow-300" />
            <span className="text-base text-yellow-400 font-bold">{language === 'ar' ? 'لا توجد صورة' : 'Aucune image'}</span>
          </div>
        )}
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          {product.isNew && (
            <Badge className="bg-red-500 text-white text-sm px-3 py-1.5 font-bold shadow-lg">{t('newBadge', language)}</Badge>
          )}
          {product.isOnSale && product.salePrice && (
            <Badge className="bg-orange-500 text-white text-sm px-3 py-1.5 font-bold shadow-lg">-{discount}%</Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-yellow-500 text-white text-sm px-3 py-1.5 font-bold shadow-lg">⭐ {t('featured', language)}</Badge>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={onFavorite}
          className="absolute top-4 left-4 w-11 h-11 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition z-10"
        >
          <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 transition" />
        </button>

        {/* Image count indicator */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 z-10">
            <Eye className="w-4 h-4" />
            {product.images.length} {language === 'ar' ? 'صور' : 'photos'}
          </div>
        )}

        {/* Quick Add to Cart on hover */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
          <button
            onClick={onAddToCart}
            className="w-13 h-13 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl flex items-center justify-center shadow-xl transition"
            title={t('addToCart', language)}
          >
            <ShoppingCart className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Card Content - BIG and Detailed */}
      <CardContent className="p-6">
        {/* Category + Stock */}
        <div className="flex items-center justify-between mb-3">
          {product.categoryName && (
            <Badge variant="outline" className="text-sm border-purple-300 text-purple-600 bg-purple-50 px-3 py-1">
              {product.categoryName}
            </Badge>
          )}
          <div className={`flex items-center gap-1.5 text-sm font-bold ${
            stockStatus === 'in_stock' ? 'text-green-600' : stockStatus === 'low_stock' ? 'text-orange-500' : 'text-red-500'
          }`}>
            {stockStatus === 'in_stock' && <CheckCircle className="w-4 h-4" />}
            {stockStatus === 'low_stock' && <AlertTriangle className="w-4 h-4" />}
            {stockStatus === 'out_of_stock' && <AlertTriangle className="w-4 h-4" />}
            {stockStatus === 'in_stock' ? (language === 'ar' ? 'متوفر' : 'En stock') : stockStatus === 'low_stock' ? (language === 'ar' ? `متبقي ${product.stock}` : `Reste ${product.stock}`) : (language === 'ar' ? 'نفذ' : 'Épuisé')}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-black text-xl md:text-2xl mb-3 line-clamp-2 leading-snug min-h-[4rem]">{product.title}</h3>

        {/* Description snippet */}
        {product.description && (
          <p className="text-base text-gray-500 line-clamp-2 mb-4 leading-relaxed">{product.description}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            ))}
          </div>
          <span className="text-base font-bold text-gray-700">{(product.rating || 0).toFixed(1)}</span>
          <span className="text-sm text-gray-400">({product.reviewCount || 0} {t('reviews', language)})</span>
        </div>

        {/* Price - Very Prominent */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-4 mb-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              {product.isOnSale && product.salePrice ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl md:text-3xl font-black text-yellow-700">{formatPrice(product.salePrice, language)}</span>
                  <span className="text-base text-gray-400 line-through">{formatPrice(product.price, language)}</span>
                </div>
              ) : (
                <span className="text-2xl md:text-3xl font-black text-yellow-700">{formatPrice(product.price, language)}</span>
              )}
            </div>
            {discount > 0 && (
              <Badge className="bg-red-500 text-white text-sm font-bold px-3 py-1">-{discount}%</Badge>
            )}
          </div>
        </div>

        {/* Merchant info + Contact Button */}
        {product.merchant && (
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                {product.merchant.storeName?.[0] || product.merchant.username?.[0] || 'م'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-gray-700 truncate">{product.merchant.storeName || product.merchant.username}</span>
                  {product.merchant.isVerified && <Award className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0" />}
                </div>
                {product.merchant.wilaya && (
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{product.merchant.wilaya}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onContact}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-xl text-base font-bold transition shadow-md hover:shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              {t('contact', language)}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Service Card - BIG and detailed
function ServiceCard({ service, language, onSelect, onContact }: {
  service: Service
  language: 'ar' | 'fr'
  onSelect: () => void
  onContact: (e: React.MouseEvent) => void
}) {
  const hasImage = service.images && service.images.length > 0

  // Service emoji map
  function getServiceEmoji(categoryName?: string): string {
    if (!categoryName) return '🛠️'
    const map: Record<string, string> = {
      'سباكة': '🔧', 'كهرباء': '⚡', 'تكييف': '❄️', 'نجارة': '🪚', 'دهان': '🎨', 'نقل': '🚚', 'تنظيف': '🧹',
      'Plomberie': '🔧', 'Électricité': '⚡', 'Climatisation': '❄️', 'Menuiserie': '🪚', 'Peinture': '🎨', 'Transport': '🚚', 'Nettoyage': '🧹',
    }
    return map[categoryName] || '🛠️'
  }

  function getPriceTypeLabel(pt: string) {
    switch (pt) {
      case 'fixed': return t('fixed', language)
      case 'hourly': return t('hourly', language)
      case 'negotiable': return t('negotiable', language)
      default: return pt
    }
  }

  return (
    <Card className="deal-card group cursor-pointer overflow-hidden" onClick={onSelect}>
      {/* Very Large Image Area */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden">
        {hasImage ? (
          <img
            src={service.images[0]}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-100 to-purple-200">
            <span className="text-7xl">{getServiceEmoji(service.categoryName)}</span>
            <span className="text-base text-purple-400 font-bold">{service.categoryName || (language === 'ar' ? 'خدمة' : 'Service')}</span>
          </div>
        )}
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          {service.provider?.isVerified && (
            <Badge className="bg-blue-500 text-white text-sm px-3 py-1.5 font-bold shadow-lg">
              <Award className="w-4 h-4 ml-1" /> {t('verified', language)}
            </Badge>
          )}
        </div>

        {/* Image count indicator */}
        {service.images && service.images.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 z-10">
            <Eye className="w-4 h-4" />
            {service.images.length} {language === 'ar' ? 'صور' : 'photos'}
          </div>
        )}

        {/* Price Badge on image */}
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
            {service.price ? (
              <span className="font-black text-purple-700 text-xl">{formatPrice(service.price, language)}</span>
            ) : (
              <span className="font-bold text-purple-600 text-base">{t('negotiable', language)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Content - BIG and Detailed */}
      <CardContent className="p-6">
        {/* Category + Price Type */}
        <div className="flex items-center justify-between mb-3">
          {service.categoryName && (
            <Badge variant="outline" className="text-sm border-purple-300 text-purple-600 bg-purple-50 px-3 py-1">
              {service.categoryName}
            </Badge>
          )}
          <Badge className="bg-purple-100 text-purple-700 text-sm px-3 py-1">
            <Clock className="w-4 h-4 ml-1" />
            {getPriceTypeLabel(service.priceType)}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-black text-xl md:text-2xl mb-3 line-clamp-2 leading-snug min-h-[4rem]">{service.title}</h3>

        {/* Description snippet */}
        {service.description && (
          <p className="text-base text-gray-500 line-clamp-2 mb-4 leading-relaxed">{service.description}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`w-5 h-5 ${i < Math.round(service.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            ))}
          </div>
          <span className="text-base font-bold text-gray-700">{(service.rating || 0).toFixed(1)}</span>
          <span className="text-sm text-gray-400">({service.reviewCount || 0} {t('reviews', language)})</span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
            <Briefcase className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <div className="font-black text-xl text-blue-700">{service.completedProjects}</div>
            <div className="text-xs text-blue-500 font-bold">{t('completedProjects', language)}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
            <Star className="w-5 h-5 mx-auto text-yellow-500 fill-yellow-500 mb-1" />
            <div className="font-black text-xl text-yellow-700">{(service.rating || 0).toFixed(1)}</div>
            <div className="text-xs text-yellow-500 font-bold">{t('rating', language)}</div>
          </div>
        </div>

        {/* Coverage Wilayas snippet */}
        {service.coverageWilayas && service.coverageWilayas.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
              <MapPin className="w-4 h-4" />
              <span>{t('coverageWilayas', language)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {service.coverageWilayas.slice(0, 5).map((w, i) => (
                <Badge key={i} variant="outline" className="text-xs border-purple-200 text-purple-600 bg-purple-50 px-2 py-0.5">
                  {w}
                </Badge>
              ))}
              {service.coverageWilayas.length > 5 && (
                <Badge variant="outline" className="text-xs border-gray-200 text-gray-500 bg-gray-50 px-2 py-0.5">
                  +{service.coverageWilayas.length - 5}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Provider info + Contact Button */}
        {service.provider && (
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                {service.provider.username?.[0] || 'م'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-gray-700 truncate">{service.provider.username}</span>
                  {service.provider.isVerified && <Award className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0" />}
                </div>
                {service.provider.specialty && (
                  <div className="text-sm text-gray-400 truncate">{service.provider.specialty}</div>
                )}
              </div>
            </div>
            <button
              onClick={onContact}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-xl text-base font-bold transition shadow-md hover:shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              {t('contact', language)}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const {
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    filterType, setFilterType,
    priceRange, setPriceRange,
    selectedWilaya, setSelectedWilaya,
    sortBy, setSortBy,
    addToCart, user, setCurrentView,
    setSelectedProduct, setSelectedService,
    language, setContactOwner,
  } = useAppStore()

  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState({ merchants: 0, services: 0, deals: 0, products: 0, users: 0, wilayas: 58 })
  const [loading, setLoading] = useState(true)
  const [productPage, setProductPage] = useState(1)
  const [servicePage, setServicePage] = useState(1)

  async function loadData() {
    setLoading(true)
    try {
      const [prodRes, servRes, catRes, statsRes] = await Promise.all([
        fetch(`/api/products?search=${searchQuery}&categoryId=${selectedCategory !== 'all' ? selectedCategory : ''}&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}&wilaya=${selectedWilaya}&sortBy=${sortBy}&page=${productPage}&limit=12`),
        fetch(`/api/services?search=${searchQuery}&categoryId=${selectedCategory !== 'all' ? selectedCategory : ''}&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}&wilaya=${selectedWilaya}&sortBy=${sortBy}&page=${servicePage}&limit=12`),
        fetch('/api/categories'),
        fetch('/api/stats'),
      ])
      const prodData = await prodRes.json()
      const servData = await servRes.json()
      const catData = await catRes.json()
      const statsData = await statsRes.json()

      setProducts(prodData.data || [])
      setServices(servData.data || [])
      setCategories(catData.data || [])
      if (statsData.data) {
        setStats({
          merchants: statsData.data.users?.merchants || 0,
          services: statsData.data.services?.active || 0,
          deals: statsData.data.orders?.total || 0,
          products: statsData.data.products?.active || 0,
          users: statsData.data.users?.total || 0,
          wilayas: 58,
        })
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [searchQuery, selectedCategory, filterType, priceRange, selectedWilaya, sortBy, productPage, servicePage])

  const productCategories = categories.filter(c => c.type === 'product')
  const serviceCategories = categories.filter(c => c.type === 'service')

  function handleContactOwner(ownerId: string, ownerName: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    if (!user) {
      setCurrentView('auth')
      return
    }
    const dashboardView = user.role === 'merchant' ? 'merchant-dashboard'
      : user.role === 'service_provider' ? 'provider-dashboard'
      : user.role === 'admin' ? 'admin-dashboard'
      : 'customer-dashboard'
    
    setContactOwner(ownerId, ownerName)
    setCurrentView(dashboardView)
    
    const store = useAppStore.getState()
    if (user.role === 'merchant') store.setMerchantTab('chat')
    else if (user.role === 'service_provider') store.setProviderTab('chat')
    else if (user.role === 'customer') store.setCustomerTab('chat')
    else if (user.role === 'admin') store.setAdminTab('chat')
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-4 animate-fade-in-up">
            <span className="gold-shimmer text-6xl md:text-8xl">DEAL</span>
          </h1>
          <p className="text-xl md:text-2xl font-light mb-2 opacity-90 gold-shimmer inline-block">
            {t('appTagline', language)}
          </p>
          <p className="text-lg md:text-xl opacity-80 mb-8">{t('appDescription', language)}</p>

          {/* Animated Stats */}
          <div className="flex justify-center gap-3 md:gap-6 mb-8 flex-wrap">
            <StatCounter value={stats.wilayas} label={language === 'ar' ? 'ولاية' : 'Wilayas'} icon={<Globe className="w-5 h-5 text-yellow-300" />} delay={0} />
            <StatCounter value={stats.merchants} label={t('merchant', language)} icon={<Award className="w-5 h-5 text-yellow-300" />} delay={100} />
            <StatCounter value={stats.products} label={t('products', language)} icon={<Package className="w-5 h-5 text-yellow-300" />} delay={200} />
            <StatCounter value={stats.services} label={t('services', language)} icon={<Wrench className="w-5 h-5 text-yellow-300" />} delay={300} />
            <StatCounter value={stats.deals} label={t('dealsCompleted', language)} icon={<Zap className="w-5 h-5 text-yellow-300" />} delay={400} />
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 flex-wrap">
            <button className="btn-3d btn-3d-primary text-lg" onClick={() => { setFilterType('products'); document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }) }}>
              <ShoppingCart className="w-5 h-5" /> {t('startShopping', language)}
            </button>
            <button className="btn-3d btn-3d-secondary text-lg" onClick={() => { if (!user) { setCurrentView('auth') } else { setCurrentView('merchant-dashboard') } }}>
              <TrendingUp className="w-5 h-5" /> {t('registerAsMerchant', language)}
            </button>
          </div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b shadow-sm py-4 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Search */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder={t('search', language)}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10 text-right rounded-xl border-2 focus:border-yellow-400 h-12"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <Select value={selectedWilaya} onValueChange={setSelectedWilaya}>
              <SelectTrigger className="w-40 rounded-xl h-12">
                <MapPin className="w-4 h-4 ml-1" />
                <SelectValue placeholder={t('wilaya', language)} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">{t('allWilayas', language)}</SelectItem>
                {(language === 'ar' ? WILAYAS : WILAYAS_FR).map((w, i) => (
                  <SelectItem key={i} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Tabs & Category */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${filterType === 'all' ? 'bg-yellow-500 text-white shadow-md' : 'hover:bg-gray-200'}`}>
                {t('all', language)}
              </button>
              <button onClick={() => setFilterType('products')} className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1 ${filterType === 'products' ? 'bg-yellow-500 text-white shadow-md' : 'hover:bg-gray-200'}`}>
                <Package className="w-4 h-4" /> {t('products', language)}
              </button>
              <button onClick={() => setFilterType('services')} className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1 ${filterType === 'services' ? 'bg-purple-500 text-white shadow-md' : 'hover:bg-gray-200'}`}>
                <Wrench className="w-4 h-4" /> {t('services', language)}
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
              <button onClick={() => setSelectedCategory('all')} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-bold border-2 transition ${selectedCategory === 'all' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 hover:border-yellow-300'}`}>
                {t('all', language)}
              </button>
              {(filterType === 'services' ? serviceCategories : productCategories).map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-bold border-2 transition ${selectedCategory === cat.id ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 hover:border-yellow-300'}`}>
                  {cat.icon} {language === 'ar' ? cat.nameAr : (cat.nameFr || cat.nameAr)}
                </button>
              ))}
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('newest', language)}</SelectItem>
                <SelectItem value="price_asc">{t('priceAsc', language)}</SelectItem>
                <SelectItem value="price_desc">{t('priceDesc', language)}</SelectItem>
                <SelectItem value="rating">{t('topRated', language)}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="mt-3 flex items-center gap-4">
            <span className="text-sm font-bold text-gray-500">{t('priceRange', language)}:</span>
            <Slider value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} min={0} max={500000} step={5000} className="flex-1 max-w-xs" />
            <span className="text-sm font-bold text-gray-600">
              {formatPrice(priceRange[0], language)} - {formatPrice(priceRange[1], language)}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Products Section */}
        {(filterType === 'all' || filterType === 'products') && (
          <section id="products-section" className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black">{t('products', language)}</h2>
                <p className="text-sm text-gray-400">{language === 'ar' ? 'أفضل المنتجات من متاجر الجزائر' : 'Les meilleurs produits des magasins algériens'}</p>
              </div>
              <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 text-sm px-3 py-1">{products.length}</Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-10">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-[650px] bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Package className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <p className="text-xl font-bold">{t('noData', language)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-10">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    language={language}
                    onSelect={() => setSelectedProduct(product)}
                    onContact={(e) => handleContactOwner(product.merchantId, product.merchant?.storeName || product.merchant?.username || '', e)}
                    onAddToCart={(e) => { e.stopPropagation(); addToCart(product) }}
                    onFavorite={(e) => e.stopPropagation()}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Services Section */}
        {(filterType === 'all' || filterType === 'services') && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black">{t('services', language)}</h2>
                <p className="text-sm text-gray-400">{language === 'ar' ? 'خدمات موثوقة عبر الولايات' : 'Services fiables à travers les wilayas'}</p>
              </div>
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-sm px-3 py-1">{services.length}</Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-10">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-[650px] bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Wrench className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <p className="text-xl font-bold">{t('noData', language)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-10">
                {services.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    language={language}
                    onSelect={() => setSelectedService(service)}
                    onContact={(e) => handleContactOwner(service.providerId, service.provider?.username || '', e)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Detail Modals */}
      <ProductDetailModal />
      <ServiceDetailModal />
    </div>
  )
}
