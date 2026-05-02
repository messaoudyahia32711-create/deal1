'use client'

import { useAppStore } from '@/lib/store'
import Header from '@/components/deal/Header'
import Footer from '@/components/deal/Footer'
import HomePage from '@/components/deal/HomePage'
import AuthPage from '@/components/deal/AuthPage'
import MerchantDashboard from '@/components/deal/MerchantDashboard'
import ProviderDashboard from '@/components/deal/ProviderDashboard'
import CustomerDashboard from '@/components/deal/CustomerDashboard'
import AdminDashboard from '@/components/deal/AdminDashboard'

export default function DealPlatform() {
  const { currentView } = useAppStore()

  function renderView() {
    switch (currentView) {
      case 'home':
        return <HomePage />
      case 'auth':
        return <AuthPage />
      case 'merchant-dashboard':
        return <MerchantDashboard />
      case 'provider-dashboard':
        return <ProviderDashboard />
      case 'customer-dashboard':
        return <CustomerDashboard />
      case 'admin-dashboard':
        return <AdminDashboard />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {renderView()}
      </main>
      {currentView === 'home' && <Footer />}
    </div>
  )
}
