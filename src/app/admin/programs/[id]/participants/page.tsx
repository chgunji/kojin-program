import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '参加者一覧',
}

// Prevent static generation - this page requires runtime environment variables
export const dynamic = 'force-dynamic'

interface Participant {
  id: string
  user_id: string
  status: string
  created_at: string
  cancelled_at: string | null
  profile: {
    nickname: string | null
    phone: string | null
    email: string | null
  } | null
}

interface EventInfo {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  current_count: number
  capacity: number
  park: { name: string }
}

async function getEventWithParticipants(eventId: string): Promise<{
  event: EventInfo | null
  participants: Participant[]
}> {
  const supabase = createAdminClient()

  // Fetch event info
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select(`
      id,
      title,
      date,
      start_time,
      end_time,
      current_count,
      capacity,
      park:parks(name)
    `)
    .eq('id', eventId)
    .single()

  if (eventError || !eventData) {
    console.error('Error fetching event:', eventError)
    return { event: null, participants: [] }
  }

  // Fetch bookings for this event
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, user_id, status, created_at, cancelled_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError)
    return { event: eventData as unknown as EventInfo, participants: [] }
  }

  if (!bookingsData || bookingsData.length === 0) {
    return { event: eventData as unknown as EventInfo, participants: [] }
  }

  // Get unique user IDs
  const userIds = [...new Set(bookingsData.map(b => b.user_id))]

  // Fetch profiles for these users
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, nickname, phone')
    .in('id', userIds)

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
  }

  // Fetch emails from auth.users (admin client has access)
  const { data: usersData } = await supabase.auth.admin.listUsers()
  const emailMap = new Map(
    usersData?.users?.map(u => [u.id, u.email]) || []
  )

  // Create a map of user_id -> profile
  const profilesMap = new Map(
    (profilesData || []).map(p => [p.id, {
      nickname: p.nickname,
      phone: p.phone,
      email: emailMap.get(p.id) || null
    }])
  )

  // Merge bookings with profiles
  const participants: Participant[] = bookingsData.map(booking => ({
    id: booking.id,
    user_id: booking.user_id,
    status: booking.status,
    created_at: booking.created_at,
    cancelled_at: booking.cancelled_at,
    profile: profilesMap.get(booking.user_id) || null,
  }))

  return {
    event: eventData as unknown as EventInfo,
    participants
  }
}

export default async function ParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { event, participants } = await getEventWithParticipants(id)

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">プログラムが見つかりません</p>
        <Link href="/admin/programs">
          <Button>プログラム一覧に戻る</Button>
        </Link>
      </div>
    )
  }

  const confirmedParticipants = participants.filter(p => p.status === 'confirmed')
  const cancelledParticipants = participants.filter(p => p.status === 'cancelled')

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/programs"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          プログラム一覧に戻る
        </Link>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>
              {format(new Date(event.date), 'yyyy年M月d日(E)', { locale: ja })}
            </span>
            <span>
              {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
            </span>
            <span>{event.park.name}</span>
            <span className="font-medium text-gray-900">
              参加者: {event.current_count} / {event.capacity}名
            </span>
          </div>
        </div>
      </div>

      {/* Confirmed Participants */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="font-semibold">参加確定 ({confirmedParticipants.length}名)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  名前
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  電話番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申込日時
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {confirmedParticipants.map((participant, index) => (
                <tr key={participant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {participant.profile?.nickname || '名前未設定'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {participant.profile?.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {participant.profile?.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(participant.created_at), 'M/d HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {confirmedParticipants.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">参加者がいません</p>
          </div>
        )}
      </div>

      {/* Cancelled Participants */}
      {cancelledParticipants.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="font-semibold text-gray-500">キャンセル ({cancelledParticipants.length}名)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申込日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    キャンセル日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cancelledParticipants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50 text-gray-400">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {participant.profile?.nickname || '名前未設定'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(participant.created_at), 'M/d HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {participant.cancelled_at
                        ? format(new Date(participant.cancelled_at), 'M/d HH:mm')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="danger">キャンセル</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
