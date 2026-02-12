'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Edit, Eye, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

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

export interface Program {
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

interface ProgramsTableProps {
  initialPrograms: Program[]
}

export function ProgramsTable({ initialPrograms }: ProgramsTableProps) {
  const [programs, setPrograms] = useState(initialPrograms)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleStatusToggle = async (programId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open'
    setUpdatingId(programId)

    try {
      const response = await fetch(`/api/admin/programs/${programId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      setPrograms(prev =>
        prev.map(p =>
          p.id === programId ? { ...p, status: newStatus } : p
        )
      )
    } catch (error) {
      console.error('Error updating status:', error)
      alert('ステータスの更新に失敗しました')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
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
                  <Link
                    href={`/admin/programs/${program.id}/participants`}
                    className={`text-sm font-medium hover:underline ${
                      program.current_count >= program.capacity ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {program.current_count} / {program.capacity}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleStatusToggle(program.id, program.status)}
                    disabled={updatingId === program.id || program.status === 'cancelled'}
                    className="focus:outline-none disabled:cursor-not-allowed"
                    title={program.status === 'cancelled' ? 'キャンセル済みは変更できません' : 'クリックでステータス切替'}
                  >
                    <Badge
                      variant={statusColors[program.status]}
                      className={program.status !== 'cancelled' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                    >
                      {updatingId === program.id ? '更新中...' : statusLabels[program.status]}
                    </Badge>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Link href={`/programs/${program.id}`}>
                      <Button size="sm" variant="ghost" title="公開ページを見る">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/programs/${program.id}/edit`}>
                      <Button size="sm" variant="ghost" title="編集">
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
  )
}
