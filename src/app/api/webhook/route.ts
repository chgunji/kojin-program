import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Service role key is REQUIRED to bypass RLS for webhook operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  // Validate required environment variables
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables for webhook')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  // Create Supabase admin client with service role key (bypasses RLS)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  // Stripe webhook secret is optional for local development
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  // If webhook secret is configured, verify the signature
  if (webhookSecret) {
    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }
  } else {
    // For local development without webhook secret
    console.warn('STRIPE_WEBHOOK_SECRET not configured - skipping signature verification')
    try {
      event = JSON.parse(body) as Stripe.Event
    } catch {
      console.error('Failed to parse webhook body')
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }

  console.log('Received Stripe webhook event:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const eventId = session.metadata?.eventId
    const userId = session.metadata?.userId

    console.log('Processing checkout.session.completed:', { eventId, userId, sessionId: session.id })

    if (!eventId || !userId) {
      console.error('Missing metadata in session:', { eventId, userId })
      return NextResponse.json(
        { error: 'Missing required metadata' },
        { status: 400 }
      )
    }

    try {
      // Check if booking already exists (idempotency)
      const { data: existingBooking } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .eq('status', 'confirmed')
        .single()

      if (existingBooking) {
        console.log('Booking already exists:', existingBooking.id)
        return NextResponse.json({ received: true, message: 'Booking already exists' })
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .insert({
          user_id: userId,
          event_id: eventId,
          status: 'confirmed',
        })
        .select('id')
        .single()

      if (bookingError) {
        console.error('Error creating booking:', bookingError)
        return NextResponse.json(
          { error: 'Failed to create booking', details: bookingError.message },
          { status: 500 }
        )
      }

      console.log('Booking created:', booking.id)

      // Create payment record
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          booking_id: booking.id,
          stripe_payment_id: session.payment_intent as string || session.id,
          amount: session.amount_total || 0,
          status: 'succeeded',
          paid_at: new Date().toISOString(),
        })

      if (paymentError) {
        console.error('Error creating payment:', paymentError)
        // Don't fail the webhook - booking is already created
        // Payment record is for tracking purposes
      } else {
        console.log('Payment record created for booking:', booking.id)
      }

      // Update event current_count
      // First, get current count
      const { data: currentEvent, error: fetchError } = await supabaseAdmin
        .from('events')
        .select('current_count')
        .eq('id', eventId)
        .single()

      if (fetchError) {
        console.error('Error fetching event:', fetchError)
      } else if (currentEvent) {
        const newCount = (currentEvent.current_count || 0) + 1
        const { error: updateError } = await supabaseAdmin
          .from('events')
          .update({ current_count: newCount })
          .eq('id', eventId)

        if (updateError) {
          console.error('Error updating event count:', updateError)
        } else {
          console.log('Event count updated to:', newCount)
        }
      }

      console.log('Webhook processing completed successfully for booking:', booking.id)
    } catch (error) {
      console.error('Error processing webhook:', error)
      return NextResponse.json(
        { error: 'Failed to process webhook' },
        { status: 500 }
      )
    }
  }

  // Handle payment_intent.succeeded as a backup
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    console.log('Payment intent succeeded:', paymentIntent.id)
    // Note: checkout.session.completed is preferred as it has metadata
  }

  return NextResponse.json({ received: true })
}
