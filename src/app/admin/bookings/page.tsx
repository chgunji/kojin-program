import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '申込者一覧',
}

// Prevent static generation - this page requires runtime environment variables
export const dynamic = 'force-dynamic'

interface BookingWithRelations {
  id: string
  user_id: string
  event_id: string
  status: string
  created_at: string
  cancelled_at: string | null
  event: {
    id: string
    title: string
    date: string
    start_time: string
    park: {
      name: string
    }
  }
  profile: {
    nickname: string | null
    phone: string | null
  } | null
}

async function getBookings(): Promise<BookingWithRelations[]> {
  const supabase = createAdminClient()

  // First, fetch bookings with events
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      user_id,
      event_id,
      status,
      created_at,
      cancelled_at,
      event:events(
        id,
        title,
        date,
        start_time,
        park:parks(name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError)
    return []
  }

  if (!bookingsData || bookingsData.length === 0) {
    return []
  }

  // Get unique user IDs from bookings
  const userIds = [...new Set(bookingsData.map(b => b.user_id))]

  // Fetch profiles for these users
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, nickname, phone')
    .in('id', userIds)

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
  }

  // Create a map of user_id -> profile
  const profilesMap = new Map(
    (profilesData || []).map(p => [p.id, { nickname: p.nickname, phone: p.phone }])
  )

  // Merge bookings with profiles
  const bookings: BookingWithRelations[] = bookingsData.map(booking => ({
    id: booking.id,
    user_id: booking.user_id,
    event_id: booking.event_id,
    status: booking.status,
    created_at: booking.created_at,
    cancelled_at: booking.cancelled_at,
    event: booking.event as unknown as BookingWithRelations['event'],
    profile: profilesMap.get(booking.user_id) || null,
  }))

  return bookings
}

export default async function AdminBookingsPage() {
  const bookings = await getBookings()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">申込者一覧</h1>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申込日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プログラム
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  開催日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申込者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  連絡先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(booking.created_at), 'M/d HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{booking.event.title}</p>
                      <p className="text-sm text-gray-500">{booking.event.park.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(booking.event.date), 'M月d日(E)', { locale: ja })}
                    <br />
                    <span className="text-gray-500">{booking.event.start_time.slice(0, 5)}〜</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {booking.profile?.nickname || '名前未設定'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.profile?.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={booking.status === 'confirmed' ? 'success' : 'danger'}>
                      {booking.status === 'confirmed' ? '確定' : 'キャンセル'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">申込がありません</p>
          </div>
        )}
      </div>
    </div>
  )
}
