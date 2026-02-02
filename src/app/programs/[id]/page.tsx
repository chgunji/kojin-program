import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { MapPin, Clock, Users, Car, Droplets, Train } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

const levelLabels: Record<string, string> = {
  beginner: 'ビギナー',
  enjoy: 'エンジョイ',
  competitive: 'ガチ',
  mix: 'ミックス',
}

const levelColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  beginner: 'success',
  enjoy: 'info',
  competitive: 'danger',
  mix: 'default',
}

interface EventWithRelations {
  id: string
  title: string
  description: string | null
  date: string
  start_time: string
  end_time: string
  price: number
  capacity: number
  current_count: number
  status: string
  level: string | null
  park: {
    name: string
    address: string | null
    nearest_station: string | null
    has_parking: boolean
    has_shower: boolean
  }
  category: {
    name: string
  }
}

async function getEvent(id: string): Promise<EventWithRelations | null> {
  const supabase = await createClient()

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
    return null
  }

  return data as unknown as EventWithRelations
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    return {
      title: 'プログラムが見つかりません',
    }
  }

  return {
    title: event.title,
    description: event.description || `${event.park.name}で開催される${event.category.name}`,
  }
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    notFound()
  }

  const remainingSpots = event.capacity - event.current_count
  const isFull = remainingSpots <= 0
  const isAlmostFull = remainingSpots <= 3

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-gray-500 hover:text-green-600">
              ホーム
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/programs" className="text-gray-500 hover:text-green-600">
              プログラム検索
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium truncate max-w-xs">{event.title}</li>
        </ol>
      </nav>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex gap-2 mb-4">
            <Badge>{event.category.name}</Badge>
            {event.level && (
              <Badge variant={levelColors[event.level]}>
                {levelLabels[event.level]}
              </Badge>
            )}
            {event.status === 'cancelled' && (
              <Badge variant="danger">キャンセル</Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
        </div>

        {/* Main Info */}
        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">
                  {format(new Date(event.date), 'yyyy年M月d日(E)', { locale: ja })}
                </p>
                <p className="text-gray-600">
                  {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                </p>
              </div>
            </div>

            {/* Capacity */}
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">定員</p>
                <p className="text-gray-600">
                  {event.current_count} / {event.capacity}名
                  {isFull ? (
                    <span className="ml-2 text-red-600 font-medium">（満員）</span>
                  ) : isAlmostFull ? (
                    <span className="ml-2 text-orange-600 font-medium">（残り{remainingSpots}名）</span>
                  ) : null}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">参加費</p>
              <p className="text-3xl font-bold text-green-600">
                ¥{event.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-500 ml-1">/ 人</span>
              </p>
            </div>
          </div>

          {/* Right Column - Venue Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-lg">会場情報</h3>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{event.park.name}</p>
                {event.park.address && (
                  <p className="text-sm text-gray-600">{event.park.address}</p>
                )}
              </div>
            </div>

            {event.park.nearest_station && (
              <div className="flex items-start gap-3">
                <Train className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">{event.park.nearest_station}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              {event.park.has_parking && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Car className="w-4 h-4" />
                  <span>駐車場あり</span>
                </div>
              )}
              {event.park.has_shower && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Droplets className="w-4 h-4" />
                  <span>シャワーあり</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="p-6 border-t">
            <h3 className="font-semibold text-lg mb-2">プログラム詳細</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* CTA */}
        <div className="p-6 bg-gray-50 border-t">
          {event.status === 'cancelled' ? (
            <div className="text-center">
              <p className="text-red-600 font-medium">このプログラムはキャンセルされました</p>
            </div>
          ) : isFull ? (
            <div className="text-center">
              <p className="text-gray-600 mb-2">このプログラムは満員です</p>
              <Link href="/programs">
                <Button variant="outline">他のプログラムを探す</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">参加費</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{event.price.toLocaleString()}
                </p>
              </div>
              <Link href={`/programs/${event.id}/checkout`}>
                <Button size="lg" className="w-full sm:w-auto">
                  申し込む
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
