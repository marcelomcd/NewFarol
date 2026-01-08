import React from 'react'

interface StatusCardProps {
  status: string
  count: number
  onClick?: () => void
  color?: string
}

// Cores para cada status (baseado no OldFarol)
const STATUS_COLORS: Record<string, string> = {
  'Novo': '#20c997', // Verde claro
  'Em Andamento': '#198754', // Verde
  'Em Homologação': '#0d6efd', // Azul
  'Em Planejamento': '#ffc107', // Amarelo
  'Pausado pelo Cliente': '#fd7e14', // Laranja
  'Em Fase de Encerramento': '#6f42c1', // Roxo
  'Projeto Em Fase Crítica': '#dc3545', // Vermelho
  // Status fechados removidos - não devem aparecer nos cards
}

// Abreviações para textos longos
const STATUS_ABBREVIATIONS: Record<string, string> = {
  'Novo': 'NOVO',
  'Em Fase de Encerramento': 'EM ENCERRAMENTO',
  'Pausado pelo Cliente': 'PAUSADO',
  'Projeto Em Fase Crítica': 'FASE CRÍTICA',
  'Em Homologação': 'HOMOLOGAÇÃO',
  'Homologação Interna': 'HOMOLOGAÇÃO INTERNA',
  'Em Planejamento': 'PLANEJAMENTO',
  'Em Andamento': 'EM ANDAMENTO',
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
  
  return (
    <div
      onClick={onClick}
      className="flex-1 min-w-[150px] glass dark:glass-dark rounded-lg p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl border-l-4"
      style={{
        borderLeftColor: statusColor,
        background: `linear-gradient(135deg, ${statusColor}15 0%, rgba(255, 255, 255, 0.05) 100%)`,
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

