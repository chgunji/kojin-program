'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const isAdminLogin = redirect.startsWith('/admin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('メールアドレスまたはパスワードが正しくありません')
        } else {
          setError(error.message)
        }
        return
      }

      router.push(redirect)
      router.refresh()
    } catch {
      setError('ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // Admin login design
  if (isAdminLogin) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-700">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-300" />
            </div>
            <h1 className="text-2xl font-bold text-white">管理者ログイン</h1>
          </div>

          {error && (
            <div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-4 text-sm border border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@example.com"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="パスワードを入力"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'ログイン中...' : '管理画面にログイン'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            このページは管理者専用です
          </p>
        </div>
      </div>
    )
  }

  // Regular user login design
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">ログイン</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            id="email"
            label="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="example@email.com"
          />

          <Input
            type="password"
            id="password"
            label="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="パスワードを入力"
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            ログイン
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          アカウントをお持ちでない方は{' '}
          <Link
            href={`/register${redirect !== '/' ? `?redirect=${redirect}` : ''}`}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  )
}

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const isAdminLogin = redirect.startsWith('/admin')

  return (
    <div className={`min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 ${isAdminLogin ? 'bg-gray-950' : ''}`}>
      <LoginForm />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <LoginFormFallback />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
