'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { MapPin, Clock, ArrowLeft, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Event, Park, EventCategory } from '@/types/database'

const levelLabels: Record<string, string> = {
  beginner: 'ビギナー',
  enjoy: 'エンジョイ',
  competitive: 'ガチ',
  mix: 'ミックス',
}

type EventWithRelations = Event & {
  park: Park
  category: EventCategory
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [event, setEvent] = useState<EventWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          park:parks(*),
          category:event_categories(*)
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        router.push('/programs')
        return
      }

      setEvent(data as EventWithRelations)
      setIsLoading(false)
    }

    fetchEvent()
  }, [id, router, supabase])

  const handleCheckout = async () => {
    setError('')
    setIsProcessing(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?redirect=/programs/${id}/checkout`)
        return
      }

      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '決済の準備に失敗しました')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '決済の準備に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  const remainingSpots = event.capacity - event.current_count
  const isFull = remainingSpots <= 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href={`/programs/${id}`}
        className="inline-flex items-center text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        プログラム詳細に戻る
      </Link>

      <h1 className="text-2xl font-bold mb-6">申込内容の確認</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Event Summary */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex gap-2 mb-3">
            <Badge>{event.category.name}</Badge>
            {event.level && <Badge>{levelLabels[event.level]}</Badge>}
          </div>

          <h2 className="text-xl font-bold mb-4">{event.title}</h2>

          <div className="space-y-3 text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {format(new Date(event.date), 'yyyy年M月d日(E)', { locale: ja })}{' '}
                {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{event.park.name}</span>
            </div>
          </div>
        </div>

        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">参加費</span>
            <span className="text-2xl font-bold text-green-600">
              ¥{event.price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      {isFull ? (
        <div className="text-center p-6 bg-white rounded-xl shadow-md">
          <p className="text-red-600 font-medium mb-4">このプログラムは満員です</p>
          <Link href="/programs">
            <Button variant="outline">他のプログラムを探す</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm">クレジットカードで決済</span>
          </div>

          <Button
            onClick={handleCheckout}
            isLoading={isProcessing}
            className="w-full"
            size="lg"
          >
            決済に進む
          </Button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            「決済に進む」をクリックすると、安全な決済ページに移動します。
          </p>
        </div>
      )}
    </div>
  )
}
