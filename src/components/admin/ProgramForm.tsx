'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Park, EventCategory, Event } from '@/types/database'

interface ProgramFormProps {
  parks: Park[]
  categories: EventCategory[]
  program?: Event
}

const levelOptions = [
  { value: '', label: 'レベルを選択' },
  { value: 'beginner', label: 'ビギナー' },
  { value: 'enjoy', label: 'エンジョイ' },
  { value: 'competitive', label: 'ガチ' },
  { value: 'mix', label: 'ミックス' },
]

const statusOptions = [
  { value: 'open', label: '受付中' },
  { value: 'closed', label: '受付終了' },
  { value: 'cancelled', label: 'キャンセル' },
]

export function ProgramForm({ parks, categories, program }: ProgramFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!program

  const [formData, setFormData] = useState({
    title: program?.title || '',
    description: program?.description || '',
    park_id: program?.park_id || '',
    category_id: program?.category_id || '',
    date: program?.date || '',
    start_time: program?.start_time?.slice(0, 5) || '',
    end_time: program?.end_time?.slice(0, 5) || '',
    price: program?.price?.toString() || '',
    capacity: program?.capacity?.toString() || '',
    level: program?.level || '',
    status: program?.status || 'open',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = {
        title: formData.title,
        description: formData.description || null,
        park_id: formData.park_id,
        category_id: formData.category_id,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        price: parseInt(formData.price),
        capacity: parseInt(formData.capacity),
        level: formData.level || null,
        status: formData.status,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('events')
          .update(data as never)
          .eq('id', program.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('events')
          .insert(data as never)

        if (error) throw error
      }

      router.push('/admin/programs')
      router.refresh()
    } catch (err) {
      console.error('Error saving program:', err)
      setError('保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const parkOptions = [
    { value: '', label: '会場を選択' },
    ...parks.map((p) => ({ value: p.id, label: p.name })),
  ]

  const categoryOptions = [
    { value: '', label: 'カテゴリを選択' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      <Input
        id="title"
        name="title"
        label="タイトル"
        value={formData.title}
        onChange={handleChange}
        required
        placeholder="【新宿】エンジョイ個人フットサル"
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          詳細説明
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="プログラムの詳細を入力"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          id="park_id"
          name="park_id"
          label="会場"
          value={formData.park_id}
          onChange={handleChange}
          options={parkOptions}
          required
        />

        <Select
          id="category_id"
          name="category_id"
          label="カテゴリ"
          value={formData.category_id}
          onChange={handleChange}
          options={categoryOptions}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="date"
          id="date"
          name="date"
          label="開催日"
          value={formData.date}
          onChange={handleChange}
          required
        />

        <Input
          type="time"
          id="start_time"
          name="start_time"
          label="開始時間"
          value={formData.start_time}
          onChange={handleChange}
          required
        />

        <Input
          type="time"
          id="end_time"
          name="end_time"
          label="終了時間"
          value={formData.end_time}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="number"
          id="price"
          name="price"
          label="参加費（円）"
          value={formData.price}
          onChange={handleChange}
          required
          min="0"
          placeholder="1500"
        />

        <Input
          type="number"
          id="capacity"
          name="capacity"
          label="定員"
          value={formData.capacity}
          onChange={handleChange}
          required
          min="1"
          placeholder="20"
        />

        <Select
          id="level"
          name="level"
          label="レベル"
          value={formData.level}
          onChange={handleChange}
          options={levelOptions}
        />
      </div>

      {isEditing && (
        <Select
          id="status"
          name="status"
          label="ステータス"
          value={formData.status}
          onChange={handleChange}
          options={statusOptions}
        />
      )}

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? '更新する' : '作成する'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
      </div>
    </form>
  )
}
