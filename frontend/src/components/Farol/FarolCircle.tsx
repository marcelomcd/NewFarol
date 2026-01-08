import React from 'react'
import Tooltip from '../Tooltip/Tooltip'

export type FarolStatus = 'Sem Problema' | 'Com Problema' | 'Problema Crítico' | 'Indefinido'

interface FarolCircleProps {
  status?: string | null
  size?: 'small' | 'normal' | 'large'
  showLabel?: boolean
  className?: string
}

const FAROL_COLORS: Record<FarolStatus, string> = {
  'Sem Problema': '#198754',
  'Com Problema': '#FFC107',
  'Problema Crítico': '#DC3545',
  'Indefinido': '#6C757D',
}

const FAROL_TOOLTIPS: Record<FarolStatus, string> = {
  'Sem Problema': 'Projeto Sem Problemas',
  'Com Problema': 'Projeto Com Problemas - Requer Atenção',
  'Problema Crítico': 'Problema Crítico - Ação Imediata Necessária',
  'Indefinido': 'Status do Projeto Indefinido',
}

const SIZE_MAP = {
  small: 'w-4 h-4',
  normal: 'w-6 h-6',
  large: 'w-8 h-8',
}

function normalizeStatus(status?: string | null): FarolStatus {
  if (!status) return 'Indefinido'
  
  const statusLower = status.toLowerCase().trim()
  
  if (statusLower.includes('sem problema') || statusLower.includes('green')) {
    return 'Sem Problema'
  }
  if (statusLower.includes('com problema') || statusLower.includes('yellow')) {
    return 'Com Problema'
  }
  if (statusLower.includes('problema crítico') || statusLower.includes('problema critico') || statusLower.includes('red')) {
    return 'Problema Crítico'
  }
  
  return 'Indefinido'
}

export default function FarolCircle({ 
  status, 
  size = 'normal', 
  showLabel = false,
  className = '' 
}: FarolCircleProps) {
  const normalizedStatus = normalizeStatus(status)
  const color = FAROL_COLORS[normalizedStatus]
  const tooltip = FAROL_TOOLTIPS[normalizedStatus]
  const sizeClass = SIZE_MAP[size]

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <Tooltip content={tooltip} position="top">
        <div
          className={`${sizeClass} rounded-full border-2 border-white/20 shadow-lg cursor-help transition-transform hover:scale-110`}
          style={{ backgroundColor: color }}
        />
      </Tooltip>
      {showLabel && (
        <span className="text-xs font-medium mt-1 text-gray-700 dark:text-gray-300">
          {normalizedStatus}
        </span>
      )}
    </div>
  )
}

