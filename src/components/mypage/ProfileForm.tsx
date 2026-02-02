'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Profile } from '@/types/database'

interface ProfileFormProps {
  profile: Profile | null
  userEmail: string
}

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

export function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [nickname, setNickname] = useState(profile?.nickname || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [gender, setGender] = useState(profile?.gender || '')
  const [ageGroup, setAgeGroup] = useState(profile?.age_group || '')
  const [area, setArea] = useState(profile?.area || '')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setMessage('ログインが必要です')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          nickname: nickname || null,
          phone: phone || null,
          gender: gender || null,
          age_group: ageGroup || null,
          area: area || null,
          updated_at: new Date().toISOString(),
        } as never)

      if (error) {
        setMessage('更新に失敗しました')
        return
      }

      setMessage('プロフィールを更新しました')
      router.refresh()
    } catch {
      setMessage('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          メールアドレス
        </label>
        <p className="text-gray-600 text-sm">{userEmail}</p>
      </div>

      <Input
        id="nickname"
        label="ニックネーム"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="表示名"
      />

      <Input
        id="phone"
        label="電話番号"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="090-1234-5678"
      />

      <Select
        id="gender"
        label="性別"
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        options={genderOptions}
      />

      <Select
        id="ageGroup"
        label="年代"
        value={ageGroup}
        onChange={(e) => setAgeGroup(e.target.value)}
        options={ageGroupOptions}
      />

      <Input
        id="area"
        label="居住エリア"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        placeholder="東京都渋谷区"
      />

      {message && (
        <p className={`text-sm ${message.includes('失敗') || message.includes('エラー') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}

      <Button type="submit" isLoading={isLoading} className="w-full">
        更新する
      </Button>
    </form>
  )
}
