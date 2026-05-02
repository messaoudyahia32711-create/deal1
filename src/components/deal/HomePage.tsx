'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore, type Product, type Service, type Category, WILAYAS, WILAYAS_FR } from '@/lib/store'
import { t, formatPrice } from '@/lib/i18n'
import { Search, SlidersHorizontal, MapPin, Star, ShoppingCart, Calendar, ChevronLeft, ChevronRight, Package, Wrench, TrendingUp, Users, Award, Zap, Globe, MessageCircle, Eye } from 'lucide-react'
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
      // Ease-out cubic
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

  function renderStars(rating: number = 0, size: string = 'w-4 h-4') {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`${size} ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ))
  }

  function handleContactOwner(ownerId: string, ownerName: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    if (!user) {
      setCurrentView('auth')
      return
    }
    // Navigate to the user's dashboard chat tab based on their role
    const dashboardView = user.role === 'merchant' ? 'merchant-dashboard'
      : user.role === 'service_provider' ? 'provider-dashboard'
      : user.role === 'admin' ? 'admin-dashboard'
      : 'customer-dashboard'
    
    setContactOwner(ownerId, ownerName)
    setCurrentView(dashboardView)
    
    // Set the correct chat tab
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
            <StatCounter
              value={stats.wilayas}
              label={language === 'ar' ? 'ولاية' : 'Wilayas'}
              icon={<Globe className="w-5 h-5 text-yellow-300" />}
              delay={0}
            />
            <StatCounter
              value={stats.merchants}
              label={t('merchant', language)}
              icon={<Award className="w-5 h-5 text-yellow-300" />}
              delay={100}
            />
            <StatCounter
              value={stats.products}
              label={t('products', language)}
              icon={<Package className="w-5 h-5 text-yellow-300" />}
              delay={200}
            />
            <StatCounter
              value={stats.services}
              label={t('services', language)}
              icon={<Wrench className="w-5 h-5 text-yellow-300" />}
              delay={300}
            />
            <StatCounter
              value={stats.deals}
              label={t('dealsCompleted', language)}
              icon={<Zap className="w-5 h-5 text-yellow-300" />}
              delay={400}
            />
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
            {/* Type Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${filterType === 'all' ? 'bg-yellow-500 text-white shadow-md' : 'hover:bg-gray-200'}`}
              >
                {t('all', language)}
              </button>
              <button
                onClick={() => setFilterType('products')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1 ${filterType === 'products' ? 'bg-yellow-500 text-white shadow-md' : 'hover:bg-gray-200'}`}
              >
                <Package className="w-4 h-4" /> {t('products', language)}
              </button>
              <button
                onClick={() => setFilterType('services')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1 ${filterType === 'services' ? 'bg-purple-500 text-white shadow-md' : 'hover:bg-gray-200'}`}
              >
                <Wrench className="w-4 h-4" /> {t('services', language)}
              </button>
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-bold border-2 transition ${selectedCategory === 'all' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 hover:border-yellow-300'}`}
              >
                {t('all', language)}
              </button>
              {(filterType === 'services' ? serviceCategories : productCategories).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-bold border-2 transition ${selectedCategory === cat.id ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 hover:border-yellow-300'}`}
                >
                  {cat.icon} {language === 'ar' ? cat.nameAr : (cat.nameFr || cat.nameAr)}
                </button>
              ))}
            </div>

            {/* Sort */}
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
            <Slider
              value={priceRange}
              onValueChange={(v) => setPriceRange(v as [number, number])}
              min={0}
              max={500000}
              step={5000}
              className="flex-1 max-w-xs"
            />
            <span className="text-sm font-bold text-gray-600">
              {formatPrice(priceRange[0], language)} - {formatPrice(priceRange[1], language)}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Products Section */}
        {(filterType === 'all' || filterType === 'products') && (
          <section id="products-section" className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-black">{t('products', language)}</h2>
              <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">{products.length} {t('products', language)}</Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-bold">{t('noData', language)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <Card
                    key={product.id}
                    className="deal-card group cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                      )}
                      {product.isNew && (
                        <Badge className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-0.5">{t('newBadge', language)}</Badge>
                      )}
                      {product.isOnSale && product.salePrice && (
                        <Badge className="absolute top-3 left-3 bg-orange-500 text-white text-xs px-2 py-0.5">-{Math.round(((product.price - product.salePrice) / product.price) * 100)}%</Badge>
                      )}
                      {product.isFeatured && (
                        <Badge className="absolute bottom-3 right-3 bg-yellow-500 text-white text-xs px-2 py-0.5">{t('featured', language)}</Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      {/* Category + Title */}
                      {product.categoryName && (
                        <Badge variant="outline" className="text-[10px] mb-1.5 border-purple-300 text-purple-600 bg-purple-50">{product.categoryName}</Badge>
                      )}
                      <h3 className="font-bold text-base line-clamp-2 mb-2 min-h-[2.8rem] leading-tight">{product.title}</h3>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="flex items-center gap-0.5">{renderStars(product.rating || 0, 'w-3.5 h-3.5')}</div>
                        <span className="text-sm font-bold text-gray-600">{(product.rating || 0).toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
                      </div>
                      
                      {/* Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          {product.isOnSale && product.salePrice ? (
                            <div>
                              <span className="text-xs text-gray-400 line-through">{formatPrice(product.price, language)}</span>
                              <span className="font-black text-yellow-700 text-lg block">{formatPrice(product.salePrice, language)}</span>
                            </div>
                          ) : (
                            <span className="font-black text-yellow-700 text-lg">{formatPrice(product.price, language)}</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(product) }}
                          className="w-10 h-10 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl flex items-center justify-center transition shadow-md hover:shadow-lg"
                          title={t('addToCart', language)}
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Merchant info + Contact Button */}
                      {product.merchant && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-gray-600 truncate">{product.merchant.storeName || product.merchant.username}</span>
                              {product.merchant.isVerified && <Award className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0" />}
                            </div>
                            {product.merchant.wilaya && (
                              <div className="flex items-center gap-0.5 text-[11px] text-purple-400">
                                <MapPin className="w-2.5 h-2.5" />
                                <span>{product.merchant.wilaya}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleContactOwner(product.merchantId, product.merchant?.storeName || product.merchant?.username || '', e)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-lg text-xs font-bold transition shadow-sm hover:shadow-md"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {t('contact', language)}
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Services Section */}
        {(filterType === 'all' || filterType === 'services') && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-black">{t('services', language)}</h2>
              <Badge variant="secondary" className="bg-purple-50 text-purple-700">{services.length} {t('services', language)}</Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Wrench className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-bold">{t('noData', language)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                  <Card
                    key={service.id}
                    className="deal-card group cursor-pointer"
                    onClick={() => setSelectedService(service)}
                  >
                    {/* Service Image or Icon Header */}
                    <div className="relative aspect-[16/9] bg-gradient-to-br from-purple-100 to-purple-200 overflow-hidden">
                      {service.images && service.images.length > 0 ? (
                        <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          {service.categoryName === 'سباكة' ? '🔧' : service.categoryName === 'كهرباء' ? '⚡' : service.categoryName === 'تكييف' ? '❄️' : service.categoryName === 'نجارة' ? '🪚' : service.categoryName === 'دهان' ? '🎨' : service.categoryName === 'نقل' ? '🚚' : service.categoryName === 'تنظيف' ? '🧹' : '🛠️'}
                        </div>
                      )}
                      {service.provider?.isVerified && (
                        <Badge className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-2 py-0.5">
                          <Award className="w-3 h-3 ml-1" /> {t('verified', language)}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      {/* Category + Title */}
                      {service.categoryName && (
                        <Badge variant="outline" className="text-[10px] mb-1.5 border-purple-300 text-purple-600 bg-purple-50">{service.categoryName}</Badge>
                      )}
                      <h3 className="font-bold text-base mb-2 line-clamp-2 leading-tight">{service.title}</h3>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="flex items-center gap-0.5">{renderStars(service.rating || 0, 'w-3.5 h-3.5')}</div>
                        <span className="text-sm font-bold text-gray-600">{(service.rating || 0).toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({service.reviewCount || 0})</span>
                      </div>

                      {/* Price + Projects */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-xs text-gray-400">
                            {service.priceType === 'fixed' ? t('fixed', language) : service.priceType === 'hourly' ? t('hourly', language) : t('negotiable', language)}
                          </span>
                          {service.price ? (
                            <span className="font-black text-purple-600 text-lg block">{formatPrice(service.price, language)}</span>
                          ) : (
                            <span className="font-bold text-purple-600 text-lg">{t('negotiable', language)}</span>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-black text-purple-700">{service.completedProjects}</div>
                          <div className="text-[10px] text-gray-400 font-bold">{t('completedProjects', language)}</div>
                        </div>
                      </div>

                      {/* Provider info + Contact Button */}
                      {service.provider && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-gray-600 truncate">{service.provider.username}</span>
                              {service.provider.isVerified && <Award className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0" />}
                            </div>
                            {service.provider.specialty && (
                              <div className="text-[11px] text-gray-400 truncate">{service.provider.specialty}</div>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleContactOwner(service.providerId, service.provider?.username || '', e)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-lg text-xs font-bold transition shadow-sm hover:shadow-md"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {t('contact', language)}
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
