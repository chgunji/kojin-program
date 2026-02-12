import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/Button'
import { ProgramsTable, type Program } from './components/ProgramsTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プログラム管理',
}

// Prevent static generation - this page requires runtime environment variables
export const dynamic = 'force-dynamic'

async function getPrograms(): Promise<Program[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      park:parks(name),
      category:event_categories(name)
    `)
    .order('date', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching programs:', error)
    return []
  }

  return (data as unknown as Program[]) || []
}

export default async function AdminProgramsPage() {
  const programs = await getPrograms()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">プログラム管理</h1>
        <Link href="/admin/programs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </Button>
        </Link>
      </div>

      <ProgramsTable initialPrograms={programs} />
    </div>
  )
}
