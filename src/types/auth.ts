import type { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string | undefined
  created_at: string
}

export interface UserProfile {
  id: string
  nickname: string | null
  phone: string | null
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  age_group: '10s' | '20s' | '30s' | '40s' | '50s' | '60s_plus' | null
  area: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}
