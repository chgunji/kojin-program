import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json(
        { error: 'イベントIDが必要です' },
        { status: 400 }
      )
    }

    // Get event details
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        park:parks(name)
      `)
      .eq('id', eventId)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: 'プログラムが見つかりません' },
        { status: 404 }
      )
    }

    const event = eventData as {
      id: string
      title: string
      date: string
      start_time: string
      end_time: string
      price: number
      capacity: number
      current_count: number
      status: string
      park: { name: string }
    }

    // Check if event is still available
    if (event.status !== 'open') {
      return NextResponse.json(
        { error: 'このプログラムは現在申込を受け付けていません' },
        { status: 400 }
      )
    }

    // Check capacity
    if (event.current_count >= event.capacity) {
      return NextResponse.json(
        { error: 'このプログラムは満員です' },
        { status: 400 }
      )
    }

    // Check if user already booked
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .eq('status', 'confirmed')
      .single()

    if (existingBooking) {
      return NextResponse.json(
        { error: '既にこのプログラムに申込済みです' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: event.title,
              description: `${event.park.name} - ${event.date} ${event.start_time.slice(0, 5)}〜${event.end_time.slice(0, 5)}`,
            },
            unit_amount: event.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/programs/${eventId}/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/programs/${eventId}/checkout`,
      metadata: {
        eventId,
        userId: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: '決済の準備に失敗しました' },
      { status: 500 }
    )
  }
}
