'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import {
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Heart,
  ArrowUp,
  ShieldCheck,
  FileText,
  Lock,
  Users,
  GraduationCap,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Policy content data
function getReturnPolicy(language: 'ar' | 'fr') {
  return language === 'ar' ? {
    title: 'سياسة الإرجاع',
    sections: [
      {
        heading: 'حق الإرجاع',
        content: 'يحق للزبون إرجاع أي منتج خلال 7 أيام من تاريخ الاستلام، بشرط أن يكون المنتج في حالته الأصلية ولم يتم استخدامه.'
      },
      {
        heading: 'شروط الإرجاع',
        content: 'يجب أن يكون المنتج مغلفاً بعلبته الأصلية، مع جميع الملحقات والفاتورة. المنتجات المستخدمة أو التالفة لا تقبل الإرجاع.'
      },
      {
        heading: 'إجراءات الإرجاع',
        content: 'يتواصل الزبون مع البائع عبر المنصة لطلب الإرجاع. يتم استلام المنتج من قبل البائع أو خدمة التوصيل، وبعد التحقق من حالته يتم استرداد المبلغ خلال 3-5 أيام عمل.'
      },
      {
        heading: 'الخدمات',
        content: 'الخدمات المحجوزة لا تخضع لسياسة الإرجاع، لكن يمكن إلغاء الحجز قبل 24 ساعة من الموعد المحدد.'
      },
      {
        heading: 'الاستثناءات',
        content: 'المنتجات المخصصة حسب الطلب، المواد الغذائية سريعة التلف، والمنتجات المفتوحة الختم لا تقبل الإرجاع إلا في حالة عيب مصنعي.'
      },
    ]
  } : {
    title: 'Politique de retour',
    sections: [
      {
        heading: 'Droit de retour',
        content: 'Le client a le droit de retourner tout produit dans les 7 jours suivant la réception, à condition que le produit soit dans son état d\'origine et n\'ait pas été utilisé.'
      },
      {
        heading: 'Conditions de retour',
        content: 'Le produit doit être dans son emballage d\'origine, avec tous les accessoires et la facture. Les produits utilisés ou endommagés ne sont pas acceptés.'
      },
      {
        heading: 'Procédure de retour',
        content: 'Le client contacte le vendeur via la plateforme pour demander le retour. Le produit est récupéré par le vendeur ou le service de livraison, et après vérification, le remboursement est effectué sous 3-5 jours ouvrables.'
      },
      {
        heading: 'Services',
        content: 'Les services réservés ne sont pas soumis à la politique de retour, mais la réservation peut être annulée 24h avant la date prévue.'
      },
      {
        heading: 'Exceptions',
        content: 'Les produits personnalisés, les denrées périssables et les produits déscellés ne sont pas acceptés sauf en cas de défaut de fabrication.'
      },
    ]
  }
}

function getTermsAndConditions(language: 'ar' | 'fr') {
  return language === 'ar' ? {
    title: 'الشروط والأحكام',
    sections: [
      {
        heading: 'القبول',
        content: 'باستخدام منصة DEAL، فإنك توافق على هذه الشروط والأحكام. إذا كنت لا توافق، يرجى عدم استخدام المنصة.'
      },
      {
        heading: 'التسجيل',
        content: 'يجب تقديم معلومات صحيحة عند التسجيل. كل مستخدم مسؤول عن سرية حسابه. يُمنع إنشاء حسابات متعددة.'
      },
      {
        heading: 'البيع والشراء',
        content: 'البائعون مسؤولون عن جودة منتجاتهم وخدماتهم. DEAL ليست طرفاً في المعاملات بين البائعين والمشترين بل وسيط فقط.'
      },
      {
        heading: 'العمولات',
        content: 'تحصل DEAL على عمولة بنسبة 1.5% على كل معاملة تتم عبر المنصة. يتم خصمها تلقائياً من حساب البائع.'
      },
      {
        heading: 'المحتوى المحظور',
        content: 'يُمنع عرض أو بيع المنتجات المحظورة قانونياً في الجزائر، أو المحتوى المسيء، أو المنتجات المقلدة.'
      },
      {
        heading: 'إنهاء الحساب',
        content: 'يحق لـ DEAL تعليق أو إنهاء أي حساب يخالف هذه الشروط دون إنذار مسبق.'
      },
      {
        heading: 'القانون المعمول به',
        content: 'تخضع هذه الشروط للقانون الجزائري. أي نزاع يُحال إلى المحاكم المختصة في الجزائر العاصمة.'
      },
    ]
  } : {
    title: 'Conditions générales',
    sections: [
      {
        heading: 'Acceptation',
        content: 'En utilisant la plateforme DEAL, vous acceptez ces conditions. Si vous n\'êtes pas d\'accord, veuillez ne pas utiliser la plateforme.'
      },
      {
        heading: 'Inscription',
        content: 'Vous devez fournir des informations exactes lors de l\'inscription. Chaque utilisateur est responsable de la confidentialité de son compte. La création de comptes multiples est interdite.'
      },
      {
        heading: 'Vente et achat',
        content: 'Les vendeurs sont responsables de la qualité de leurs produits et services. DEAL n\'est pas partie aux transactions entre vendeurs et acheteurs, elle sert uniquement d\'intermédiaire.'
      },
      {
        heading: 'Commissions',
        content: 'DEAL perçoit une commission de 1.5% sur chaque transaction effectuée via la plateforme. Elle est déduite automatiquement du compte du vendeur.'
      },
      {
        heading: 'Contenu interdit',
        content: 'Il est interdit de vendre des produits interdits par la loi algérienne, du contenu offensant, ou des produits contrefaits.'
      },
      {
        heading: 'Résiliation',
        content: 'DEAL se réserve le droit de suspendre ou résilier tout compte en violation de ces conditions sans préavis.'
      },
      {
        heading: 'Loi applicable',
        content: 'Ces conditions sont soumises au droit algérien. Tout litige sera soumis aux tribunaux compétents d\'Alger.'
      },
    ]
  }
}

