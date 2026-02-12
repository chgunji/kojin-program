import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProgramForm } from '@/components/admin/ProgramForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プログラム編集',
}

async function getFormData(id: string) {
  const supabase = await createClient()

  const [{ data: program }, { data: parks }, { data: categories }] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single(),
    supabase.from('parks').select('*').order('name'),
    supabase.from('event_categories').select('*').order('sort_order'),
  ])

  return {
    program,
    parks: parks || [],
    categories: categories || [],
  }
}

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { program, parks, categories } = await getFormData(id)

  if (!program) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">プログラム編集</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <ProgramForm parks={parks} categories={categories} program={program} />
      </div>
    </div>
  )
}
