import { createAdminClient } from '@/lib/supabase/admin'
import { BookingsTable, type Booking } from './components/BookingsTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '申込者一覧',
}

// Prevent static generation - this page requires runtime environment variables
export const dynamic = 'force-dynamic'

async function getBookings(): Promise<Booking[]> {
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
  const bookings: Booking[] = bookingsData.map(booking => ({
    id: booking.id,
    user_id: booking.user_id,
    event_id: booking.event_id,
    status: booking.status,
    created_at: booking.created_at,
    cancelled_at: booking.cancelled_at,
    event: booking.event as unknown as Booking['event'],
    profile: profilesMap.get(booking.user_id) || null,
  }))

  return bookings
}

export default async function AdminBookingsPage() {
  const bookings = await getBookings()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">申込者一覧</h1>
      <BookingsTable initialBookings={bookings} />
    </div>
  )
}
