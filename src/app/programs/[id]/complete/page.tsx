import { Suspense } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CheckCircle, MapPin, Clock, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '申込完了',
}

interface EventDetails {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  price: number
  park: {
    name: string
    address: string | null
  }
}

async function getEventDetails(eventId: string): Promise<EventDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      park:parks(*),
      category:event_categories(*)
    `)
    .eq('id', eventId)
    .single()

  if (error) {
    return null
  }

  return data as unknown as EventDetails
}

async function CompletedContent({ eventId }: { eventId: string }) {
  const event = await getEventDetails(eventId)

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">プログラム情報を取得できませんでした</p>
        <Link href="/mypage" className="mt-4 inline-block">
          <Button>マイページで確認</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-md p-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">申込が完了しました</h1>
          <p className="text-gray-600">
            ご予約ありがとうございます。当日のご参加をお待ちしております。
          </p>
        </div>

        {/* Event Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4">予約内容</h2>

          <h3 className="font-bold text-xl mb-4">{event.title}</h3>

          <div className="space-y-3 text-gray-600">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span>
                {format(new Date(event.date), 'yyyy年M月d日(E)', { locale: ja })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span>
                {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p>{event.park.name}</p>
                {event.park.address && (
                  <p className="text-sm">{event.park.address}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">お支払い金額</span>
              <span className="text-xl font-bold text-green-600">
                ¥{event.price.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-yellow-800">
            予約確認メールをお送りしました。当日は開始時間の10分前までにお越しください。
            運動できる服装とシューズをご持参ください。
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/mypage">
            <Button variant="outline" className="w-full sm:w-auto">
              マイページで確認
            </Button>
          </Link>
          <Link href="/programs">
            <Button className="w-full sm:w-auto">
              他のプログラムを探す
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function CompletePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-md p-8 animate-pulse">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      }
    >
      <CompletedContent eventId={id} />
    </Suspense>
  )
}
