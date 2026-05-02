'use client'

import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
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

export default function Footer() {
  const { setCurrentView, setFilterType, language } = useAppStore()

  const handleNavClick = (filter?: 'all' | 'products' | 'services') => {
    setCurrentView('home')
    if (filter) setFilterType(filter)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="mt-auto bg-deal-dark text-white">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/deal-logo-nobg.png" alt="DEAL Logo" className="h-12 w-auto" />
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              {language === 'ar'
                ? 'منصة التجارة والخدمات الجزائرية الأولى. اشترِ المنتجات، احجز الخدمات — كل شيء في مكان واحد بأسعار تنافسية وضمان الجودة.'
                : 'La première plateforme de commerce et services algérienne. Achetez des produits, réservez des services — tout en un seul endroit à des prix compétitifs avec garantie qualité.'}
            </p>
            {/* 58 Wilayas badge */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-amber-400/30">
              <MapPin className="size-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">58 {language === 'ar' ? 'ولاية' : 'Wilayas'}</span>
            </div>
            {/* Social Media */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href="#"
                aria-label={language === 'ar' ? 'فيسبوك' : 'Facebook'}
                className="flex items-center justify-center size-9 rounded-lg bg-white/10 hover:bg-amber-500 hover:text-white text-amber-400 transition-colors"
              >
                <Facebook className="size-4" />
              </a>
              <a
                href="#"
                aria-label={language === 'ar' ? 'انستغرام' : 'Instagram'}
                className="flex items-center justify-center size-9 rounded-lg bg-white/10 hover:bg-amber-500 hover:text-white text-amber-400 transition-colors"
              >
                <Instagram className="size-4" />
              </a>
              <a
                href="#"
                aria-label={language === 'ar' ? 'تويتر' : 'Twitter'}
                className="flex items-center justify-center size-9 rounded-lg bg-white/10 hover:bg-amber-500 hover:text-white text-amber-400 transition-colors"
              >
                <Twitter className="size-4" />
              </a>
              <a
                href="#"
                aria-label={language === 'ar' ? 'يوتيوب' : 'YouTube'}
                className="flex items-center justify-center size-9 rounded-lg bg-white/10 hover:bg-amber-500 hover:text-white text-amber-400 transition-colors"
              >
                <Youtube className="size-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-bold mb-4 text-amber-400">{t('quickLinks', language)}</h3>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => handleNavClick('all')}
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
                >
                  {t('home', language)}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('products')}
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
                >
                  {t('products', language)}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('services')}
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
                >
                  {t('services', language)}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    useAppStore.getState().setAuthMode('register')
                    setCurrentView('auth')
                  }}
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
                >
                  {t('becomeMerchant', language)}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    useAppStore.getState().setAuthMode('register')
                    setCurrentView('auth')
                  }}
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
                >
                  {t('offerServices', language)}
                </button>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="text-base font-bold mb-4 text-amber-400">{t('helpSupport', language)}</h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
                >
                  {language === 'ar' ? 'مركز المساعدة' : 'Centre d\'aide'}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
                >
                  {language === 'ar' ? 'سياسة الإرجاع' : 'Politique de retour'}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
                >
                  {language === 'ar' ? 'الشروط والأحكام' : 'Conditions générales'}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
                >
                  {language === 'ar' ? 'سياسة الخصوصية' : 'Politique de confidentialité'}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
                >
                  {language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-base font-bold mb-4 text-amber-400">{t('contactUs', language)}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="size-4 mt-0.5 text-amber-400 shrink-0" />
                <span className="text-sm text-white/70">
                  {language === 'ar' ? 'الجزائر العاصمة، حي دالي إبراهيم' : 'Alger, Dalil Ibrahim'}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-amber-400 shrink-0" />
                <a
                  href="tel:+213555123456"
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
                  dir="ltr"
                >
                  +213 555 123 456
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-amber-400 shrink-0" />
                <a
                  href="mailto:contact@deal.dz"
                  className="text-sm text-white/70 hover:text-amber-400 transition-colors"
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
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className={`text-xs text-white/50 ${language === 'ar' ? 'text-center sm:text-right' : 'text-center sm:text-left'}`}>
            © {new Date().getFullYear()} DEAL — {language === 'ar' ? 'منصة التجارة والخدمات الجزائرية.' : 'Plateforme de commerce et services algérienne.'} {t('allRightsReserved', language)}
          </p>
          <p className="text-xs text-white/50 flex items-center gap-1">
            {language === 'ar' ? 'صُنع بـ' : 'Fait avec'}
            <Heart className="size-3 text-red-400 fill-red-400" />
            {language === 'ar' ? 'في الجزائر' : 'en Algérie'}
          </p>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 left-6 z-40 flex items-center justify-center size-10 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-all hover:scale-105"
        aria-label={language === 'ar' ? 'العودة للأعلى' : 'Retour en haut'}
      >
        <ArrowUp className="size-5" />
      </button>
    </footer>
  )
}
