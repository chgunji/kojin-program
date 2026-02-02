import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/events/EventCard'
import { SearchFilters } from '@/components/search/SearchFilters'
import type { Metadata } from 'next'
import type { Event, Park, EventCategory } from '@/types/database'

export const metadata: Metadata = {
  title: 'プログラム検索',
  description: '個人フットサル・個人ソサイチのプログラムを検索',
}

interface SearchParams {
  date?: string
  park?: string
  category?: string
  level?: string
  page?: string
}

type EventWithRelations = Event & {
  park: Park
  category: EventCategory
}

async function getEvents(searchParams: SearchParams): Promise<EventWithRelations[]> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('events')
    .select(`
      *,
      park:parks(*),
      category:event_categories(*)
    `)
    .gte('date', searchParams.date || today)
    .eq('status', 'open')
    .order('date', { ascending: true })

  if (searchParams.date) {
    query = query.eq('date', searchParams.date)
  }

  if (searchParams.park) {
    query = query.eq('park_id', searchParams.park)
  }

  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category)
  }

  if (searchParams.level) {
    query = query.eq('level', searchParams.level)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  return (data as unknown as EventWithRelations[]) || []
}

async function getCategories(): Promise<EventCategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_categories')
    .select('*')
    .order('sort_order', { ascending: true })
  return (data as EventCategory[]) || []
}

async function getParks(): Promise<Park[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('parks')
    .select('*')
    .order('name', { ascending: true })
  return (data as Park[]) || []
}

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [events, categories, parks] = await Promise.all([
    getEvents(params),
    getCategories(),
    getParks(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">プログラム検索</h1>

      {/* Filters */}
      <Suspense fallback={<div className="h-24 bg-gray-100 rounded-lg animate-pulse mb-6" />}>
        <SearchFilters
          categories={categories}
          parks={parks}
          currentFilters={params}
        />
      </Suspense>

      {/* Results */}
      <div className="mt-6">
        {events.length > 0 ? (
          <>
            <p className="text-gray-600 mb-4">{events.length}件のプログラムが見つかりました</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">条件に一致するプログラムが見つかりませんでした</p>
            <p className="text-sm text-gray-400">
              検索条件を変更してお試しください
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
