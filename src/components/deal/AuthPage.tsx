'use client'

import { useState } from 'react'
import { useAppStore, type UserRole, WILAYAS } from '@/lib/store'
import { Eye, EyeOff, User, Store, Wrench, Shield, Phone, MapPin, FileText, Award } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AuthPage() {
  const { authMode, setAuthMode, setUser, setCurrentView } = useAppStore()
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      setError('حدث خطأ في الاتصال')
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
      setError('حدث خطأ في الاتصال')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-green-600 mb-2">🤝 DEAL</h1>
          <p className="text-gray-500">منصة التجارة والخدمات الجزائرية</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border">
          {/* Mode Toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setAuthMode('login'); setError('') }}
              className={`flex-1 py-3 rounded-lg font-bold transition ${authMode === 'login' ? 'bg-green-500 text-white shadow-md' : 'hover:bg-gray-200'}`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setAuthMode('register'); setError('') }}
              className={`flex-1 py-3 rounded-lg font-bold transition ${authMode === 'register' ? 'bg-green-500 text-white shadow-md' : 'hover:bg-gray-200'}`}
            >
              إنشاء حساب
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
                <Label className="font-bold mb-1 block">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="text-right h-12 rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="font-bold mb-1 block">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="text-right h-12 rounded-xl pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
              </button>

              {/* Quick login buttons for demo */}
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-gray-400 text-center mb-3">تسجيل دخول سريع للعرض التجريبي:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setLoginEmail('admin@deal.dz'); setLoginPassword('demo123') }} className="text-xs bg-amber-50 hover:bg-amber-100 p-2.5 rounded-xl font-bold border border-amber-200 transition-all hover:shadow-md">👑 مدير النظام</button>
                  <button type="button" onClick={() => { setLoginEmail('noor@deal.dz'); setLoginPassword('demo123') }} className="text-xs bg-green-50 hover:bg-green-100 p-2.5 rounded-xl font-bold border border-green-200 transition-all hover:shadow-md">🏪 تاجر</button>
                  <button type="button" onClick={() => { setLoginEmail('karim@deal.dz'); setLoginPassword('demo123') }} className="text-xs bg-blue-50 hover:bg-blue-100 p-2.5 rounded-xl font-bold border border-blue-200 transition-all hover:shadow-md">🔧 مزود خدمة</button>
                  <button type="button" onClick={() => { setLoginEmail('fatima@deal.dz'); setLoginPassword('demo123') }} className="text-xs bg-purple-50 hover:bg-purple-100 p-2.5 rounded-xl font-bold border border-purple-200 transition-all hover:shadow-md">👤 زبون</button>
                </div>
              </div>
            </form>
          )}

          {/* Register Form */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role Selection */}
              <div>
                <Label className="font-bold mb-2 block">نوع الحساب</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'customer' as UserRole, icon: <User className="w-5 h-5" />, label: 'زبون' },
                    { role: 'merchant' as UserRole, icon: <Store className="w-5 h-5" />, label: 'تاجر' },
                    { role: 'service_provider' as UserRole, icon: <Wrench className="w-5 h-5" />, label: 'مزود خدمة' },
                  ].map(({ role, icon, label }) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`p-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-1 transition ${selectedRole === role ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300'}`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-bold mb-1 block">اسم المستخدم</Label>
                <Input value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="اسمك الكامل" className="text-right h-11 rounded-xl" required />
              </div>

              <div>
                <Label className="font-bold mb-1 block">البريد الإلكتروني</Label>
                <Input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="example@email.com" className="text-right h-11 rounded-xl" required />
              </div>

              <div>
                <Label className="font-bold mb-1 block">كلمة المرور</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" className="text-right h-11 rounded-xl pl-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="font-bold mb-1 block"><Phone className="w-3 h-3 inline ml-1" />رقم الهاتف</Label>
                <Input value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="07XXXXXXXX" className="text-right h-11 rounded-xl" dir="ltr" />
              </div>

              <div>
                <Label className="font-bold mb-1 block"><MapPin className="w-3 h-3 inline ml-1" />الولاية</Label>
                <Select value={regWilaya} onValueChange={setRegWilaya}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {WILAYAS.map((w, i) => <SelectItem key={i} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Merchant extra fields */}
              {selectedRole === 'merchant' && (
                <>
                  <div>
                    <Label className="font-bold mb-1 block"><Store className="w-3 h-3 inline ml-1" />اسم المتجر</Label>
                    <Input value={regStoreName} onChange={e => setRegStoreName(e.target.value)} placeholder="اسم متجرك" className="text-right h-11 rounded-xl" required />
                  </div>
                  <div>
                    <Label className="font-bold mb-1 block"><FileText className="w-3 h-3 inline ml-1" />رقم السجل التجاري</Label>
                    <Input value={regRegNumber} onChange={e => setRegRegNumber(e.target.value)} placeholder="رقم السجل" className="text-right h-11 rounded-xl" dir="ltr" />
                  </div>
                </>
              )}

              {/* Service Provider extra fields */}
              {selectedRole === 'service_provider' && (
                <>
                  <div>
                    <Label className="font-bold mb-1 block"><Award className="w-3 h-3 inline ml-1" />التخصص</Label>
                    <Input value={regSpecialty} onChange={e => setRegSpecialty(e.target.value)} placeholder="مثال: سباكة، كهرباء..." className="text-right h-11 rounded-xl" required />
                  </div>
                  <div>
                    <Label className="font-bold mb-1 block">سنوات الخبرة</Label>
                    <Input type="number" value={regExperience} onChange={e => setRegExperience(e.target.value)} min="0" className="text-right h-11 rounded-xl" dir="ltr" />
                  </div>
                </>
              )}

              <button type="submit" disabled={loading} className="btn-3d btn-3d-primary w-full text-lg h-12">
                {loading ? 'جاري التحميل...' : 'إنشاء الحساب'}
              </button>
            </form>
          )}

          <button onClick={() => setCurrentView('home')} className="w-full text-center text-sm text-gray-400 hover:text-green-600 mt-4 font-bold">
            ← العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  )
}