function getPrivacyPolicy(language: 'ar' | 'fr') {
  return language === 'ar' ? {
    title: 'سياسة الخصوصية',
    sections: [
      {
        heading: 'جمع البيانات',
        content: 'نجمع بيانات أساسية مثل الاسم، البريد الإلكتروني، رقم الهاتف، والعنوان عند التسجيل. كما نجمع بيانات الاستخدام لتحسين المنصة.'
      },
      {
        heading: 'استخدام البيانات',
        content: 'تُستخدم بياناتك لتقديم خدمات المنصة، معالجة الطلبات، التواصل معك، وتحسين تجربتك. لا نبيع بياناتك لأطراف ثالثة.'
      },
      {
        heading: 'حماية البيانات',
        content: 'نستخدم تقنيات تشفير متقدمة لحماية بياناتك. كلمات المرور مشفرة ولا يمكن الوصول إليها. البيانات المالية محمية ببروتوكولات أمنية.'
      },
      {
        heading: 'مشاركة البيانات',
        content: 'قد نشارك بياناتك مع البائعين لإنجاز المعاملات، أو مع الجهات القانونية عند الطلب الرسمي فقط.'
      },
      {
        heading: 'حقوقك',
        content: 'يحق لك الوصول إلى بياناتك، تعديلها، أو طلب حذفها في أي الوقت. يمكنك تعطيل حسابك نهائياً مع حذف جميع بياناتك.'
      },
      {
        heading: 'ملفات تعريف الارتباط',
        content: 'نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح. يمكنك تعطيلها من إعدادات المتصفح، لكن ذلك قد يؤثر على بعض الوظائف.'
      },
    ]
  } : {
    title: 'Politique de confidentialité',
    sections: [
      {
        heading: 'Collecte de données',
        content: 'Nous collectons des données de base telles que le nom, l\'e-mail, le numéro de téléphone et l\'adresse lors de l\'inscription. Nous collectons également des données d\'utilisation pour améliorer la plateforme.'
      },
      {
        heading: 'Utilisation des données',
        content: 'Vos données sont utilisées pour fournir les services de la plateforme, traiter les commandes, vous contacter et améliorer votre expérience. Nous ne vendons pas vos données à des tiers.'
      },
      {
        heading: 'Protection des données',
        content: 'Nous utilisons des techniques de chiffrement avancées pour protéger vos données. Les mots de passe sont chiffrés et inaccessibles. Les données financières sont protégées par des protocoles de sécurité.'
      },
      {
        heading: 'Partage des données',
        content: 'Nous pouvons partager vos données avec les vendeurs pour compléter les transactions, ou avec les autorités légales sur demande officielle uniquement.'
      },
      {
        heading: 'Vos droits',
        content: 'Vous avez le droit d\'accéder à vos données, de les modifier ou de demander leur suppression à tout moment. Vous pouvez désactiver votre compte définitivement avec suppression de toutes vos données.'
      },
      {
        heading: 'Cookies',
        content: 'Nous utilisons des cookies pour améliorer l\'expérience de navigation. Vous pouvez les désactiver dans les paramètres du navigateur, mais cela peut affecter certaines fonctionnalités.'
      },
    ]
  }
}

