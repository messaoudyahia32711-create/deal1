'use client'

import { useAppStore } from '@/lib/store'
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Heart,
  ArrowUp,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function Footer() {
  const { setCurrentView, setFilterType, setUser } = useAppStore()

  const handleNavClick = (filter?: 'all' | 'products' | 'services') => {
    setCurrentView('home')
    if (filter) setFilterType(filter)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="mt-auto bg-foreground text-background">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl font-black text-primary">DEAL</span>
              <span className="text-2xl" role="img" aria-label="مصافحة">🤝</span>
            </div>
            <p className="text-sm text-background/70 leading-relaxed max-w-xs">
              منصة التجارة والخدمات الجزائرية الأولى. اشترِ المنتجات، احجز الخدمات — كل شيء
              في مكان واحد بأسعار تنافسية وضمان الجودة.
            </p>
            {/* Social Media */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href="#"
                aria-label="فيسبوك"
                className="flex items-center justify-center size-9 rounded-lg bg-background/10 hover:bg-primary hover:text-white transition-colors"
              >
                <Facebook className="size-4" />
              </a>
              <a
                href="#"
                aria-label="انستغرام"
                className="flex items-center justify-center size-9 rounded-lg bg-background/10 hover:bg-primary hover:text-white transition-colors"
              >
                <Instagram className="size-4" />
              </a>
              <a
                href="#"
                aria-label="تويتر"
                className="flex items-center justify-center size-9 rounded-lg bg-background/10 hover:bg-primary hover:text-white transition-colors"
              >
                <Twitter className="size-4" />
              </a>
              <a
                href="#"
                aria-label="يوتيوب"
                className="flex items-center justify-center size-9 rounded-lg bg-background/10 hover:bg-primary hover:text-white transition-colors"
              >
                <Youtube className="size-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-bold mb-4 text-primary">روابط سريعة</h3>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => handleNavClick('all')}
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                >
                  الرئيسية
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('products')}
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                >
                  المنتجات
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('services')}
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                >
                  الخدمات
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    useAppStore.getState().setAuthMode('register')
                    setCurrentView('auth')
                  }}
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                >
                  كن تاجراً
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    useAppStore.getState().setAuthMode('register')
                    setCurrentView('auth')
                  }}
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                >
                  قدّم خدماتك
                </button>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="text-base font-bold mb-4 text-primary">المساعدة والدعم</h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#"
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                >
                  مركز المساعدة
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                >
                  سياسة الإرجاع
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                >
                  الشروط والأحكام
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                >
                  سياسة الخصوصية
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                >
                  الأسئلة الشائعة
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-base font-bold mb-4 text-primary">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="size-4 mt-0.5 text-primary shrink-0" />
                <span className="text-sm text-background/70">
                  الجزائر العاصمة، حي دالي إبراهيم
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-primary shrink-0" />
                <a
                  href="tel:+213555123456"
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                  dir="ltr"
                >
                  +213 555 123 456
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-primary shrink-0" />
                <a
                  href="mailto:contact@deal.dz"
                  className="text-sm text-background/70 hover:text-primary transition-colors"
                  dir="ltr"
                >
                  contact@deal.dz
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-background/50 text-center sm:text-right">
            © {new Date().getFullYear()} DEAL — منصة التجارة والخدمات الجزائرية. جميع الحقوق
            محفوظة.
          </p>
          <p className="text-xs text-background/50 flex items-center gap-1">
            صُنع بـ
            <Heart className="size-3 text-deal-danger fill-deal-danger" />
            في الجزائر
          </p>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 left-6 z-40 flex items-center justify-center size-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
        aria-label="العودة للأعلى"
      >
        <ArrowUp className="size-5" />
      </button>
    </footer>
  )
}
