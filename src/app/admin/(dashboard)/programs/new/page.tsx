import { createClient } from '@/lib/supabase/server'
import { ProgramForm } from '@/components/admin/ProgramForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プログラム新規作成',
}

async function getFormData() {
  const supabase = await createClient()

  const [{ data: parks }, { data: categories }] = await Promise.all([
    supabase.from('parks').select('*').order('name'),
    supabase.from('event_categories').select('*').order('sort_order'),
  ])

  return {
    parks: parks || [],
    categories: categories || [],
  }
}

export default async function NewProgramPage() {
  const { parks, categories } = await getFormData()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">プログラム新規作成</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <ProgramForm parks={parks} categories={categories} />
      </div>
    </div>
  )
}