export default function Footer() {
  const { setCurrentView, setFilterType, language } = useAppStore()
  const [openPolicy, setOpenPolicy] = useState<'return' | 'terms' | 'privacy' | null>(null)

  const handleNavClick = (filter?: 'all' | 'products' | 'services') => {
    setCurrentView('home')
    if (filter) setFilterType(filter)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Get policy content based on current open dialog
  function getPolicyContent() {
    if (openPolicy === 'return') return getReturnPolicy(language)
    if (openPolicy === 'terms') return getTermsAndConditions(language)
    if (openPolicy === 'privacy') return getPrivacyPolicy(language)
    return null
  }

  const policyContent = getPolicyContent()

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

          {/* Legal - Policy Cards */}
          <div>
            <h3 className="text-base font-bold mb-4 text-amber-400">{language === 'ar' ? 'القانونية' : 'Juridique'}</h3>
            <div className="space-y-2.5">
              {/* Return Policy Card */}
              <button
                onClick={() => setOpenPolicy('return')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/30 transition-all group"
              >
                <div className="flex items-center justify-center size-9 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 transition">
                  <ShieldCheck className="size-4" />
                </div>
                <span className="text-sm text-white/80 group-hover:text-amber-400 transition-colors font-bold">
                  {language === 'ar' ? 'سياسة الإرجاع' : 'Politique de retour'}
                </span>
              </button>

              {/* Terms & Conditions Card */}
              <button
                onClick={() => setOpenPolicy('terms')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/30 transition-all group"
              >
                <div className="flex items-center justify-center size-9 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition">
                  <FileText className="size-4" />
                </div>
                <span className="text-sm text-white/80 group-hover:text-amber-400 transition-colors font-bold">
                  {language === 'ar' ? 'الشروط والأحكام' : 'Conditions générales'}
                </span>
              </button>

              {/* Privacy Policy Card */}
              <button
                onClick={() => setOpenPolicy('privacy')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/30 transition-all group"
              >
                <div className="flex items-center justify-center size-9 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30 transition">
                  <Lock className="size-4" />
                </div>
                <span className="text-sm text-white/80 group-hover:text-amber-400 transition-colors font-bold">
                  {language === 'ar' ? 'سياسة الخصوصية' : 'Politique de confidentialité'}
                </span>
              </button>
            </div>
          </div>

          {/* About Us - من نحن */}
          <div>
            <h3 className="text-base font-bold mb-4 text-amber-400">
              <span className="inline-flex items-center gap-2">
                <Users className="size-4" />
                {language === 'ar' ? 'من نحن' : 'Qui sommes-nous'}
              </span>
            </h3>
            <div className="space-y-3">
              {/* Team Members */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="flex items-center justify-center size-8 rounded-full bg-amber-500/20 text-amber-400">
                    <Users className="size-3.5" />
                  </div>
                  <span className="text-sm font-bold text-amber-400">
                    {language === 'ar' ? 'فريق العمل' : 'L\'équipe'}
                  </span>
                </div>
                <ul className="space-y-1.5 mr-10">
                  <li className="text-sm text-white/70 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                    قاسمي ضياء الدين
                  </li>
                  <li className="text-sm text-white/70 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                    بوساحة لطفي
                  </li>
                  <li className="text-sm text-white/70 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                    برجم أسامة
                  </li>
                </ul>
              </div>

              {/* Academic Info */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-purple-500/10 border border-amber-400/20">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="flex items-center justify-center size-8 rounded-full bg-purple-500/20 text-purple-400">
                    <GraduationCap className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-purple-300">
                    {language === 'ar' ? 'مشروع أكاديمي' : 'Projet académique'}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed mr-10">
                  {language === 'ar'
                    ? 'ضمن متطلبات نيل شهادة الماستر — مؤسسة ناشئة'
                    : 'Dans le cadre de l\'obtention du diplôme de Master — Startup'}
                </p>
              </div>
            </div>
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

      {/* Policy Dialog */}
      <Dialog open={!!openPolicy} onOpenChange={(open) => { if (!open) setOpenPolicy(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="font-black text-xl flex items-center gap-2">
              {openPolicy === 'return' && <ShieldCheck className="size-6 text-emerald-500" />}
              {openPolicy === 'terms' && <FileText className="size-6 text-blue-500" />}
              {openPolicy === 'privacy' && <Lock className="size-6 text-purple-500" />}
              {policyContent?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {policyContent?.sections.map((section, i) => (
              <div key={i} className="space-y-1.5">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span className="flex items-center justify-center size-6 rounded-full bg-amber-100 text-amber-700 text-xs font-black shrink-0">
                    {i + 1}
                  </span>
                  {section.heading}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mr-8">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl">
                {language === 'ar' ? 'إغلاق' : 'Fermer'}
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
