import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Use service role key for webhook handler (untyped for flexibility)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const eventId = session.metadata?.eventId
    const userId = session.metadata?.userId

    if (!eventId || !userId) {
      console.error('Missing metadata in session')
      return NextResponse.json({ received: true })
    }

    try {
      // Create booking
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .insert({
          user_id: userId,
          event_id: eventId,
          status: 'confirmed',
        })
        .select()
        .single()

      if (bookingError) {
        console.error('Error creating booking:', bookingError)
        return NextResponse.json(
          { error: 'Failed to create booking' },
          { status: 500 }
        )
      }

      // Create payment record
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          booking_id: booking.id,
          stripe_payment_id: session.payment_intent as string,
          amount: session.amount_total || 0,
          status: 'succeeded',
          paid_at: new Date().toISOString(),
        })

      if (paymentError) {
        console.error('Error creating payment:', paymentError)
      }

      // Update event current_count
      const { error: updateError } = await supabaseAdmin
        .from('events')
        .update({
          current_count: supabaseAdmin.rpc('increment_count', { row_id: eventId }),
        })
        .eq('id', eventId)

      // Alternative: Direct increment (if RPC not available)
      if (updateError) {
        const { data: currentEvent } = await supabaseAdmin
          .from('events')
          .select('current_count')
          .eq('id', eventId)
          .single()

        if (currentEvent) {
          await supabaseAdmin
            .from('events')
            .update({ current_count: currentEvent.current_count + 1 })
            .eq('id', eventId)
        }
      }

      console.log('Booking created successfully:', booking.id)
    } catch (error) {
      console.error('Error processing webhook:', error)
      return NextResponse.json(
        { error: 'Failed to process webhook' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}
