# Task 3-b: Add Profile Tab to CustomerDashboard and AdminDashboard

## Work Log

- Read worklog.md to understand project context and previous work
- Read CustomerDashboard.tsx, AdminDashboard.tsx, and ProfileEditModal.tsx to understand current code
- Verified `setUser` is exported from store.ts for refreshUser function

### CustomerDashboard Updates
- Added `ProfileEditModal` import from `@/components/deal/ProfileEditModal`
- Added `type User` to the `useAppStore` import
- Added `profileEditOpen` state with `useState(false)`
- Added `refreshUser()` async function that fetches `/api/users/${user.id}` and calls `useAppStore.getState().setUser(data.data)`
- Added profile TabsTrigger as the LAST tab: `👤 {t('editProfile', language)}`
- Added TabsContent for profile with:
  - ProfileEditModal shown when profileEditOpen is true (with onClose and onSaved callbacks)
  - Profile summary Card when profileEditOpen is false (avatar with purple-violet gradient, username, email, phone, wilaya, edit button)

### AdminDashboard Updates
- Added `ProfileEditModal` import from `@/components/deal/ProfileEditModal`
- Added `type User` to the `useAppStore` import
- Added `profileEditOpen` state with `useState(false)`
- Added `refreshUser()` async function (same pattern as CustomerDashboard)
- Added profile TabsTrigger as the LAST tab with `text-xs` class (matching admin style): `👤 {t('editProfile', language)}`
- Added TabsContent for profile with:
  - ProfileEditModal shown when profileEditOpen is true (using `user as any` cast since admin user type may differ)
  - Profile summary Card when profileEditOpen is false (avatar with red-purple gradient, admin badge with `👑 {isArabic ? 'مدير' : 'Admin'}`, username, email, phone, wilaya, edit button)

### Lint Check
- Zero lint errors after all changes

## Stage Summary
- Both CustomerDashboard and AdminDashboard now have a "Profile" tab as the last tab
- Profile tab shows a profile summary card with edit button
- Clicking edit opens the ProfileEditModal for full profile editing
- refreshUser() updates the global store after profile save
- Zero lint errors
