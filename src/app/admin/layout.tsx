import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Calendar, Users, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-gray-800 text-white hidden md:block">
          <div className="p-4 border-b border-gray-700">
            <Link href="/admin" className="text-xl font-bold text-green-400">
              管理画面
            </Link>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  ダッシュボード
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/programs"
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  プログラム管理
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/bookings"
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  申込者一覧
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/payments"
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <CreditCard className="w-5 h-5" />
                  決済確認
                </Link>
              </li>
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-700 mt-auto">
            <Link
              href="/"
              className="text-gray-400 hover:text-white text-sm"
            >
              ユーザーサイトへ
            </Link>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-800 text-white p-4 z-50">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="text-lg font-bold text-green-400">
              管理画面
            </Link>
            <div className="flex gap-4">
              <Link href="/admin" className="p-2">
                <LayoutDashboard className="w-5 h-5" />
              </Link>
              <Link href="/admin/programs" className="p-2">
                <Calendar className="w-5 h-5" />
              </Link>
              <Link href="/admin/bookings" className="p-2">
                <Users className="w-5 h-5" />
              </Link>
              <Link href="/admin/payments" className="p-2">
                <CreditCard className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-0 mt-16 md:mt-0">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
