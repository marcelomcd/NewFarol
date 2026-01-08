import React from 'react'
import FarolCircle, { FarolStatus } from './FarolCircle'

interface FarolCardProps {
  status: FarolStatus
  count: number
  onClick?: () => void
}

const FAROL_DESCRIPTIONS: Record<FarolStatus, string> = {
  'Sem Problema': 'SEM PROBLEMA',
  'Com Problema': 'COM PROBLEMA',
  'Problema Crítico': 'PROBLEMA CRÍTICO',
  'Indefinido': 'INDEFINIDO',
}

export default function FarolCard({ status, count, onClick }: FarolCardProps) {
  const description = FAROL_DESCRIPTIONS[status]
  
  return (
    <div
      onClick={onClick}
      className={`
        glass dark:glass-dark 
        rounded-full 
        w-20 h-20 
        flex flex-col 
        items-center 
        justify-center 
        cursor-pointer 
        transition-all 
        hover:scale-110 
        hover:shadow-xl
        border-2
        ${
          status === 'Sem Problema' ? 'border-green-500/30' :
          status === 'Com Problema' ? 'border-yellow-500/30' :
          status === 'Problema Crítico' ? 'border-red-500/30' :
          'border-gray-500/30'
        }
      `}
      style={{
        minWidth: '80px',
        minHeight: '80px',
        maxWidth: '80px',
        maxHeight: '80px',
      }}
    >
      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        {count}
      </div>
      <FarolCircle status={status} size="normal" />
      <div className="text-[0.6rem] font-medium text-gray-600 dark:text-gray-400 mt-1 uppercase tracking-wide">
        {description}
      </div>
    </div>
  )
}

