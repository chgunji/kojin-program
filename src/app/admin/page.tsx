import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar, Users, CreditCard, TrendingUp } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '管理ダッシュボード',
}

// Prevent static generation - this page requires runtime environment variables
export const dynamic = 'force-dynamic'

interface TodayEvent {
  id: string
  title: string
  start_time: string
  current_count: number
  capacity: number
}

interface DashboardStats {
  todayEvents: TodayEvent[]
  monthlyBookings: number
  monthlyRevenue: number
  upcomingEvents: number
}

async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Today's events
  const { data: todayEvents } = await supabase
    .from('events')
    .select('id, title, start_time, current_count, capacity')
    .eq('date', today)
    .eq('status', 'open')

  // Total bookings this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: monthlyBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())
    .eq('status', 'confirmed')

  // Total revenue this month
  const { data: monthlyPayments } = await supabase
    .from('payments')
    .select('amount')
    .gte('created_at', startOfMonth.toISOString())
    .eq('status', 'succeeded')

  const monthlyRevenue = (monthlyPayments as { amount: number }[] | null)?.reduce((sum, p) => sum + p.amount, 0) || 0

  // Upcoming events count
  const { count: upcomingEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('date', today)
    .eq('status', 'open')

  return {
    todayEvents: (todayEvents as TodayEvent[] | null) || [],
    monthlyBookings: monthlyBookings || 0,
    monthlyRevenue,
    upcomingEvents: upcomingEvents || 0,
  }
}

interface RecentBooking {
  id: string
  created_at: string
  user_id: string
  event: {
    title: string
    date: string
  }
  profile: {
    nickname: string | null
  } | null
}

async function getRecentBookings(): Promise<RecentBooking[]> {
  const supabase = createAdminClient()

  // First, fetch recent bookings with events
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      created_at,
      user_id,
      event:events(title, date)
    `)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(5)

  if (bookingsError || !bookingsData || bookingsData.length === 0) {
    return []
  }

  // Get unique user IDs from bookings
  const userIds = [...new Set(bookingsData.map(b => b.user_id))]

  // Fetch profiles for these users
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, nickname')
    .in('id', userIds)

  // Create a map of user_id -> profile
  const profilesMap = new Map(
    (profilesData || []).map(p => [p.id, { nickname: p.nickname }])
  )

  // Merge bookings with profiles
  const bookings: RecentBooking[] = bookingsData.map(booking => ({
    id: booking.id,
    created_at: booking.created_at,
    user_id: booking.user_id,
    event: booking.event as unknown as RecentBooking['event'],
    profile: profilesMap.get(booking.user_id) || null,
  }))

  return bookings
}

export default async function AdminDashboard() {
  const [stats, recentBookings] = await Promise.all([
    getDashboardStats(),
    getRecentBookings(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本日のプログラム</p>
                <p className="text-3xl font-bold">{stats.todayEvents.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今月の申込数</p>
                <p className="text-3xl font-bold">{stats.monthlyBookings}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今月の売上</p>
                <p className="text-3xl font-bold">¥{stats.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">開催予定</p>
                <p className="text-3xl font-bold">{stats.upcomingEvents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Events */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">本日のプログラム</h2>
          </CardHeader>
          <CardContent>
            {stats.todayEvents.length > 0 ? (
              <div className="space-y-4">
                {stats.todayEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-500">{event.start_time.slice(0, 5)}〜</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{event.current_count}/{event.capacity}</p>
                      <p className="text-xs text-gray-500">参加者</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">本日のプログラムはありません</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">最近の申込</h2>
              <Link href="/admin/bookings" className="text-sm text-green-600 hover:text-green-700">
                すべて見る
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{booking.event.title}</p>
                      <p className="text-sm text-gray-500">
                        {booking.profile?.nickname || '名前未設定'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {format(new Date(booking.event.date), 'M/d', { locale: ja })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(booking.created_at), 'M/d HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">最近の申込はありません</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
