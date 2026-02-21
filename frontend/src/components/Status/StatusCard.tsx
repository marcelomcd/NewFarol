import React from 'react'

interface StatusCardProps {
  status: string
  count: number
  onClick?: () => void
  color?: string
}

// Cores para cada status (baseado no OldFarol)
const CRITICAL_STATUSES = ['Projeto Em Fase Crítica', 'Projeto em Fase Crítica']

const STATUS_COLORS: Record<string, string> = {
  'Novo': '#20c997', // Verde claro
  'Em Aberto': '#10b981', // Verde
  'Em Andamento': '#198754', // Verde
  'Em Homologação': '#0d6efd', // Azul
  'Em Planejamento': '#ffc107', // Amarelo
  'Pausado pelo Cliente': '#fd7e14', // Laranja
  'Pausado Pelo Cliente': '#fd7e14', // Laranja (alternativa)
  'Em Fase de Encerramento': '#6f42c1', // Roxo
  'Projeto Em Fase Crítica': '#dc3545', // Vermelho
  'Projeto em Fase Crítica': '#dc3545', // Vermelho (alternativa)
  'Em Garantia': '#0ea5e9', // Azul claro
  'Homologação Interna': '#8b5cf6', // Roxo claro
  // Status fechados removidos - não devem aparecer nos cards
}

// Abreviações para textos longos
const STATUS_ABBREVIATIONS: Record<string, string> = {
  'Novo': 'NOVO',
  'Em Aberto': 'EM ABERTO',
  'Em Fase de Encerramento': 'EM ENCERRAMENTO',
  'Pausado pelo Cliente': 'PAUSADO PELO CLIENTE',
  'Pausado Pelo Cliente': 'PAUSADO PELO CLIENTE',
  'Projeto Em Fase Crítica': 'PROJETO EM FASE CRÍTICA',
  'Projeto em Fase Crítica': 'PROJETO EM FASE CRÍTICA',
  'Em Homologação': 'HOMOLOGAÇÃO',
  'Homologação Interna': 'HOMOLOGAÇÃO INTERNA',
  'Em Planejamento': 'PLANEJAMENTO',
  'Em Andamento': 'EM ANDAMENTO',
  'Em Garantia': 'EM GARANTIA',
}

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#6c757d'
}

function getStatusLabel(status: string): string {
  return STATUS_ABBREVIATIONS[status] || status.toUpperCase()
}

export default function StatusCard({ status, count, onClick, color }: StatusCardProps) {
  const statusColor = color || getStatusColor(status)
  const statusLabel = getStatusLabel(status)
  const isCritical = CRITICAL_STATUSES.includes(status)

  return (
    <div
      onClick={onClick}
      className={`flex-1 min-w-[150px] glass dark:glass-dark rounded-lg p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-b-4 ${
        isCritical ? 'ring-2 ring-red-400/50 dark:ring-red-500/40' : ''
      }`}
      style={{
        borderBottomColor: isCritical ? statusColor : `${statusColor}30`,
        borderBottomWidth: isCritical ? '6px' : '4px',
        background: `linear-gradient(135deg, ${statusColor}${isCritical ? '25' : '15'} 0%, rgba(255, 255, 255, 0.05) 100%)`,
        transition: 'border-bottom-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
        ['--status-color' as any]: statusColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderBottomColor = statusColor
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderBottomColor = isCritical ? statusColor : `${statusColor}30`
      }}
    >
      <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        {count}
      </div>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {statusLabel}
      </div>
    </div>
  )
}

