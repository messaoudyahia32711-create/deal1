'use client'

import { useState } from 'react'
import { type User, type Language, WILAYAS, WILAYAS_FR } from '@/lib/store'
import { t } from '@/lib/i18n'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Store,
  FileText,
  Award,
  Briefcase,
  Lock,
  Save,
  Loader2,
} from 'lucide-react'

interface ProfileEditModalProps {
  user: User
  language: Language
  onClose: () => void
  onSaved: () => void
}

export default function ProfileEditModal({ user, language, onClose, onSaved }: ProfileEditModalProps) {
  const { toast } = useToast()
  const isRTL = language === 'ar'
  const wilayaList = isRTL ? WILAYAS : WILAYAS_FR

  // Basic info state
  const [username, setUsername] = useState(user.username || '')
  const [email, setEmail] = useState(user.email || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [address, setAddress] = useState(user.address || '')
  const [wilaya, setWilaya] = useState(user.wilaya || '')

  // Role-specific state
  const [storeName, setStoreName] = useState(user.storeName || '')
  const [regNumber, setRegNumber] = useState(user.regNumber || '')
  const [specialty, setSpecialty] = useState(user.specialty || '')
  const [experience, setExperience] = useState(user.experience?.toString() || '')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Loading state
  const [saving, setSaving] = useState(false)

  const isMerchant = user.role === 'merchant'
  const isServiceProvider = user.role === 'service_provider'
  const isRentalProvider = user.role === 'rental_provider'
  const hasProfessionalInfo = isMerchant || isServiceProvider || isRentalProvider

  // Get label for storeName based on role
  function getStoreNameLabel() {
    if (isRentalProvider) return t('establishmentName', language)
    return t('storeName', language)
  }

  // Get label for specialty based on role
  function getSpecialtyLabel() {
    if (isRentalProvider) return t('equipmentSpecialty', language)
    return t('specialty', language)
  }

  // Get placeholder for storeName based on role
  function getStoreNamePlaceholder() {
    if (isRentalProvider) {
      return isRTL ? 'اسم المؤسسة' : "Nom de l'établissement"
    }
    return isRTL ? 'اسم المتجر' : 'Nom du magasin'
  }

  // Get placeholder for specialty based on role
  function getSpecialtyPlaceholder() {
    if (isRentalProvider) {
      return isRTL ? 'مثال: معدات بناء، رافعات...' : 'Ex: matériel de construction, grues...'
    }
    return isRTL ? 'مثال: سباكة، كهرباء...' : 'Ex: plomberie, électricité...'
  }

  async function handleSave() {
    // Validate password fields if any are filled
    const hasPasswordChange = newPassword || confirmPassword || currentPassword

    if (hasPasswordChange) {
      if (!currentPassword) {
        toast({
          title: isRTL ? 'خطأ' : 'Erreur',
          description: isRTL ? 'يجب إدخال كلمة المرور الحالية' : 'Le mot de passe actuel est requis',
          variant: 'destructive',
        })
        return
      }
      if (newPassword.length < 6) {
        toast({
          title: isRTL ? 'خطأ' : 'Erreur',
          description: t('passwordTooShort', language),
          variant: 'destructive',
        })
        return
      }
      if (newPassword !== confirmPassword) {
        toast({
          title: isRTL ? 'خطأ' : 'Erreur',
          description: t('passwordMismatch', language),
          variant: 'destructive',
        })
        return
      }
    }

    setSaving(true)

    try {
      const body: Record<string, unknown> = {
        username,
        email,
        phone: phone || undefined,
        address: address || undefined,
        wilaya: wilaya || undefined,
      }

      // Role-specific fields
      if (isMerchant) {
        body.storeName = storeName || undefined
        body.regNumber = regNumber || undefined
      }
      if (isServiceProvider) {
        body.specialty = specialty || undefined
        body.experience = experience ? parseInt(experience) : undefined
      }
      if (isRentalProvider) {
        body.storeName = storeName || undefined
        body.specialty = specialty || undefined
        body.experience = experience ? parseInt(experience) : undefined
      }

      // Password field
      if (hasPasswordChange && newPassword) {
        body.password = newPassword
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: isRTL ? 'خطأ' : 'Erreur',
          description: data.error || (isRTL ? 'حدث خطأ في التحديث' : 'Erreur lors de la mise à jour'),
          variant: 'destructive',
        })
        setSaving(false)
        return
      }

      // Success toast
      toast({
        title: t('profileUpdated', language),
        description: hasPasswordChange ? t('passwordChanged', language) : (isRTL ? 'تم حفظ التغييرات' : 'Modifications enregistrées'),
      })

      onSaved()
      onClose()
    } catch {
      toast({
        title: isRTL ? 'خطأ' : 'Erreur',
        description: isRTL ? 'حدث خطأ في الاتصال' : 'Erreur de connexion',
        variant: 'destructive',
      })
    }

    setSaving(false)
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-amber-50 to-yellow-50">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-amber-800">
            <UserIcon className="w-5 h-5" />
            {t('editProfile', language)}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Personal Info Section */}
          <div>
            <h3 className="font-bold text-sm text-amber-700 mb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              {t('personalInfo', language)}
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="font-bold mb-1 block text-sm">
                  <UserIcon className="w-3 h-3 inline mx-1" />
                  {t('username', language)}
                </Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isRTL ? 'اسم المستخدم' : "Nom d'utilisateur"}
                  className={`${isRTL ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <Label className="font-bold mb-1 block text-sm">
                  <Mail className="w-3 h-3 inline mx-1" />
                  {t('email', language)}
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className={`${isRTL ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="font-bold mb-1 block text-sm">
                  <Phone className="w-3 h-3 inline mx-1" />
                  {t('phone', language)}
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className={`${isRTL ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="font-bold mb-1 block text-sm">
                  <MapPin className="w-3 h-3 inline mx-1" />
                  {t('wilaya', language)}
                </Label>
                <Select value={wilaya} onValueChange={setWilaya}>
                  <SelectTrigger className="rounded-xl h-11 focus:ring-amber-400">
                    <SelectValue placeholder={isRTL ? 'اختر الولاية' : 'Choisir la wilaya'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {wilayaList.map((w, i) => (
                      <SelectItem key={i} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-bold mb-1 block text-sm">
                  <MapPin className="w-3 h-3 inline mx-1" />
                  {t('address', language)}
                </Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isRTL ? 'العنوان الكامل' : 'Adresse complète'}
                  className={`${isRTL ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
          </div>

          {/* Professional Info Section */}
          {hasProfessionalInfo && (
            <>
              <Separator />
              <div>
                <h3 className="font-bold text-sm text-amber-700 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {t('professionalInfo', language)}
                </h3>
                <div className="space-y-3">
                  {/* Store Name - Merchant & Rental Provider */}
                  {(isMerchant || isRentalProvider) && (
                    <div>
                      <Label className="font-bold mb-1 block text-sm">
                        <Store className="w-3 h-3 inline mx-1" />
                        {getStoreNameLabel()}
                      </Label>
                      <Input
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder={getStoreNamePlaceholder()}
                        className={`${isRTL ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                  )}

                  {/* Reg Number - Merchant */}
                  {isMerchant && (
                    <div>
                      <Label className="font-bold mb-1 block text-sm">
                        <FileText className="w-3 h-3 inline mx-1" />
                        {t('regNumber', language)}
                      </Label>
                      <Input
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        placeholder={isRTL ? 'رقم السجل التجاري' : 'Numéro de registre'}
                        className={`${isRTL ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                        dir="ltr"
                      />
                    </div>
                  )}

                  {/* Specialty - Service Provider & Rental Provider */}
                  {(isServiceProvider || isRentalProvider) && (
                    <div>
                      <Label className="font-bold mb-1 block text-sm">
                        <Award className="w-3 h-3 inline mx-1" />
                        {getSpecialtyLabel()}
                      </Label>
                      <Input
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder={getSpecialtyPlaceholder()}
                        className={`${isRTL ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                  )}

                  {/* Experience - Service Provider & Rental Provider */}
                  {(isServiceProvider || isRentalProvider) && (
                    <div>
                      <Label className="font-bold mb-1 block text-sm">
                        <Award className="w-3 h-3 inline mx-1" />
                        {t('experience', language)}
                      </Label>
                      <Input
                        type="number"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        min="0"
                        placeholder="0"
                        className={`${isRTL ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                        dir="ltr"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Change Password Section */}
          <Separator />
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
            <h3 className="font-bold text-sm text-amber-700 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t('changePassword', language)}
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="font-bold mb-1 block text-sm">
                  {t('currentPassword', language)}
                </Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${isRTL ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="font-bold mb-1 block text-sm">
                  {t('newPassword', language)}
                </Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${isRTL ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="font-bold mb-1 block text-sm">
                  {t('confirmPassword', language)}
                </Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${isRTL ? 'text-right' : 'text-left'} h-11 rounded-xl focus:ring-amber-400 focus:border-amber-400`}
                  dir="ltr"
                />
                {confirmPassword && newPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1 font-bold">
                    {t('passwordMismatch', language)}
                  </p>
                )}
                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-red-500 mt-1 font-bold">
                    {t('passwordTooShort', language)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t bg-gray-50/50 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl font-bold"
            disabled={saving}
          >
            {t('cancel', language)}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md hover:shadow-lg transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? t('loading', language) : t('save', language)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
