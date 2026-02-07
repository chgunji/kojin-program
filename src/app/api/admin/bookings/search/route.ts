import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({ bookings: [] })
    }

    const supabase = createAdminClient()

    // Search profiles by nickname
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nickname, phone')
      .or(`nickname.ilike.%${query}%,phone.ilike.%${query}%`)

    if (profilesError) {
      console.error('Error searching profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to search profiles' },
        { status: 500 }
      )
    }

    if (!profilesData || profilesData.length === 0) {
      return NextResponse.json({ bookings: [] })
    }

    // Get user IDs that match the search
    const userIds = profilesData.map(p => p.id)

    // Fetch bookings for these users
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
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .limit(50)

    if (bookingsError) {
      console.error('Error searching bookings:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to search bookings' },
        { status: 500 }
      )
    }

    // Create a map of user_id -> profile
    const profilesMap = new Map(
      profilesData.map(p => [p.id, { nickname: p.nickname, phone: p.phone }])
    )

    // Merge bookings with profiles
    const bookings = (bookingsData || []).map(booking => ({
      id: booking.id,
      user_id: booking.user_id,
      event_id: booking.event_id,
      status: booking.status,
      created_at: booking.created_at,
      cancelled_at: booking.cancelled_at,
      event: booking.event,
      profile: profilesMap.get(booking.user_id) || null,
    }))

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error in bookings search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
