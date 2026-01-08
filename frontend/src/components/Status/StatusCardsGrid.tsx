import React from 'react'
import StatusCard from './StatusCard'

interface StatusCount {
  status: string
  count: number
}

interface StatusCardsGridProps {
  statusCounts: StatusCount[]
  onCardClick?: (status: string) => void
  maxCards?: number
}

// Ordem de prioridade para exibição (apenas status ativos)
const STATUS_PRIORITY = [
  'Novo',
  'Em Andamento',
  'Em Planejamento',
  'Em Homologação',
  'Pausado pelo Cliente',
  'Em Fase de Encerramento',
  'Projeto Em Fase Crítica',
]

export default function StatusCardsGrid({ statusCounts, onCardClick, maxCards }: StatusCardsGridProps) {
  // Ordenar por prioridade e quantidade
  const sortedStatuses = [...statusCounts].sort((a, b) => {
    const aPriority = STATUS_PRIORITY.indexOf(a.status)
    const bPriority = STATUS_PRIORITY.indexOf(b.status)
    
    // Se ambos estão na lista de prioridade, ordenar por prioridade
    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority
    }
    
    // Se apenas um está na lista, ele vem primeiro
    if (aPriority !== -1) return -1
    if (bPriority !== -1) return 1
    
    // Se nenhum está na lista, ordenar por quantidade (decrescente)
    return b.count - a.count
  })
  
  const displayStatuses = maxCards ? sortedStatuses.slice(0, maxCards) : sortedStatuses
  
  if (displayStatuses.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        Nenhum status disponível.
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      {displayStatuses.map(({ status, count }) => (
        <StatusCard
          key={status}
          status={status}
          count={count}
          onClick={() => onCardClick?.(status)}
        />
      ))}
    </div>
  )
}

