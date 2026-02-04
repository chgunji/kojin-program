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

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      event:events(
        id,
        title,
        date,
        start_time,
        park:parks(name)
      ),
      profile:profiles(nickname, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching bookings:', error)
    return []
  }

  return (data as unknown as BookingWithRelations[]) || []
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
