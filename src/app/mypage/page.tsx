import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProfileForm } from '@/components/mypage/ProfileForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'マイページ',
}

interface UserBooking {
  id: string
  status: string
  created_at: string
  event: {
    id: string
    title: string
    date: string
    start_time: string
    end_time: string
    price: number
    park: { name: string }
    category: { name: string }
  }
  payment?: { amount: number; status: string }[]
}

async function getUserBookings(userId: string): Promise<UserBooking[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      event:events(
        *,
        park:parks(*),
        category:event_categories(*)
      ),
      payment:payments(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings:', error)
    return []
  }

  return (data as unknown as UserBooking[]) || []
}

async function getUserProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/mypage')
  }

  const [bookings, profile] = await Promise.all([
    getUserBookings(user.id),
    getUserProfile(user.id),
  ])

  // Separate upcoming and past bookings
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.event.date) >= today && b.status === 'confirmed'
  )
  const pastBookings = bookings.filter(
    (b) => new Date(b.event.date) < today || b.status === 'cancelled'
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">マイページ</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar - Profile */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">プロフィール</h2>
            <ProfileForm profile={profile} userEmail={user.email || ''} />
          </div>
        </div>

        {/* Main - Bookings */}
        <div className="md:col-span-2 space-y-8">
          {/* Upcoming Bookings */}
          <section>
            <h2 className="text-lg font-semibold mb-4">予約中のプログラム</h2>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isUpcoming />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <p className="text-gray-500 mb-4">予約中のプログラムはありません</p>
                <Link href="/programs">
                  <Button>プログラムを探す</Button>
                </Link>
              </div>
            )}
          </section>

          {/* Past Bookings */}
          {pastBookings.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">過去の参加履歴</h2>
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

interface BookingCardProps {
  booking: {
    id: string
    status: string
    created_at: string
    event: {
      id: string
      title: string
      date: string
      start_time: string
      end_time: string
      price: number
      park: {
        name: string
      }
      category: {
        name: string
      }
    }
    payment?: {
      amount: number
      status: string
    }[]
  }
  isUpcoming?: boolean
}

function BookingCard({ booking, isUpcoming }: BookingCardProps) {
  const isCancelled = booking.status === 'cancelled'

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden ${isCancelled ? 'opacity-60' : ''}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex gap-2">
            <Badge>{booking.event.category.name}</Badge>
            {isCancelled && <Badge variant="danger">キャンセル済み</Badge>}
          </div>
          {isUpcoming && !isCancelled && (
            <Link href={`/programs/${booking.event.id}`}>
              <Button size="sm" variant="outline">
                詳細
              </Button>
            </Link>
          )}
        </div>

        <h3 className="font-bold mb-3">{booking.event.title}</h3>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(booking.event.date), 'M月d日(E)', { locale: ja })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {booking.event.start_time.slice(0, 5)} - {booking.event.end_time.slice(0, 5)}
            </span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <MapPin className="w-4 h-4" />
            <span>{booking.event.park.name}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
        <span className="text-sm text-gray-500">
          申込日: {format(new Date(booking.created_at), 'yyyy/M/d')}
        </span>
        <span className="font-bold text-green-600">
          ¥{booking.event.price.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
