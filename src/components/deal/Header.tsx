'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type UserRole } from '@/lib/store'
import { t } from '@/lib/i18n'
import {
  Menu,
  ShoppingCart,
  Bell,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Home,
  Package,
  Wrench,
  Globe,
  MapPin,
  Store,
  Users,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

// Map user role to the corresponding dashboard view
function getDashboardView(role: UserRole) {
  switch (role) {
    case 'admin':
      return 'admin-dashboard' as const
    case 'merchant':
      return 'merchant-dashboard' as const
    case 'service_provider':
      return 'provider-dashboard' as const
    case 'customer':
      return 'customer-dashboard' as const
  }
}

function getDashboardLabel(role: UserRole, language: 'ar' | 'fr') {
  switch (role) {
    case 'admin':
      return t('adminPanel', language)
    case 'merchant':
      return t('merchantPanel', language)
    case 'service_provider':
      return t('providerPanel', language)
    case 'customer':
      return t('customerPanel', language)
  }
}

export default function Header() {
  const {
    currentView,
    setCurrentView,
    user,
    setUser,
    cart,
    notifications,
    setAuthMode,
    setFilterType,
    language,
    setLanguage,
  } = useAppStore()

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const cartItemCount = cart.length
  const [mobileOpen, setMobileOpen] = useState(false)

  // RTL/LTR switching
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  const handleNavClick = (view: 'home' | 'auth', filter?: 'all' | 'products' | 'services') => {
    setCurrentView(view)
    if (filter) setFilterType(filter)
    setMobileOpen(false)
  }

  const handleLogin = () => {
    setAuthMode('login')
    setCurrentView('auth')
    setMobileOpen(false)
  }

  const handleRegister = () => {
    setAuthMode('register')
    setCurrentView('auth')
    setMobileOpen(false)
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentView('home')
  }

  const handleDashboard = () => {
    if (user) {
      setCurrentView(getDashboardView(user.role))
    }
  }

  const handleCart = () => {
    if (user && user.role === 'customer') {
      setCurrentView('customer-dashboard')
      useAppStore.getState().setCustomerTab('cart')
    }
  }

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'fr' : 'ar')
  }

  const navLinks = [
    {
      key: 'home' as const,
      label: t('home', language),
      icon: Home,
      onClick: () => handleNavClick('home', 'all'),
      filterKey: 'all' as const,
    },
    {
      key: 'products' as const,
      label: t('products', language),
      icon: Package,
      onClick: () => handleNavClick('home', 'products'),
      filterKey: 'products' as const,
    },
    {
      key: 'services' as const,
      label: t('services', language),
      icon: Wrench,
      onClick: () => handleNavClick('home', 'services'),
      filterKey: 'services' as const,
    },
  ]

  const currentFilterType = useAppStore.getState().filterType

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Main Header Bar */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-purple-100/50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleNavClick('home', 'all')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span className="text-2xl sm:text-3xl font-black tracking-tight gold-shimmer">
                  DEAL
                </span>
                <span className="text-2xl" role="img" aria-label="handshake">
                  🤝
                </span>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.key}
                  onClick={link.onClick}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentView === 'home' && currentFilterType === link.filterKey
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'text-muted-foreground hover:text-foreground hover:bg-purple-50/50'
                  }`}
                >
                  <link.icon className="size-4" />
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200/60 text-xs font-bold transition-all hover:shadow-sm"
                aria-label={language === 'ar' ? 'Switch to French' : 'التبديل إلى العربية'}
              >
                <Globe className="size-3.5 text-purple-500" />
                <span className="text-purple-700">
                  {language === 'ar' ? 'عربي | FR' : 'AR | Français'}
                </span>
              </button>

              {/* Cart Button */}
              {user && user.role === 'customer' && (
                <button
                  onClick={handleCart}
                  className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-purple-50/50 transition-colors"
                  aria-label={t('cart', language)}
                >
                  <ShoppingCart className="size-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 flex size-5 items-center justify-center rounded-full bg-deal-danger text-[10px] font-bold text-white">
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </button>
              )}

              {/* Notification Bell (logged in) */}
              {user && (
                <button
                  onClick={() => {
                    handleDashboard()
                  }}
                  className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-purple-50/50 transition-colors"
                  aria-label={t('notifications', language)}
                >
                  <Bell className="size-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white animate-pulse-glow">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Auth Buttons - Desktop */}
              {!user && (
                <div className="hidden sm:flex items-center gap-2">
                  <button onClick={handleLogin} className="btn-3d btn-3d-outline text-sm">
                    {t('login', language)}
                  </button>
                  <button onClick={handleRegister} className="btn-3d btn-3d-primary text-sm">
                    {t('register', language)}
                  </button>
                </div>
              )}

              {/* User Dropdown - Desktop */}
              {user && (
                <DropdownMenu dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-purple-50/50 transition-colors">
                      <Avatar className="size-8 border-2 border-amber-300/50">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback className="bg-amber-50 text-amber-700 text-sm font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:block text-sm font-semibold text-foreground max-w-[100px] truncate">
                        {user.username}
                      </span>
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'} className="w-56">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback className="bg-amber-50 text-amber-700 text-sm font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDashboard} className="cursor-pointer">
                      <LayoutDashboard className="size-4 ml-2 mr-2" />
                      {getDashboardLabel(user.role, language)}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        handleDashboard()
                      }}
                      className="cursor-pointer"
                    >
                      <Bell className="size-4 ml-2 mr-2" />
                      {t('notifications', language)}
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="mr-auto text-[10px] px-1.5 py-0">
                          {unreadCount}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-destructive focus:text-destructive"
                      variant="destructive"
                    >
                      <LogOut className="size-4 ml-2 mr-2" />
                      {t('logout', language)}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="size-5" />
                    <span className="sr-only">{language === 'ar' ? 'القائمة' : 'Menu'}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-[300px] sm:w-[350px]">
                  <SheetHeader>
                    <SheetTitle className={`flex items-center gap-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <span className="text-2xl font-black gold-shimmer">DEAL</span>
                      <span className="text-xl">🤝</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col gap-2 px-4 mt-4">
                    {/* Language Toggle in Mobile */}
                    <button
                      onClick={toggleLanguage}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-all"
                    >
                      <Globe className="size-5" />
                      {language === 'ar' ? 'التبديل إلى الفرنسية' : 'Passer en Arabe'}
                    </button>

                    <div className="my-1 h-px bg-border" />

                    {/* Nav Links */}
                    {navLinks.map((link) => (
                      <button
                        key={link.key}
                        onClick={link.onClick}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          currentView === 'home' && currentFilterType === link.filterKey
                            ? 'bg-amber-50 text-amber-700'
                            : 'text-muted-foreground hover:text-foreground hover:bg-purple-50/50'
                        }`}
                      >
                        <link.icon className="size-5" />
                        {link.label}
                      </button>
                    ))}

                    {/* Cart in Mobile */}
                    {user && user.role === 'customer' && (
                      <button
                        onClick={() => {
                          handleCart()
                          setMobileOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-purple-50/50 transition-all"
                      >
                        <div className="relative">
                          <ShoppingCart className="size-5" />
                          {cartItemCount > 0 && (
                            <span className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full bg-deal-danger text-[9px] font-bold text-white">
                              {cartItemCount}
                            </span>
                          )}
                        </div>
                        {t('cart', language)}
                      </button>
                    )}

                    {/* Notifications in Mobile */}
                    {user && (
                      <button
                        onClick={() => {
                          handleDashboard()
                          setMobileOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-purple-50/50 transition-all"
                      >
                        <div className="relative">
                          <Bell className="size-5" />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        {t('notifications', language)}
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="mr-auto text-[10px] px-1.5 py-0">
                            {unreadCount}
                          </Badge>
                        )}
                      </button>
                    )}

                    {/* Dashboard in Mobile */}
                    {user && (
                      <button
                        onClick={() => {
                          handleDashboard()
                          setMobileOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-purple-50/50 transition-all"
                      >
                        <LayoutDashboard className="size-5" />
                        {getDashboardLabel(user.role, language)}
                      </button>
                    )}

                    <div className="my-2 h-px bg-border" />

                    {/* Auth Buttons in Mobile */}
                    {!user ? (
                      <div className="flex flex-col gap-3 mt-2">
                        <button
                          onClick={handleLogin}
                          className="btn-3d btn-3d-outline w-full"
                        >
                          {t('login', language)}
                        </button>
                        <button
                          onClick={handleRegister}
                          className="btn-3d btn-3d-primary w-full"
                        >
                          {t('register', language)}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          handleLogout()
                          setMobileOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <LogOut className="size-5" />
                        {t('logout', language)}
                      </button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-[#4A0E2E] via-[#5C1A3A] to-[#4A0E2E] text-white/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 sm:gap-8 py-1.5 text-xs sm:text-sm overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <MapPin className="size-3.5 text-amber-400" />
              <span className="font-bold text-amber-400">58</span>
              <span>{language === 'ar' ? 'ولاية' : 'Wilayas'}</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1.5 shrink-0">
              <Store className="size-3.5 text-amber-400" />
              <span className="font-bold text-amber-400">250+</span>
              <span>{language === 'ar' ? 'تاجر' : 'Marchands'}</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1.5 shrink-0">
              <Sparkles className="size-3.5 text-amber-400" />
              <span className="font-bold text-amber-400">120+</span>
              <span>{language === 'ar' ? 'خدمة' : 'Services'}</span>
            </div>
            <div className="w-px h-3 bg-white/20 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <Users className="size-3.5 text-amber-400" />
              <span className="font-bold text-amber-400">10K+</span>
              <span>{language === 'ar' ? 'مستخدم' : 'Utilisateurs'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
