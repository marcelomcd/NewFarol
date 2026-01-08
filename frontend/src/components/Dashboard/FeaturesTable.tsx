import React from 'react'
import { Feature } from '../../services/api'
import Tooltip from '../Tooltip/Tooltip'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FeaturesTableProps {
  title: string
  features: Feature[]
  columns: string[]
  onFeatureClick?: (feature: Feature) => void
}

export default function FeaturesTable({ title, features, columns, onFeatureClick }: FeaturesTableProps) {
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return format(date, 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  const getColumnValue = (feature: Feature, column: string): string => {
    switch (column) {
      case 'ID':
        return feature.id.toString()
      case 'Title':
        return feature.title || 'Sem título'
      case 'State':
        return feature.state || '-'
      case 'Assigned To':
        // Tentar extrair nome do assigned_to se for email ou formato complexo
        const assignedTo = feature.assigned_to || feature.responsible || feature.pmo
        if (!assignedTo) return 'Não atribuído'
        // Se for email, extrair nome
        if (assignedTo.includes('@')) {
          const emailParts = assignedTo.split('@')[0].split('.')
          return emailParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
        }
        // Se tiver formato de objeto JSON (displayName)
        try {
          const parsed = typeof assignedTo === 'string' ? JSON.parse(assignedTo) : assignedTo
          if (parsed?.displayName) return parsed.displayName
        } catch {
          // Não é JSON, usar como está
        }
        return assignedTo
      case 'Target Date':
        return feature.raw_fields_json?.['Microsoft.VSTS.Scheduling.TargetDate'] 
          ? formatDate(feature.raw_fields_json['Microsoft.VSTS.Scheduling.TargetDate'])
          : '-'
      case 'Client':
        return feature.client || '-'
      case 'PMO':
        return feature.pmo || '-'
      case 'Work Item Type':
        return feature.raw_fields_json?.['System.WorkItemType'] || feature.work_item_type || 'Feature'
      case 'Parent':
        return feature.raw_fields_json?.['System.Parent'] || '-'
      case 'Board':
        return feature.board_column || feature.raw_fields_json?.['System.BoardColumn'] || '-'
      case 'Iteration':
        return feature.raw_fields_json?.['System.IterationPath'] || '-'
      case 'Area Path':
        return feature.area_path || '-'
      default:
        return '-'
    }
  }

  if (features.length === 0) {
    return (
      <div className="glass dark:glass-dark p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{title}</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Nenhum item encontrado
        </div>
      </div>
    )
  }

  return (
    <div className="glass dark:glass-dark p-6 rounded-lg">
      {title && (
        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
          {title}
        </h3>
      )}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {features.map((feature) => (
              <tr
                key={feature.id}
                onClick={() => onFeatureClick?.(feature)}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <Tooltip content={getColumnValue(feature, col)} position="top">
                      <div className="truncate max-w-xs">
                        {getColumnValue(feature, col)}
                      </div>
                    </Tooltip>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

