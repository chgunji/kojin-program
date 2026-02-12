import { format } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '決済確認',
}

// Prevent static generation - this page requires runtime environment variables
export const dynamic = 'force-dynamic'

const statusLabels: Record<string, string> = {
  succeeded: '成功',
  pending: '処理中',
  failed: '失敗',
  refunded: '返金済み',
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  succeeded: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'info',
}

interface PaymentWithRelations {
  id: string
  booking_id: string
  stripe_payment_id: string | null
  amount: number
  status: string
  paid_at: string | null
  created_at: string
  booking: {
    id: string
    user_id: string
    event: {
      title: string
      date: string
    } | null
  } | null
  profile: {
    nickname: string | null
  } | null
}

async function getPayments(): Promise<PaymentWithRelations[]> {
  const supabase = createAdminClient()

  // First, fetch payments with bookings and events
  const { data: paymentsData, error: paymentsError } = await supabase
    .from('payments')
    .select(`
      id,
      booking_id,
      stripe_payment_id,
      amount,
      status,
      paid_at,
      created_at,
      booking:bookings(
        id,
        user_id,
        event:events(title, date)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (paymentsError) {
    console.error('Error fetching payments:', paymentsError)
    return []
  }

  if (!paymentsData || paymentsData.length === 0) {
    return []
  }

  // Get unique user IDs from bookings
  const userIds = [...new Set(
    paymentsData
      .map(p => (p.booking as unknown as { user_id: string } | null)?.user_id)
      .filter((id): id is string => id !== undefined && id !== null)
  )]

  // Fetch profiles for these users
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, nickname')
    .in('id', userIds)

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
  }

  // Create a map of user_id -> profile
  const profilesMap = new Map(
    (profilesData || []).map(p => [p.id, { nickname: p.nickname }])
  )

  // Merge payments with profiles
  const payments: PaymentWithRelations[] = paymentsData.map(payment => {
    const booking = payment.booking as unknown as { id: string; user_id: string; event: { title: string; date: string } | null } | null
    return {
      id: payment.id,
      booking_id: payment.booking_id,
      stripe_payment_id: payment.stripe_payment_id,
      amount: payment.amount,
      status: payment.status,
      paid_at: payment.paid_at,
      created_at: payment.created_at,
      booking: booking,
      profile: booking ? profilesMap.get(booking.user_id) || null : null,
    }
  })

  return payments
}

export default async function AdminPaymentsPage() {
  const payments = await getPayments()

  const totalRevenue = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">決済確認</h1>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
          <span className="text-sm">総売上: </span>
          <span className="font-bold">¥{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  決済日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プログラム
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申込者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stripe ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.paid_at
                      ? format(new Date(payment.paid_at), 'yyyy/M/d HH:mm')
                      : format(new Date(payment.created_at), 'yyyy/M/d HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {payment.booking?.event?.title || '-'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.booking?.event?.date || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.profile?.nickname || '名前未設定'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold">¥{payment.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={statusColors[payment.status]}>
                      {statusLabels[payment.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <code className="text-xs">
                      {payment.stripe_payment_id?.slice(0, 20) || '-'}...
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">決済履歴がありません</p>
          </div>
        )}
      </div>
    </div>
  )
}
