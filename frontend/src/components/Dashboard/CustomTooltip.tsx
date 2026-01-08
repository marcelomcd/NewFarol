import React from 'react'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number | string
    dataKey?: string
    color?: string
    payload?: any
  }>
  label?: string
  formatter?: (value: any, name: string, props?: any) => [string, string] | string
}

export default function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 backdrop-blur-sm min-w-[160px]">
      {label && (
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          {label}
        </div>
      )}
      <div className="space-y-2">
        {payload.map((item, index) => {
          const value = item?.value
          const name = item?.name || item?.dataKey || ''
          const color = item?.color || '#3b82f6'
          
          // Formatar valor se houver formatter
          let displayValue: string | number = value as string | number
          let displayName: string = name
          
          if (formatter && value !== undefined) {
            try {
              const formatted = formatter(value, name, item)
              if (Array.isArray(formatted) && formatted.length >= 2) {
                displayValue = formatted[0]
                displayName = formatted[1]
              } else if (typeof formatted === 'string') {
                displayValue = formatted
              }
            } catch (e) {
              // Se o formatter falhar, usar valores originais
              displayValue = value as string | number
              displayName = name
            }
          }

          // Para gráficos de pizza, usar o payload.name se disponível
          if (item.payload?.name && !displayName) {
            displayName = item.payload.name
          }

          // Para gráficos de pizza, mostrar porcentagem se disponível
          if (item.payload?.percentage !== undefined && typeof displayValue === 'number') {
            displayValue = `${displayValue} (${item.payload.percentage}%)`
          }

          return (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {displayName}
                </div>
                <div className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {typeof displayValue === 'number' ? displayValue.toLocaleString('pt-BR') : displayValue}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

