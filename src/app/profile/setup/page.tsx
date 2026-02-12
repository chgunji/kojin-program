'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const genderOptions = [
  { value: '', label: '選択してください' },
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'prefer_not_to_say', label: '回答しない' },
]

const ageGroupOptions = [
  { value: '', label: '選択してください' },
  { value: '10s', label: '10代' },
  { value: '20s', label: '20代' },
  { value: '30s', label: '30代' },
  { value: '40s', label: '40代' },
  { value: '50s', label: '50代' },
  { value: '60s_plus', label: '60代以上' },
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, isLoading, updateProfile } = useAuth()

  const [formData, setFormData] = useState({
    nickname: '',
    phone: '',
    gender: '',
    age_group: '',
    area: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nickname.trim()) {
      setError('ニックネームは必須です')
      return
    }

    setSaving(true)

    try {
      const result = await updateProfile({
        nickname: formData.nickname.trim(),
        phone: formData.phone || null,
        gender: formData.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say' | null || null,
        age_group: formData.age_group as '10s' | '20s' | '30s' | '40s' | '50s' | '60s_plus' | null || null,
        area: formData.area || null,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      router.push('/programs')
    } catch {
      setError('プロフィールの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-2">プロフィール設定</h1>
          <p className="text-gray-600 text-center mb-6">
            プログラムに参加するために必要な情報を入力してください
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              id="nickname"
              name="nickname"
              label="ニックネーム"
              value={formData.nickname}
              onChange={handleChange}
              required
              placeholder="例: サッカー太郎"
            />

            <Input
              type="tel"
              id="phone"
              name="phone"
              label="電話番号（任意）"
              value={formData.phone}
              onChange={handleChange}
              placeholder="例: 090-1234-5678"
            />

            <Select
              id="gender"
              name="gender"
              label="性別（任意）"
              value={formData.gender}
              onChange={handleChange}
              options={genderOptions}
            />

            <Select
              id="age_group"
              name="age_group"
              label="年代（任意）"
              value={formData.age_group}
              onChange={handleChange}
              options={ageGroupOptions}
            />

            <Input
              type="text"
              id="area"
              name="area"
              label="活動地域（任意）"
              value={formData.area}
              onChange={handleChange}
              placeholder="例: 東京都、神奈川県"
            />

            <Button type="submit" className="w-full" isLoading={saving}>
              保存してプログラムを探す
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
