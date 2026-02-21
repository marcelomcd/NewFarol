import React from 'react'
import { FarolStatus } from './FarolCircle'
import FarolTooltip from './FarolTooltip'

interface TrafficLightProps {
  summary: {
    [key: string]: {
      count: number
      percentage: number
    }
  }
  onStatusClick?: (status: FarolStatus) => void
}

const STATUS_ORDER: FarolStatus[] = [
  'Problema Crítico',  // Vermelho (topo)
  'Com Problema',      // Amarelo (meio)
  'Sem Problema',      // Verde (baixo)
]

const STATUS_COLORS: Record<FarolStatus, string> = {
  'Problema Crítico': '#ef4444',  // Red
  'Com Problema': '#f59e0b',      // Yellow/Amber
  'Sem Problema': '#10b981',      // Green
  'Indefinido': '#6b7280',        // Gray (não exibido, mas mantido para dados)
}

const STATUS_LABELS: Record<FarolStatus, string> = {
  'Problema Crítico': 'Problema Crítico',
  'Com Problema': 'Com Problema',
  'Sem Problema': 'Sem Problema',
  'Indefinido': 'Indefinido',
}

export default function TrafficLight({ summary, onStatusClick }: TrafficLightProps) {
  // Filtrar apenas os 3 status do semáforo (excluir Indefinido da exibição)
  const trafficLightStatuses = STATUS_ORDER.filter(status => {
    const data = summary[status]
    return data && data.count > 0
  })

  if (trafficLightStatuses.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        Nenhum dado de farol disponível.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      {/* Semáforo */}
      <div className="relative flex items-center justify-center">
        {/* Estrutura do semáforo */}
        <div className="bg-gray-800 dark:bg-gray-700 rounded-xl p-5 shadow-xl border-2 border-gray-900 dark:border-gray-800">
          {/* Círculos do semáforo (vertical: vermelho no topo, amarelo no meio, verde embaixo) */}
          <div className="flex flex-col gap-4 items-center">
            {STATUS_ORDER.map((status) => {
              const data = summary[status]
              const isActive = data && data.count > 0
              const isIndefinido = status === 'Indefinido'
              
              // Não exibir Indefinido
              if (isIndefinido) return null
              
              return (
                <FarolTooltip
                  key={status}
                  status={STATUS_LABELS[status]}
                  count={data?.count || 0}
                  percentage={data?.percentage}
                  color={STATUS_COLORS[status]}
                  position="top"
                >
                  <div
                    onClick={() => {
                      if (isActive && onStatusClick) {
                        onStatusClick(status)
                      }
                    }}
                    className={`
                      farol-lamp relative rounded-full border-2
                      ${isActive ? 'cursor-pointer' : 'cursor-default'}
                    `}
                    style={{
                      width: '88px',
                      height: '88px',
                      // CSS var para o glow animado (ver index.css)
                      ['--lamp-color' as any]: STATUS_COLORS[status],
                      borderColor: STATUS_COLORS[status],
                    }}
                  >
                  {/* Brilho interno do círculo (efeito de vidro) */}
                  <div
                    className="absolute inset-2 rounded-full opacity-40 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.55), transparent 70%)`,
                    }}
                  />
                  
                  {/* Contador dentro do círculo */}
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-white font-bold text-lg drop-shadow-xl">
                        {data.count}
                      </span>
                    </div>
                  )}
                  
                  {/* Sombra interna para profundidade */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                  </div>
                </FarolTooltip>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

