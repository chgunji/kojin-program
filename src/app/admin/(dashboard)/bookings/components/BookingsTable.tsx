'use client'

import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export interface Booking {
  id: string
  user_id: string
  event_id: string
  status: string
  created_at: string
  cancelled_at: string | null
  event: {
    id: string
    title: string
    date: string
    start_time: string
    park: {
      name: string
    }
  }
  profile: {
    nickname: string | null
    phone: string | null
  } | null
}

interface BookingsTableProps {
  initialBookings: Booking[]
}

export function BookingsTable({ initialBookings }: BookingsTableProps) {
  const [bookings, setBookings] = useState(initialBookings)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)

  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setBookings(initialBookings)
      setIsSearchMode(false)
      return
    }

    setIsSearching(true)
    setIsSearchMode(true)

    try {
      const response = await fetch(`/api/admin/bookings/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Search failed')
      }
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Search error:', error)
      alert('検索に失敗しました')
    } finally {
      setIsSearching(false)
    }
  }, [initialBookings])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setBookings(initialBookings)
    setIsSearchMode(false)
  }

  return (
    <div>
      {/* Search Form */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前・電話番号で検索..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching || searchQuery.length < 2}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? '検索中...' : '検索'}
          </button>
        </form>
        {isSearchMode && (
          <p className="mt-2 text-sm text-gray-600">
            検索結果: {bookings.length}件
            <button
              onClick={handleClearSearch}
              className="ml-2 text-green-600 hover:text-green-700 underline"
            >
              クリア
            </button>
          </p>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申込日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プログラム
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  開催日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申込者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  連絡先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(booking.created_at), 'M/d HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{booking.event.title}</p>
                      <p className="text-sm text-gray-500">{booking.event.park.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(booking.event.date), 'M月d日(E)', { locale: ja })}
                    <br />
                    <span className="text-gray-500">{booking.event.start_time.slice(0, 5)}〜</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {booking.profile?.nickname || '名前未設定'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.profile?.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={booking.status === 'confirmed' ? 'success' : 'danger'}>
                      {booking.status === 'confirmed' ? '確定' : 'キャンセル'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {isSearchMode ? '検索結果がありません' : '申込がありません'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
