import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SearchForm } from '@/components/search/SearchForm'
import { EventCard } from '@/components/events/EventCard'
import { Calendar, MapPin, Users } from 'lucide-react'
import type { Event, Park, EventCategory } from '@/types/database'

type EventWithRelations = Event & {
  park: Park
  category: EventCategory
}

async function getUpcomingEvents(): Promise<EventWithRelations[]> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      park:parks(*),
      category:event_categories(*)
    `)
    .gte('date', today)
    .eq('status', 'open')
    .order('date', { ascending: true })
    .limit(6)

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  return (data as unknown as EventWithRelations[]) || []
}

async function getCategories(): Promise<EventCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return (data as EventCategory[]) || []
}

async function getParks(): Promise<Park[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('parks')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching parks:', error)
    return []
  }

  return (data as Park[]) || []
}

export default async function HomePage() {
  const [events, categories, parks] = await Promise.all([
    getUpcomingEvents(),
    getCategories(),
    getParks(),
  ])

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              個人フットサル・個人ソサイチを
              <br className="hidden md:block" />
              かんたん検索・予約
            </h1>
            <p className="text-lg md:text-xl text-green-100 mb-8">
              全国の施設で開催されるプログラムに気軽に参加できます
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <Suspense fallback={<div className="h-32 bg-white/10 rounded-lg animate-pulse" />}>
              <SearchForm categories={categories} parks={parks} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">日程から探す</h3>
              <p className="text-gray-600">
                参加したい日時でプログラムを検索。空き状況もリアルタイムで確認できます。
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">会場から探す</h3>
              <p className="text-gray-600">
                お近くの施設やアクセスの良い会場でプログラムを探せます。
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">レベルから探す</h3>
              <p className="text-gray-600">
                ビギナーからガチまで、自分に合ったレベルのプログラムが見つかります。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">近日開催のプログラム</h2>
            <Link
              href="/programs"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              すべて見る
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">現在予定されているプログラムはありません</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
