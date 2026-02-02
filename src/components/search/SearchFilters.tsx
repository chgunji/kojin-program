'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { EventCategory, Park } from '@/types/database'

interface SearchFiltersProps {
  categories: EventCategory[]
  parks: Park[]
  currentFilters: {
    date?: string
    park?: string
    category?: string
    level?: string
  }
}

const levelLabels: Record<string, string> = {
  beginner: 'ビギナー',
  enjoy: 'エンジョイ',
  competitive: 'ガチ',
  mix: 'ミックス',
}

export function SearchFilters({ categories, parks, currentFilters }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/programs?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearFilters = useCallback(() => {
    router.push('/programs')
  }, [router])

  const hasFilters = Object.values(currentFilters).some(Boolean)

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date */}
        <div>
          <label htmlFor="filter-date" className="block text-sm font-medium text-gray-700 mb-1">
            日程
          </label>
          <input
            type="date"
            id="filter-date"
            value={currentFilters.date || ''}
            onChange={(e) => updateFilter('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Park */}
        <div>
          <label htmlFor="filter-park" className="block text-sm font-medium text-gray-700 mb-1">
            会場
          </label>
          <select
            id="filter-park"
            value={currentFilters.park || ''}
            onChange={(e) => updateFilter('park', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">すべて</option>
            {parks.map((park) => (
              <option key={park.id} value={park.id}>
                {park.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリ
          </label>
          <select
            id="filter-category"
            value={currentFilters.category || ''}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">すべて</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div>
          <label htmlFor="filter-level" className="block text-sm font-medium text-gray-700 mb-1">
            レベル
          </label>
          <select
            id="filter-level"
            value={currentFilters.level || ''}
            onChange={(e) => updateFilter('level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">すべて</option>
            {Object.entries(levelLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasFilters && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            フィルターをクリア
          </Button>
        </div>
      )}
    </div>
  )
}
