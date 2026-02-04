'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Check if current page is admin area
  const isAdminPage = pathname.startsWith('/admin')

  // Check if login page with admin redirect
  const isAdminLogin = pathname === '/login' &&
    searchParams.get('redirect')?.startsWith('/admin')

  // Hide header/footer for admin pages and admin login
  const hideLayout = isAdminPage || isAdminLogin

  if (hideLayout) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <div className="h-16 bg-white shadow-sm" /> {/* Header placeholder */}
        <main className="flex-grow">{children}</main>
        <div className="h-32 bg-gray-900" /> {/* Footer placeholder */}
      </div>
    }>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  )
}
