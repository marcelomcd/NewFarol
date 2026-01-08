/**
 * Hook para calcular métricas do dashboard.
 * 
 * Centraliza toda lógica de cálculo de contagens e agregações.
 */
import { useMemo } from 'react'
import { Feature } from '../../../services/api'
import { normalizarStatus } from '../../../utils/statusNormalization'
import { normalizeFarolStatus, getFarolStatusSummary } from '../../../utils/farol'

interface DashboardMetricsProps {
  filteredItems: Feature[]
  countsWiqlData: any
  hasActiveFilters: boolean
}

export interface DashboardMetrics {
  // Contagens principais
  totalProjects: number
  openProjects: number
  overdueProjects: Feature[]
  nearDeadlineProjects: Feature[]
  
  // Contagens por categoria
  farolSummary: Record<string, any>
  stateCounts: Array<{ name: string; value: number }>
  statusCardsData: Array<{ name: string; value: number }>
  
  // Agregações
  uniqueClients: string[]
  uniquePMOs: string[]
  uniqueStates: string[]
  responsibleCounts: Array<{ name: string; value: number }>
}

const EXCLUDED_STATES = ['Encerrado', 'Em Garantia']
const HIDDEN_CARD_STATES = ['Active', 'Sem Estado', 'Removed']

const STATUS_ORDER = [
  "Em Aberto",
  "Em Planejamento",
  "Em Andamento",
  "Projeto em Fase Crítica",
  "Homologação Interna",
  "Em Homologação",
  "Em Fase de Encerramento",
  "Em Garantia",
  "Pausado Pelo Cliente",
  "Encerrado",
]

export function useDashboardMetrics({
  filteredItems,
  countsWiqlData,
  hasActiveFilters
}: DashboardMetricsProps): DashboardMetrics {
  
  // Itens ativos (excluindo Closed e Em Garantia)
  const activeItems = useMemo(() => {
    return filteredItems.filter(item => {
      const state = normalizarStatus(item.state || '')
      return !EXCLUDED_STATES.includes(state)
    })
  }, [filteredItems])
  
  // Total de projetos
  const totalProjects = useMemo(() => {
    if (countsWiqlData?.total !== undefined && !hasActiveFilters) {
      return countsWiqlData.total
    }
    return filteredItems.length
  }, [filteredItems, countsWiqlData, hasActiveFilters])
  
  // Em Aberto
  const openProjects = useMemo(() => {
    if (countsWiqlData?.open !== undefined && !hasActiveFilters) {
      console.log('[useDashboardMetrics] ✅ openProjects: Usando WIQL:', countsWiqlData.open)
      return countsWiqlData.open
    }
    
    const count = filteredItems.filter(item => {
      const state = normalizarStatus(item.state || '')
      return state !== 'Encerrado' && state !== 'Closed'
    }).length
    
    console.log('[useDashboardMetrics] 🔍 openProjects: Cálculo local:', count)
    return count
  }, [filteredItems, countsWiqlData, hasActiveFilters])
  
  // Projetos atrasados
  const overdueProjects = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return activeItems.filter(item => {
      if (!item.raw_fields_json?.['Microsoft.VSTS.Scheduling.TargetDate']) return false
      const targetDate = new Date(item.raw_fields_json['Microsoft.VSTS.Scheduling.TargetDate'])
      return targetDate < today
    })
  }, [activeItems])
  
  // Projetos próximos do prazo
  const nearDeadlineProjects = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    
    return activeItems.filter(item => {
      if (!item.raw_fields_json?.['Microsoft.VSTS.Scheduling.TargetDate']) return false
      const targetDate = new Date(item.raw_fields_json['Microsoft.VSTS.Scheduling.TargetDate'])
      return targetDate >= today && targetDate <= sevenDaysFromNow
    })
  }, [activeItems])
  
  // Resumo de Farol
  const farolSummary = useMemo(() => {
    return getFarolStatusSummary(activeItems)
  }, [activeItems])
  
  // Contagem por estado
  const stateCounts = useMemo(() => {
    const counts = activeItems.reduce((acc: Record<string, number>, item) => {
      const state = normalizarStatus(item.state || 'Sem Estado')
      if (!HIDDEN_CARD_STATES.includes(state)) {
        acc[state] = (acc[state] || 0) + 1
      }
      return acc
    }, {})
    
    return STATUS_ORDER.map(name => ({
      name,
      value: counts[name] || 0,
    })).filter(item => item.value > 0)
  }, [activeItems])
  
  // Status cards data (com WIQL quando disponível)
  const statusCardsData = useMemo(() => {
    // Implementação conforme necessário
    return stateCounts
  }, [stateCounts])
  
  // Clientes únicos
  const uniqueClients = useMemo(() => {
    if (validClientsData?.clients) {
      return validClientsData.clients
    }
    const clients = new Set<string>()
    activeItems.forEach(item => {
      if (item.client) clients.add(item.client)
    })
    return Array.from(clients).sort()
  }, [activeItems, validClientsData])
  
  // PMOs únicos
  const uniquePMOs = useMemo(() => {
    const pmos = new Set<string>()
    activeItems.forEach(item => {
      if (item.pmo) pmos.add(item.pmo)
    })
    return Array.from(pmos).sort()
  }, [activeItems])
  
  // Estados únicos
  const uniqueStates = useMemo(() => {
    const states = new Set<string>()
    activeItems.forEach(item => {
      const state = normalizarStatus(item.state || '')
      if (!HIDDEN_CARD_STATES.includes(state)) {
        states.add(state)
      }
    })
    return Array.from(states).sort()
  }, [activeItems])
  
  // Contagem por responsável
  const responsibleCounts = useMemo(() => {
    const counts = activeItems.reduce((acc: Record<string, number>, item) => {
      const responsible = item.pmo || item.assigned_to || 'Não Atribuído'
      acc[responsible] = (acc[responsible] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [activeItems])
  
  return {
    totalProjects,
    openProjects,
    overdueProjects,
    nearDeadlineProjects,
    farolSummary,
    stateCounts,
    statusCardsData,
    uniqueClients,
    uniquePMOs,
    uniqueStates,
    responsibleCounts,
  }
}

