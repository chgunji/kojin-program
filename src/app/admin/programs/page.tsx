import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Plus, Edit, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プログラム管理',
}

const statusLabels: Record<string, string> = {
  open: '受付中',
  closed: '受付終了',
  cancelled: 'キャンセル',
}

const statusColors: Record<string, 'success' | 'default' | 'danger'> = {
  open: 'success',
  closed: 'default',
  cancelled: 'danger',
}

interface ProgramWithRelations {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  current_count: number
  capacity: number
  status: string
  park: { name: string }
  category: { name: string }
}

async function getPrograms(): Promise<ProgramWithRelations[]> {
  const supabase = await createClient()

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

  return (data as unknown as ProgramWithRelations[]) || []
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

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プログラム
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  会場
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申込状況
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {programs.map((program) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{program.title}</p>
                      <p className="text-sm text-gray-500">{program.category.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm">
                      {format(new Date(program.date), 'M月d日(E)', { locale: ja })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {program.start_time.slice(0, 5)} - {program.end_time.slice(0, 5)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {program.park.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      program.current_count >= program.capacity ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {program.current_count} / {program.capacity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={statusColors[program.status]}>
                      {statusLabels[program.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link href={`/programs/${program.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/programs/${program.id}/edit`}>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {programs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">プログラムがありません</p>
            <Link href="/admin/programs/new">
              <Button>最初のプログラムを作成</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
