'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type Product, type Service, type Category, WILAYAS } from '@/lib/store'
import { Search, SlidersHorizontal, MapPin, Star, ShoppingCart, Calendar, ChevronLeft, ChevronRight, Package, Wrench, TrendingUp, Users, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

export default function HomePage() {
  const {
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    filterType, setFilterType,
    priceRange, setPriceRange,
    selectedWilaya, setSelectedWilaya,
    sortBy, setSortBy,
    addToCart, user, setCurrentView,
  } = useAppStore()

  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState({ merchants: 0, services: 0, deals: 0 })
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
          merchants: statsData.data.usersByRole?.merchant || 0,
          services: statsData.data.totalServices || 0,
          deals: statsData.data.totalOrders || 0,
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

  function formatPrice(price: number) {
    return new Intl.NumberFormat('ar-DZ').format(price) + ' دج'
  }

  function renderStars(rating: number = 0) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ))
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
            🤝 DEAL
          </h1>
          <p className="text-xl md:text-2xl font-light mb-2 opacity-90">منصة التجارة والخدمات الجزائرية</p>
          <p className="text-lg md:text-xl opacity-80 mb-8">اشتري المنتجات، احجز الخدمات — كل شيء في مكان واحد</p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="glass rounded-xl px-6 py-3 text-center">
              <div className="text-2xl font-bold">{stats.merchants}+</div>
              <div className="text-sm opacity-80">تاجر</div>
            </div>
            <div className="glass rounded-xl px-6 py-3 text-center">
              <div className="text-2xl font-bold">{stats.services}+</div>
              <div className="text-sm opacity-80">خدمة</div>
            </div>
            <div className="glass rounded-xl px-6 py-3 text-center">
              <div className="text-2xl font-bold">{stats.deals}+</div>
              <div className="text-sm opacity-80">صفقة منجزة</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 flex-wrap">
            <button className="btn-3d btn-3d-primary text-lg" onClick={() => { setFilterType('products'); document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }) }}>
              <ShoppingCart className="w-5 h-5" /> ابدأ التسوق
            </button>
            <button className="btn-3d btn-3d-secondary text-lg" onClick={() => { if (!user) { setCurrentView('auth') } else { setCurrentView('merchant-dashboard') } }}>
              <TrendingUp className="w-5 h-5" /> سجّل كتاجر
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
                placeholder="ابحث عن منتج أو خدمة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10 text-right rounded-xl border-2 focus:border-green-400 h-12"
              />
            </div>
            <Select value={selectedWilaya} onValueChange={setSelectedWilaya}>
              <SelectTrigger className="w-40 rounded-xl h-12">
                <MapPin className="w-4 h-4 ml-1" />
                <SelectValue placeholder="الولاية" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">كل الولايات</SelectItem>
                {WILAYAS.map((w, i) => (
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
                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${filterType === 'all' ? 'bg-green-500 text-white shadow-md' : 'hover:bg-gray-200'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterType('products')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1 ${filterType === 'products' ? 'bg-green-500 text-white shadow-md' : 'hover:bg-gray-200'}`}
              >
                <Package className="w-4 h-4" /> المنتجات
              </button>
              <button
                onClick={() => setFilterType('services')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1 ${filterType === 'services' ? 'bg-green-500 text-white shadow-md' : 'hover:bg-gray-200'}`}
              >
                <Wrench className="w-4 h-4" /> الخدمات
              </button>
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-bold border-2 transition ${selectedCategory === 'all' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300'}`}
              >
                الكل
              </button>
              {(filterType === 'services' ? serviceCategories : productCategories).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-bold border-2 transition ${selectedCategory === cat.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300'}`}
                >
                  {cat.icon} {cat.nameAr}
                </button>
              ))}
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="price_asc">السعر: تصاعدي</SelectItem>
                <SelectItem value="price_desc">السعر: تنازلي</SelectItem>
                <SelectItem value="rating">الأعلى تقييماً</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="mt-3 flex items-center gap-4">
            <span className="text-sm font-bold text-gray-500">السعر:</span>
            <Slider
              value={priceRange}
              onValueChange={(v) => setPriceRange(v as [number, number])}
              min={0}
              max={500000}
              step={5000}
              className="flex-1 max-w-xs"
            />
            <span className="text-sm font-bold text-gray-600">
              {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Products Section */}
        {(filterType === 'all' || filterType === 'products') && (
          <section id="products-section" className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-black">المنتجات</h2>
              <Badge variant="secondary" className="bg-green-50 text-green-700">{products.length} منتج</Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-72 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-bold">لا توجد منتجات مطابقة</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(product => (
                  <Card key={product.id} className="deal-card group cursor-pointer">
                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                      )}
                      {product.isNew && (
                        <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">جديد</Badge>
                      )}
                      {product.isOnSale && product.salePrice && (
                        <Badge className="absolute top-2 left-2 bg-orange-500 text-white text-xs">عروض</Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm line-clamp-2 mb-1 min-h-[2.5rem]">{product.title}</h3>
                      <div className="flex items-center gap-1 mb-1">
                        {renderStars(product.rating || 0)}
                        <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          {product.isOnSale && product.salePrice ? (
                            <div>
                              <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                              <span className="font-black text-green-600 text-sm block">{formatPrice(product.salePrice)}</span>
                            </div>
                          ) : (
                            <span className="font-black text-green-600 text-sm">{formatPrice(product.price)}</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(product) }}
                          className="w-9 h-9 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition shadow-md hover:shadow-lg"
                          title="أضف للسلة"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                      {product.merchant?.storeName && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{product.merchant.storeName}</p>
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
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-black">الخدمات</h2>
              <Badge variant="secondary" className="bg-orange-50 text-orange-700">{services.length} خدمة</Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Wrench className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-bold">لا توجد خدمات مطابقة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(service => (
                  <Card key={service.id} className="deal-card group cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-2xl shrink-0">
                          {service.categoryName === 'سباكة' ? '🔧' : service.categoryName === 'كهرباء' ? '⚡' : service.categoryName === 'تكييف' ? '❄️' : service.categoryName === 'نجارة' ? '🪚' : service.categoryName === 'دهان' ? '🎨' : service.categoryName === 'نقل' ? '🚚' : service.categoryName === 'تنظيف' ? '🧹' : '🛠️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base mb-1">{service.title}</h3>
                          <div className="flex items-center gap-1 mb-1">
                            {renderStars(service.rating || 0)}
                            <span className="text-xs text-gray-400">({service.reviewCount || 0})</span>
                          </div>
                          {service.provider?.isVerified && (
                            <Badge className="bg-blue-50 text-blue-600 text-xs mb-1">
                              <Award className="w-3 h-3 ml-1" /> موثّق
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t pt-3">
                        <div>
                          <span className="text-xs text-gray-400">
                            {service.priceType === 'fixed' ? 'سعر ثابت' : service.priceType === 'hourly' ? 'بالساعة' : 'تفاوضي'}
                          </span>
                          {service.price ? (
                            <span className="font-black text-orange-600 text-sm block">{formatPrice(service.price)}</span>
                          ) : (
                            <span className="font-bold text-orange-600 text-sm">سعر تفاوضي</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>🏗️ {service.completedProjects} مشروع</span>
                        </div>
                        <button className="btn-3d btn-3d-secondary text-xs py-1.5 px-3">
                          <Calendar className="w-3 h-3" /> احجز الآن
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
