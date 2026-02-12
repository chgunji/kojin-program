'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { AuthContextType, UserProfile } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data as UserProfile
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
  }, [user, fetchProfile])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          return { error: 'メールアドレスまたはパスワードが正しくありません' }
        }
        return { error: error.message }
      }

      return { error: null }
    } catch {
      return { error: 'ログインに失敗しました' }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'このメールアドレスは既に登録されています' }
        }
        return { error: error.message }
      }

      return { error: null }
    } catch {
      return { error: '登録に失敗しました' }
    }
  }

  const logout = async () => {
    try {
      // クライアントサイドのサインアウト
      await supabase.auth.signOut()
      // サーバーサイドの Cookie もクリア
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setProfile(null)
    }
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      return { error: 'ログインが必要です' }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          nickname: data.nickname,
          phone: data.phone,
          gender: data.gender,
          age_group: data.age_group,
          area: data.area,
        })
        .eq('id', user.id)

      if (error) {
        return { error: 'プロフィールの更新に失敗しました' }
      }

      await refreshProfile()
      return { error: null }
    } catch {
      return { error: 'プロフィールの更新に失敗しました' }
    }
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAdmin,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
