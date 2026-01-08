import React from 'react'
import FarolCard from './FarolCard'
import { FarolStatus } from './FarolCircle'

interface FarolSummary {
  [key: string]: {
    count: number
    percentage: number
  }
}

interface FarolCardsGridProps {
  summary: FarolSummary
  onCardClick?: (status: FarolStatus) => void
}

const PRIORITY_ORDER: FarolStatus[] = [
  'Problema Crítico',
  'Com Problema',
  'Sem Problema',
  'Indefinido',
]

export default function FarolCardsGrid({ summary, onCardClick }: FarolCardsGridProps) {
  const cards = PRIORITY_ORDER
    .filter(status => summary[status] && summary[status]!.count > 0)
    .map(status => (
      <FarolCard
        key={status}
        status={status}
        count={summary[status]!.count}
        onClick={() => onCardClick?.(status)}
      />
    ))

  if (cards.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        Nenhum dado de farol disponível.
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center flex-wrap gap-6">
      {cards}
    </div>
  )
}

