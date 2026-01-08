import React from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WorkItem {
  id: number
  title: string
  state: string
  assigned_to?: string
  target_date?: string
  days_overdue?: number
  web_url?: string
  work_item_type?: string
  [key: string]: any
}

interface WorkItemsTableProps {
  title: string
  items: WorkItem[]
  columns: Array<{
    key: string
    label: string
    render?: (item: WorkItem) => React.ReactNode
  }>
  maxRows?: number
  onItemClick?: (item: WorkItem) => void
}

export default function WorkItemsTable({
  title,
  items,
  columns,
  maxRows,
  onItemClick,
}: WorkItemsTableProps) {
  const navigate = useNavigate()
  const displayItems = maxRows ? items.slice(0, maxRows) : items

  const handleClick = (item: WorkItem) => {
    if (onItemClick) {
      onItemClick(item)
    } else if (item.work_item_type === 'Feature') {
      navigate(`/features/${item.id}`)
    } else if (item.web_url) {
      window.open(item.web_url, '_blank')
    }
  }

  return (
    <div className="glass dark:glass-dark rounded-lg overflow-hidden">
      {title && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {displayItems.map((item) => (
              <tr
                key={item.id}
                onClick={() => handleClick(item)}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {column.render ? column.render(item) : item[column.key] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length > maxRows && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          Mostrando {maxRows} de {items.length} itens
        </div>
      )}
      {items.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          Nenhum item encontrado
        </div>
      )}
    </div>
  )
}

