'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { EventCategory, Park } from '@/types/database'

interface SearchFormProps {
  categories: EventCategory[]
  parks: Park[]
}

export function SearchForm({ categories, parks }: SearchFormProps) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [parkId, setParkId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [level, setLevel] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (date) params.set('date', date)
    if (parkId) params.set('park', parkId)
    if (categoryId) params.set('category', categoryId)
    if (level) params.set('level', level)

    router.push(`/programs?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            日程
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Park */}
        <div>
          <label htmlFor="park" className="block text-sm font-medium text-gray-700 mb-1">
            会場
          </label>
          <select
            id="park"
            value={parkId}
            onChange={(e) => setParkId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">すべての会場</option>
            {parks.map((park) => (
              <option key={park.id} value={park.id}>
                {park.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリ
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">すべてのカテゴリ</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
            レベル
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">すべてのレベル</option>
            <option value="beginner">ビギナー</option>
            <option value="enjoy">エンジョイ</option>
            <option value="competitive">ガチ</option>
            <option value="mix">ミックス</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Button type="submit" size="lg" className="w-full md:w-auto md:min-w-[200px]">
          <Search className="w-5 h-5 mr-2" />
          検索する
        </Button>
      </div>
    </form>
  )
}
