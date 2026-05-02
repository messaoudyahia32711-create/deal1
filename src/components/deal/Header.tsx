'use client'

import { useState } from 'react'
import { useAppStore, type UserRole } from '@/lib/store'
import {
  Menu,
  ShoppingCart,
  Bell,
  LogOut,
  LayoutDashboard,
  User,
  ChevronDown,
  X,
  Home,
  Package,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
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

function getDashboardLabel(role: UserRole) {
  switch (role) {
    case 'admin':
      return 'لوحة الإدارة'
    case 'merchant':
      return 'لوحة التاجر'
    case 'service_provider':
      return 'لوحة مقدم الخدمة'
    case 'customer':
      return 'لوحة التحكم'
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
  } = useAppStore()

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const cartItemCount = cart.length
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const navLinks = [
    {
      label: 'الرئيسية',
      icon: Home,
      onClick: () => handleNavClick('home', 'all'),
      active: currentView === 'home' && useAppStore.getState().filterType === 'all',
    },
    {
      label: 'المنتجات',
      icon: Package,
      onClick: () => handleNavClick('home', 'products'),
      active: currentView === 'home' && useAppStore.getState().filterType === 'products',
    },
    {
      label: 'الخدمات',
      icon: Wrench,
      onClick: () => handleNavClick('home', 'services'),
      active: currentView === 'home' && useAppStore.getState().filterType === 'services',
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleNavClick('home', 'all')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-primary">
                DEAL
              </span>
              <span className="text-2xl" role="img" aria-label="مصافحة">
                🤝
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={link.onClick}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  currentView === 'home' &&
                  ((link.label === 'الرئيسية' && useAppStore.getState().filterType === 'all') ||
                    (link.label === 'المنتجات' && useAppStore.getState().filterType === 'products') ||
                    (link.label === 'الخدمات' && useAppStore.getState().filterType === 'services'))
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <link.icon className="size-4" />
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button */}
            {user && user.role === 'customer' && (
              <button
                onClick={handleCart}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="سلة التسوق"
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
                  /* Navigate to notifications - handled via dashboard */
                  handleDashboard()
                }}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="الإشعارات"
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 flex size-5 items-center justify-center rounded-full bg-deal-warning text-[10px] font-bold text-white animate-pulse-glow">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth Buttons - Desktop */}
            {!user && (
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={handleLogin} className="btn-3d btn-3d-outline text-sm">
                  تسجيل الدخول
                </button>
                <button onClick={handleRegister} className="btn-3d btn-3d-primary text-sm">
                  إنشاء حساب
                </button>
              </div>
            )}

            {/* User Dropdown - Desktop */}
            {user && (
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar className="size-8 border-2 border-primary/20">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block text-sm font-semibold text-foreground max-w-[100px] truncate">
                      {user.username}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
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
                    <LayoutDashboard className="size-4 ml-2" />
                    {getDashboardLabel(user.role)}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      handleDashboard()
                    }}
                    className="cursor-pointer"
                  >
                    <Bell className="size-4 ml-2" />
                    الإشعارات
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
                    <LogOut className="size-4 ml-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="size-5" />
                  <span className="sr-only">القائمة</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-right">
                    <span className="text-2xl font-black text-primary">DEAL</span>
                    <span className="text-xl">🤝</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-2 px-4 mt-4">
                  {/* Nav Links */}
                  {navLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={link.onClick}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        currentView === 'home' &&
                        ((link.label === 'الرئيسية' && useAppStore.getState().filterType === 'all') ||
                          (link.label === 'المنتجات' && useAppStore.getState().filterType === 'products') ||
                          (link.label === 'الخدمات' && useAppStore.getState().filterType === 'services'))
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    >
                      <div className="relative">
                        <ShoppingCart className="size-5" />
                        {cartItemCount > 0 && (
                          <span className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full bg-deal-danger text-[9px] font-bold text-white">
                            {cartItemCount}
                          </span>
                        )}
                      </div>
                      سلة التسوق
                    </button>
                  )}

                  {/* Notifications in Mobile */}
                  {user && (
                    <button
                      onClick={() => {
                        handleDashboard()
                        setMobileOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    >
                      <div className="relative">
                        <Bell className="size-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full bg-deal-warning text-[9px] font-bold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      الإشعارات
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
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    >
                      <LayoutDashboard className="size-5" />
                      {getDashboardLabel(user.role)}
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
                        تسجيل الدخول
                      </button>
                      <button
                        onClick={handleRegister}
                        className="btn-3d btn-3d-primary w-full"
                      >
                        إنشاء حساب
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
                      تسجيل الخروج
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
