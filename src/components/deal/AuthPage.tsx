'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type UserRole, WILAYAS, WILAYAS_FR } from '@/lib/store'
import { t } from '@/lib/i18n'
import { Eye, EyeOff, User, Store, Wrench, Phone, MapPin, FileText, Award, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AuthPage() {
  const { authMode, setAuthMode, setUser, setCurrentView, language, setLanguage } = useAppStore()
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // RTL/LTR switching
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regWilaya, setRegWilaya] = useState('')
  const [regStoreName, setRegStoreName] = useState('')
  const [regRegNumber, setRegRegNumber] = useState('')
  const [regSpecialty, setRegSpecialty] = useState('')
  const [regExperience, setRegExperience] = useState('0')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: loginEmail, password: loginPassword }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setUser(data.data)
        const role = data.data.role
        if (role === 'admin') setCurrentView('admin-dashboard')
        else if (role === 'merchant') setCurrentView('merchant-dashboard')
        else if (role === 'service_provider') setCurrentView('provider-dashboard')
        else setCurrentView('customer-dashboard')
      }
    } catch {
      setError(language === 'ar' ? 'حدث خطأ في الاتصال' : 'Erreur de connexion')
    }
    setLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        action: 'register',
        username: regUsername,
        email: regEmail,
        password: regPassword,
        role: selectedRole,
        phone: regPhone,
        wilaya: regWilaya,
      }
      if (selectedRole === 'merchant') {
        body.storeName = regStoreName
        body.regNumber = regRegNumber
      }
      if (selectedRole === 'service_provider') {
        body.specialty = regSpecialty
        body.experience = parseInt(regExperience)
      }
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setUser(data.data)
        const role = data.data.role
        if (role === 'merchant') setCurrentView('merchant-dashboard')
        else if (role === 'service_provider') setCurrentView('provider-dashboard')
        else setCurrentView('customer-dashboard')
      }
    } catch {
      setError(language === 'ar' ? 'حدث خطأ في الاتصال' : 'Erreur de connexion')
    }
    setLoading(false)
  }

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'fr' : 'ar')
  }

  const wilayaList = language === 'ar' ? WILAYAS : WILAYAS_FR

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4A0E2E] to-[#6B1D45] p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Language Toggle - Top Right */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white/90 transition-all backdrop-blur-sm"
          >
            <Globe className="size-3.5" />
            {language === 'ar' ? 'عربي | FR' : 'AR | Français'}
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">
            <span className="gold-shimmer">DEAL</span>
            <img src="/deal-logo-nobg.png" alt="" className="h-8 w-auto inline-block ml-2 align-middle" />
          </h1>
          <p className="text-white/70 text-sm">
            {language === 'ar' ? 'منصة التجارة والخدمات الجزائرية' : 'Plateforme de commerce et services algérienne'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-white/50">
          {/* Mode Toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setAuthMode('login'); setError('') }}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                authMode === 'login'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              {t('login', language)}
            </button>
            <button
              onClick={() => { setAuthMode('register'); setError('') }}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              {t('register', language)}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold text-center">
              {error}
            </div>
          )}

          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="font-bold mb-1 block">{t('email', language)}</Label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="example@email.com"
                  className={`${language === 'ar' ? 'text-right' : 'text-left'} h-12 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                  required
                />
              </div>
              <div>
                <Label className="font-bold mb-1 block">{t('password', language)}</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${language === 'ar' ? 'text-right' : 'text-left'} h-12 rounded-xl ${language === 'ar' ? 'pl-10' : 'pr-10'} focus:ring-amber-400 focus:border-amber-400`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'left-3' : 'right-3'}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-3d btn-3d-primary w-full text-lg h-12"
              >
                {loading ? t('loading', language) : t('login', language)}
              </button>

              {/* Quick login buttons for demo */}
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-gray-400 text-center mb-3">{t('quickLogin', language)}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setLoginEmail('admin@deal.dz'); setLoginPassword('demo123') }}
                    className="text-xs bg-amber-50 hover:bg-amber-100 p-2.5 rounded-xl font-bold border border-amber-200 transition-all hover:shadow-md text-amber-800"
                  >
                    👑 {t('admin', language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginEmail('noor@deal.dz'); setLoginPassword('demo123') }}
                    className="text-xs bg-purple-50 hover:bg-purple-100 p-2.5 rounded-xl font-bold border border-purple-200 transition-all hover:shadow-md text-purple-800"
                  >
                    🏪 {t('merchant', language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginEmail('karim@deal.dz'); setLoginPassword('demo123') }}
                    className="text-xs bg-amber-50 hover:bg-amber-100 p-2.5 rounded-xl font-bold border border-amber-200 transition-all hover:shadow-md text-amber-800"
                  >
                    🔧 {t('serviceProvider', language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginEmail('fatima@deal.dz'); setLoginPassword('demo123') }}
                    className="text-xs bg-purple-50 hover:bg-purple-100 p-2.5 rounded-xl font-bold border border-purple-200 transition-all hover:shadow-md text-purple-800"
                  >
                    👤 {t('customer', language)}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Register Form */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role Selection */}
              <div>
                <Label className="font-bold mb-2 block">
                  {language === 'ar' ? 'نوع الحساب' : 'Type de compte'}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'customer' as UserRole, icon: <User className="w-5 h-5" />, label: t('customer', language) },
                    { role: 'merchant' as UserRole, icon: <Store className="w-5 h-5" />, label: t('merchant', language) },
                    { role: 'service_provider' as UserRole, icon: <Wrench className="w-5 h-5" />, label: t('serviceProvider', language) },
                  ].map(({ role, icon, label }) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`p-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-1 transition-all ${
                        selectedRole === role
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-bold mb-1 block">{t('username', language)}</Label>
                <Input
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  placeholder={language === 'ar' ? 'اسمك الكامل' : 'Votre nom complet'}
                  className={`${language === 'ar' ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                  required
                />
              </div>

              <div>
                <Label className="font-bold mb-1 block">{t('email', language)}</Label>
                <Input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="example@email.com"
                  className={`${language === 'ar' ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                  required
                />
              </div>

              <div>
                <Label className="font-bold mb-1 block">{t('password', language)}</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${language === 'ar' ? 'text-right' : 'text-left'} h-11 rounded-xl ${language === 'ar' ? 'pl-10' : 'pr-10'} focus:ring-amber-400 focus:border-amber-400`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'left-3' : 'right-3'}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="font-bold mb-1 block">
                  <Phone className="w-3 h-3 inline mx-1" />
                  {t('phone', language)}
                </Label>
                <Input
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className={`${language === 'ar' ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="font-bold mb-1 block">
                  <MapPin className="w-3 h-3 inline mx-1" />
                  {t('wilaya', language)}
                </Label>
                <Select value={regWilaya} onValueChange={setRegWilaya}>
                  <SelectTrigger className="rounded-xl h-11 focus:ring-amber-400">
                    <SelectValue placeholder={language === 'ar' ? 'اختر الولاية' : 'Choisir la wilaya'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {wilayaList.map((w, i) => <SelectItem key={i} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Merchant extra fields */}
              {selectedRole === 'merchant' && (
                <>
                  <div>
                    <Label className="font-bold mb-1 block">
                      <Store className="w-3 h-3 inline mx-1" />
                      {t('storeName', language)}
                    </Label>
                    <Input
                      value={regStoreName}
                      onChange={e => setRegStoreName(e.target.value)}
                      placeholder={language === 'ar' ? 'اسم متجرك' : 'Nom de votre magasin'}
                      className={`${language === 'ar' ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-bold mb-1 block">
                      <FileText className="w-3 h-3 inline mx-1" />
                      {t('regNumber', language)}
                    </Label>
                    <Input
                      value={regRegNumber}
                      onChange={e => setRegRegNumber(e.target.value)}
                      placeholder={language === 'ar' ? 'رقم السجل' : 'Numéro de registre'}
                      className={`${language === 'ar' ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                      dir="ltr"
                    />
                  </div>
                </>
              )}

              {/* Service Provider extra fields */}
              {selectedRole === 'service_provider' && (
                <>
                  <div>
                    <Label className="font-bold mb-1 block">
                      <Award className="w-3 h-3 inline mx-1" />
                      {t('specialty', language)}
                    </Label>
                    <Input
                      value={regSpecialty}
                      onChange={e => setRegSpecialty(e.target.value)}
                      placeholder={language === 'ar' ? 'مثال: سباكة، كهرباء...' : 'Ex: plomberie, électricité...'}
                      className={`${language === 'ar' ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-bold mb-1 block">{t('experience', language)}</Label>
                    <Input
                      type="number"
                      value={regExperience}
                      onChange={e => setRegExperience(e.target.value)}
                      min="0"
                      className={`${language === 'ar' ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                      dir="ltr"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-3d btn-3d-primary w-full text-lg h-12"
              >
                {loading ? t('loading', language) : t('register', language)}
              </button>
            </form>
          )}

          <button
            onClick={() => setCurrentView('home')}
            className={`w-full text-center text-sm text-gray-400 hover:text-amber-600 mt-4 font-bold transition-colors ${language === 'ar' ? '' : ''}`}
          >
            {language === 'ar' ? '← العودة إلى الصفحة الرئيسية' : '← Retour à l\'accueil'}
          </button>
        </div>
      </div>
    </div>
  )
}
