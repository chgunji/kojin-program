import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { MapPin, Clock, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Event, Park, EventCategory } from '@/types/database'

interface EventCardProps {
  event: Event & {
    park: Park
    category: EventCategory
  }
}

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

export function EventCard({ event }: EventCardProps) {
  const remainingSpots = event.capacity - event.current_count
  const isFull = remainingSpots <= 0
  const isAlmostFull = remainingSpots <= 3

  return (
    <Link href={`/programs/${event.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-0">
          {/* Category & Level Badge */}
          <div className="p-4 pb-2">
            <div className="flex gap-2 flex-wrap">
              <Badge>{event.category.name}</Badge>
              {event.level && (
                <Badge variant={levelColors[event.level]}>
                  {levelLabels[event.level]}
                </Badge>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="px-4 pb-2">
            <h3 className="font-bold text-lg line-clamp-2">{event.title}</h3>
          </div>

          {/* Info */}
          <div className="px-4 pb-4 space-y-2 text-sm text-gray-600">
            {/* Date & Time */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>
                {format(new Date(event.date), 'M月d日(E)', { locale: ja })}{' '}
                {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{event.park.name}</span>
            </div>

            {/* Capacity */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>
                {isFull ? (
                  <span className="text-red-600 font-medium">満員</span>
                ) : isAlmostFull ? (
                  <span className="text-orange-600 font-medium">
                    残り{remainingSpots}名
                  </span>
                ) : (
                  <span>
                    {event.current_count}/{event.capacity}名
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="px-4 py-3 bg-gray-50 border-t">
            <span className="text-xl font-bold text-green-600">
              ¥{event.price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 ml-1">/ 人</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
