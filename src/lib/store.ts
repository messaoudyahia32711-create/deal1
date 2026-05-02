import { create } from 'zustand'

// Types
export type UserRole = 'admin' | 'merchant' | 'service_provider' | 'customer'
export type AppView = 'home' | 'auth' | 'merchant-dashboard' | 'provider-dashboard' | 'customer-dashboard' | 'admin-dashboard'
export type AuthMode = 'login' | 'register'
export type MerchantTab = 'overview' | 'products' | 'orders' | 'wallet' | 'reviews'
export type ProviderTab = 'overview' | 'services' | 'bookings' | 'wallet' | 'reviews'
export type CustomerTab = 'overview' | 'cart' | 'orders' | 'favorites' | 'chat' | 'reviews'
export type AdminTab = 'overview' | 'users' | 'commissions' | 'categories' | 'complaints' | 'settings'
export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type ServiceRequestStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  phone?: string
  address?: string
  wilaya?: string
  isVerified: boolean
  storeName?: string
  specialty?: string
  experience?: number
  avatar?: string
}

export interface Product {
  id: string
  merchantId: string
  categoryId: string
  title: string
  description?: string
  price: number
  stock: number
  images: string[]
  status: string
  views: number
  isFeatured: boolean
  isNew: boolean
  isOnSale: boolean
  salePrice?: number
  merchant?: User
  categoryName?: string
  rating?: number
  reviewCount?: number
}

export interface Service {
  id: string
  providerId: string
  categoryId: string
  title: string
  description?: string
  priceType: string
  price?: number
  availabilityDays: string[]
  images: string[]
  status: string
  views: number
  completedProjects: number
  coverageWilayas: string[]
  provider?: User
  categoryName?: string
  rating?: number
  reviewCount?: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  customerId: string
  merchantId: string
  totalAmount: number
  commissionAmount: number
  status: OrderStatus
  paymentMethod: string
  deliveryAddress?: string
  trackingNumber?: string
  notes?: string
  createdAt: string
  items?: OrderItem[]
  merchantName?: string
  customerName?: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: number
  productTitle?: string
}

export interface ServiceRequest {
  id: string
  customerId: string
  providerId: string
  serviceId: string
  scheduledDate?: string
  status: ServiceRequestStatus
  totalPrice: number
  commissionAmount: number
  serviceLocation?: string
  notes?: string
  createdAt: string
  providerName?: string
  customerName?: string
  serviceTitle?: string
}

export interface Category {
  id: string
  nameAr: string
  nameFr?: string
  icon?: string
  type: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface Wallet {
  id: string
  balance: number
  totalEarned: number
  totalCommissionPaid: number
  pendingWithdrawal: number
}

// App Store
interface AppStore {
  // Navigation
  currentView: AppView
  setCurrentView: (view: AppView) => void
  
  // Auth
  user: User | null
  setUser: (user: User | null) => void
  isLoggedIn: boolean
  
  // Auth mode
  authMode: AuthMode
  setAuthMode: (mode: AuthMode) => void
  
  // Dashboard tabs
  merchantTab: MerchantTab
  setMerchantTab: (tab: MerchantTab) => void
  providerTab: ProviderTab
  setProviderTab: (tab: ProviderTab) => void
  customerTab: CustomerTab
  setCustomerTab: (tab: CustomerTab) => void
  adminTab: AdminTab
  setAdminTab: (tab: AdminTab) => void
  
  // Home filters
  searchQuery: string
  setSearchQuery: (q: string) => void
  selectedCategory: string
  setSelectedCategory: (c: string) => void
  filterType: 'all' | 'products' | 'services'
  setFilterType: (t: 'all' | 'products' | 'services') => void
  priceRange: [number, number]
  setPriceRange: (r: [number, number]) => void
  selectedWilaya: string
  setSelectedWilaya: (w: string) => void
  sortBy: string
  setSortBy: (s: string) => void
  
  // Cart
  cart: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: () => number
  
  // Notifications
  notifications: Notification[]
  setNotifications: (n: Notification[]) => void
  unreadCount: () => number
  
  // Loading
  isLoading: boolean
  setIsLoading: (l: boolean) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Navigation
  currentView: 'home',
  setCurrentView: (view) => set({ currentView: view }),
  
  // Auth
  user: null,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  isLoggedIn: false,
  
  // Auth mode
  authMode: 'login',
  setAuthMode: (mode) => set({ authMode: mode }),
  
  // Dashboard tabs
  merchantTab: 'overview',
  setMerchantTab: (tab) => set({ merchantTab: tab }),
  providerTab: 'overview',
  setProviderTab: (tab) => set({ providerTab: tab }),
  customerTab: 'overview',
  setCustomerTab: (tab) => set({ customerTab: tab }),
  adminTab: 'overview',
  setAdminTab: (tab) => set({ adminTab: tab }),
  
  // Home filters
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectedCategory: 'all',
  setSelectedCategory: (c) => set({ selectedCategory: c }),
  filterType: 'all',
  setFilterType: (t) => set({ filterType: t }),
  priceRange: [0, 500000],
  setPriceRange: (r) => set({ priceRange: r }),
  selectedWilaya: '',
  setSelectedWilaya: (w) => set({ selectedWilaya: w }),
  sortBy: 'newest',
  setSortBy: (s) => set({ sortBy: s }),
  
  // Cart
  cart: [],
  addToCart: (product) => {
    const cart = get().cart
    const existing = cart.find(item => item.product.id === product.id)
    if (existing) {
      set({
        cart: cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      })
    } else {
      set({ cart: [...cart, { product, quantity: 1 }] })
    }
  },
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter(item => item.product.id !== productId) })
  },
  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId)
      return
    }
    set({
      cart: get().cart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    })
  },
  clearCart: () => set({ cart: [] }),
  cartTotal: () => {
    return get().cart.reduce((total, item) => {
      const price = item.product.isOnSale && item.product.salePrice
        ? item.product.salePrice
        : item.product.price
      return total + price * item.quantity
    }, 0)
  },
  
  // Notifications
  notifications: [],
  setNotifications: (n) => set({ notifications: n }),
  unreadCount: () => get().notifications.filter(n => !n.isRead).length,
  
  // Loading
  isLoading: false,
  setIsLoading: (l) => set({ isLoading: l }),
}))

// Algerian Wilayas
export const WILAYAS = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار',
  'البليدة', 'البويرة', 'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر',
  'الجلفة', 'جيجل', 'سطيف', 'سعيدة', 'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة',
  'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة', 'وهران', 'البيض',
  'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت', 'الوادي', 'خنشلة',
  'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت', 'غرداية', 'غليزان'
]
