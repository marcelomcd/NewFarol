/**
 * Hook principal do Dashboard Interativo.
 *
 * Centraliza: fetching de dados, filtros, derivação de métricas, contagens
 * e dados para gráficos. O componente InteractiveDashboard consome este hook.
 */
import { useMemo, useState, useCallback } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  azdoApi,
  featuresApi,
  featuresCountApi,
  workItemsApi,
  type Feature,
} from '../../../services/api'
import { FarolStatus, getFarolStatusSummary, normalizeFarolStatus } from '../../../utils/farol'
import { normalizarStatus } from '../../../utils/statusNormalization'
import {
  normalizeClientKey,
  extractPMO,
  extractResponsavelCliente,
  getTargetDate,
} from '../../../utils/featureExtractors'
import { MONTHS_PT } from '../../../constants/dashboard'

const EXCLUDED_STATES = ['Encerrado']
const HIDDEN_CARD_STATES = ['Active', 'Sem Estado', 'Removed']
const STATUS_ORDER = [
  'Em Aberto', 'Em Planejamento', 'Em Andamento', 'Projeto em Fase Crítica',
  'Homologação Interna', 'Em Homologação', 'Em Fase de Encerramento',
  'Em Garantia', 'Pausado Pelo Cliente', 'Encerrado',
]

const now = new Date()
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()
const YEARS_RANGE = 5
const yearOptions = Array.from({ length: YEARS_RANGE * 2 + 1 }, (_, i) => currentYear - YEARS_RANGE + i)

export interface DrillDownModalState {
  isOpen: boolean
  title: string
  items: Feature[]
  filterLabel: string
}

export function useInteractiveDashboard() {
  const [selectedFarol, setSelectedFarol] = useState<FarolStatus | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedPMO, setSelectedPMO] = useState<string | null>(null)
  const [selectedResponsavel, setSelectedResponsavel] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [drillDownModal, setDrillDownModal] = useState<DrillDownModalState>({
    isOpen: false, title: '', items: [], filterLabel: '',
  })
  const [clientsModal, setClientsModal] = useState({ isOpen: false })
  const [pmosModal, setPMOsModal] = useState({ isOpen: false })
  const [evolucaoEntregasMeses, setEvolucaoEntregasMeses] = useState(6)
  const [evolucaoTasksMeses, setEvolucaoTasksMeses] = useState(6)
  const [closedByDayDias, setClosedByDayDias] = useState(30)
  const [responsaveisListExpanded, setResponsaveisListExpanded] = useState(false)

  const openDrillDown = useCallback((title: string, items: Feature[], filterLabel: string) => {
    setDrillDownModal({ isOpen: true, title, items, filterLabel })
  }, [])

  const clearFilters = useCallback(() => {
    setSelectedFarol(null)
    setSelectedClient(null)
    setSelectedState(null)
    setSelectedPMO(null)
    setSelectedResponsavel(null)
  }, [])

  const { data: featuresData, isLoading: featuresLoading } = useQuery({
    queryKey: ['features', 'all'],
    queryFn: () => featuresApi.list({ limit: 1000 }),
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const { data: countsByMonthData } = useQuery({
    queryKey: ['azdo', 'counts-by-month', selectedMonth, selectedYear, true],
    queryFn: () => azdoApi.getCountsByMonth(selectedMonth, selectedYear, true),
    staleTime: 60_000,
  })

  const { data: tasksSummaryData } = useQuery({
    queryKey: ['work-items', 'tasks-summary'],
    queryFn: () => workItemsApi.getTasksSummary(),
    staleTime: 300_000,
    gcTime: 600_000,
    refetchOnWindowFocus: false,
  })

  const { data: tasksOpenData } = useQuery({
    queryKey: ['tasks', 'open'],
    queryFn: () => featuresCountApi.getTasksOpenWiql(),
    staleTime: 300_000,
    gcTime: 600_000,
    refetchOnWindowFocus: false,
  })

  const { data: tasksClosedData } = useQuery({
    queryKey: ['tasks', 'closed'],
    queryFn: () => featuresCountApi.getTasksClosedWiql(),
    staleTime: 300_000,
    gcTime: 600_000,
    refetchOnWindowFocus: false,
  })

  const lastNMonthsForTasks = useMemo(() => {
    const n = evolucaoTasksMeses
    const result: { month: number; year: number }[] = []
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      result.push({ month: d.getMonth() + 1, year: d.getFullYear() })
    }
    return result
  }, [evolucaoTasksMeses])

  const tasksByMonthQueries = useQueries({
    queries: lastNMonthsForTasks.map(({ month, year }) => ({
      queryKey: ['azdo', 'counts-by-month-tasks', month, year, true],
      queryFn: () => azdoApi.getCountsByMonth(month, year, true),
      staleTime: 60_000,
    })),
  })

  const {
    data: consolidatedAzdoData,
    isLoading: consolidatedLoading,
    error: consolidatedError,
  } = useQuery({
    queryKey: ['azdo', 'consolidated', 7],
    queryFn: () => azdoApi.getConsolidated({ days_near_deadline: 7, cache_seconds: 10 }),
    retry: 2,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 30_000,
  })

  const countsWiqlData = consolidatedAzdoData?.totals
    ? {
        total: consolidatedAzdoData.totals.total_projects,
        open: consolidatedAzdoData.totals.open_projects,
        overdue: consolidatedAzdoData.totals.overdue_projects,
        near_deadline: consolidatedAzdoData.totals.near_deadline_projects,
        source: consolidatedAzdoData.cache?.hit ? 'azdo_consolidated_cache' : 'azdo_consolidated',
      }
    : undefined

  const openFeaturesWiqlData = consolidatedAzdoData?.lists?.open_projects
    ? { items: consolidatedAzdoData.lists.open_projects, count: consolidatedAzdoData.lists.open_projects.length, source: 'azdo_consolidated' }
    : undefined

  const closedFeaturesWiqlData = consolidatedAzdoData?.lists?.closed_projects
    ? { items: consolidatedAzdoData.lists.closed_projects, count: consolidatedAzdoData.lists.closed_projects.length, source: 'azdo_consolidated' }
    : undefined

  const nearDeadlineWiqlData = consolidatedAzdoData?.lists?.near_deadline_projects
    ? { items: consolidatedAzdoData.lists.near_deadline_projects, count: consolidatedAzdoData.lists.near_deadline_projects.length, source: 'azdo_consolidated', days: 7 }
    : undefined

  const baseItems = useMemo<Feature[]>(() => {
    const openItems = (openFeaturesWiqlData?.items ?? []) as Feature[]
    const closedItems = (closedFeaturesWiqlData?.items ?? []) as Feature[]
    const combinedItems = [...openItems, ...closedItems]
    if (combinedItems.length === 0) return (featuresData?.items ?? []) as Feature[]
    return combinedItems
  }, [featuresData, openFeaturesWiqlData, closedFeaturesWiqlData])

  const filteredItems = useMemo(() => {
    let items = baseItems
    if (selectedFarol) items = items.filter((i) => normalizeFarolStatus(i.farol_status) === selectedFarol)
    if (selectedClient) {
      const key = normalizeClientKey(selectedClient)
      items = items.filter((i) => normalizeClientKey(i.client) === key)
    }
    if (selectedState) items = items.filter((i) => normalizarStatus(i.state || '') === selectedState)
    if (selectedPMO) items = items.filter((i) => extractPMO(i) === selectedPMO)
    if (selectedResponsavel) items = items.filter((i) => extractResponsavelCliente(i) === selectedResponsavel)
    return items
  }, [baseItems, selectedFarol, selectedClient, selectedState, selectedPMO, selectedResponsavel])

  const activeItems = useMemo(() => {
    return filteredItems.filter((i) => !EXCLUDED_STATES.includes(normalizarStatus(i.state || '')))
  }, [filteredItems])

  const hasFilters = !!(selectedFarol || selectedClient || selectedState || selectedPMO || selectedResponsavel)

  const totalProjects = useMemo(() => {
    if (!hasFilters && countsWiqlData?.total !== undefined) {
      const openCount = countsWiqlData.open ?? 0
      const closedCount = closedFeaturesWiqlData?.count ?? 0
      const expectedTotal = openCount + closedCount
      return countsWiqlData.total >= expectedTotal ? countsWiqlData.total : expectedTotal
    }
    return filteredItems.length
  }, [countsWiqlData, closedFeaturesWiqlData, filteredItems.length, hasFilters])

  const openCount = useMemo(() => {
    if (hasFilters) {
      return filteredItems.filter((i) => {
        const s = normalizarStatus(i.state || '')
        return s !== 'Encerrado' && s !== 'Closed'
      }).length
    }
    if (countsWiqlData?.open !== undefined) return countsWiqlData.open
    return filteredItems.filter((i) => {
      const s = normalizarStatus(i.state || '')
      return s !== 'Encerrado' && s !== 'Closed'
    }).length
  }, [countsWiqlData, filteredItems, hasFilters])

  const backlogNewCount = useMemo(() => {
    return activeItems.filter((i) => {
      if (i.work_item_type?.toLowerCase() !== 'feature') return false
      return normalizarStatus(i.state || '') === 'New'
    }).length
  }, [activeItems])

  const farolSummary = useMemo(() => getFarolStatusSummary(activeItems), [activeItems])
  const farolSummaryDisplay = useMemo(() => {
    const { Indefinido: _ignored, ...rest } = (farolSummary as Record<string, unknown>) || {}
    return rest
  }, [farolSummary])

  const statusCardsData = useMemo(() => {
    if (!hasFilters && consolidatedAzdoData?.features_by_status) {
      const normalizedCounts: Record<string, number> = {}
      Object.entries(consolidatedAzdoData.features_by_status as Record<string, { count?: number }>).forEach(([rawStatus, payload]) => {
        const count = payload?.count ?? 0
        const normalized = normalizarStatus(rawStatus)
        if (!HIDDEN_CARD_STATES.includes(normalized)) normalizedCounts[normalized] = (normalizedCounts[normalized] || 0) + count
      })
      return STATUS_ORDER.map((name) => ({ status: name, count: normalizedCounts[name] || 0 }))
        .filter(({ status, count }) => count > 0 && !EXCLUDED_STATES.includes(status) && !HIDDEN_CARD_STATES.includes(status))
    }
    const activeStateCounts = activeItems.reduce((acc: Record<string, number>, item) => {
      if (item.work_item_type?.toLowerCase() !== 'feature') return acc
      const state = normalizarStatus(item.state || 'Sem Estado')
      if (!HIDDEN_CARD_STATES.includes(state)) acc[state] = (acc[state] || 0) + 1
      return acc
    }, {})
    return STATUS_ORDER.map((name) => {
      let count = activeStateCounts[name] || 0
      if (name === 'New') count = backlogNewCount
      return { status: name, count }
    }).filter(({ status, count }) => count > 0 && !EXCLUDED_STATES.includes(status) && !HIDDEN_CARD_STATES.includes(status))
  }, [activeItems, backlogNewCount, consolidatedAzdoData, hasFilters])

  const statusPieData = useMemo(() => {
    const counts = activeItems.reduce((acc: Record<string, number>, item) => {
      if (item.work_item_type?.toLowerCase() !== 'feature') return acc
      const s = normalizarStatus(item.state || '')
      if (EXCLUDED_STATES.includes(s) || HIDDEN_CARD_STATES.includes(s)) return acc
      acc[s] = (acc[s] || 0) + 1
      return acc
    }, {})
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, percentage: Math.round((value / total) * 100) }))
  }, [activeItems])

  const uniqueClients = useMemo(() => {
    const summary = consolidatedAzdoData?.clients?.summary
    if (Array.isArray(summary) && summary.length > 0) return summary.map((c: { name: string }) => c.name).sort()
    return []
  }, [consolidatedAzdoData])

  const clientsForFilter = useMemo(() => {
    const summary = consolidatedAzdoData?.clients?.summary
    if (Array.isArray(summary) && summary.length > 0) {
      const active = summary.filter((c: { active?: number }) => (c.active || 0) > 0).map((c: { name: string }) => c.name)
      const closed = summary.filter((c: { active?: number; total?: number }) => (c.active || 0) === 0 && (c.total || 0) > 0).map((c: { name: string }) => c.name)
      return { active: active.sort(), closed: closed.sort() }
    }
    return { active: [] as string[], closed: [] as string[] }
  }, [consolidatedAzdoData])

  const uniqueStates = useMemo(() => {
    const states = new Set(
      filteredItems
        .map((i) => normalizarStatus(i.state || ''))
        .filter((s) => !EXCLUDED_STATES.includes(s) && !HIDDEN_CARD_STATES.includes(s)),
    )
    return Array.from(states).sort()
  }, [filteredItems])

  const uniquePMOs = useMemo(() => {
    const pmos = new Set(filteredItems.map((i) => extractPMO(i)).filter(Boolean))
    return Array.from(pmos).sort()
  }, [filteredItems])

  const uniqueResponsibles = useMemo(() => {
    const responsibles = new Set(baseItems.map((i) => extractResponsavelCliente(i)).filter((r) => r && r !== 'Não atribuído'))
    return Array.from(responsibles).sort()
  }, [baseItems])

  const overdueProjects = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return activeItems.filter((i) => {
      const td = getTargetDate(i)
      if (!td) return false
      const t = new Date(td)
      t.setHours(0, 0, 0, 0)
      return t < today
    })
  }, [activeItems])

  const onTimeProjects = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return activeItems.filter((i) => {
      const td = getTargetDate(i)
      if (!td) return true
      const t = new Date(td)
      t.setHours(0, 0, 0, 0)
      return t >= today
    })
  }, [activeItems])

  const semProblemaProjects = useMemo(
    () => activeItems.filter((i) => normalizeFarolStatus(i.farol_status) === 'Sem Problema'),
    [activeItems],
  )

  const closedProjectsItems = useMemo(
    () => (closedFeaturesWiqlData?.items ?? []) as Feature[],
    [closedFeaturesWiqlData?.items],
  )

  const nearDeadlineProjects = useMemo(() => {
    if (!hasFilters && nearDeadlineWiqlData?.items) return nearDeadlineWiqlData.items as Feature[]
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const seven = new Date(today)
    seven.setDate(today.getDate() + 7)
    return activeItems.filter((i) => {
      const td = getTargetDate(i)
      if (!td) return false
      const t = new Date(td)
      t.setHours(0, 0, 0, 0)
      return t >= today && t <= seven
    })
  }, [activeItems, hasFilters, nearDeadlineWiqlData])

  const allItemsForPMOCount = useMemo(() => {
    if (consolidatedAzdoData?.lists?.open_projects) {
      const openProjects = consolidatedAzdoData.lists.open_projects as Feature[]
      if (hasFilters) {
        let items = openProjects
        if (selectedFarol) items = items.filter((i) => normalizeFarolStatus(i.farol_status) === selectedFarol)
        if (selectedClient) {
          const key = normalizeClientKey(selectedClient)
          items = items.filter((i) => normalizeClientKey(i.client) === key)
        }
        if (selectedState) items = items.filter((i) => normalizarStatus(i.state || '') === selectedState)
        if (selectedPMO) items = items.filter((i) => extractPMO(i) === selectedPMO)
        if (selectedResponsavel) items = items.filter((i) => extractResponsavelCliente(i) === selectedResponsavel)
        return items
      }
      return openProjects
    }
    return filteredItems
  }, [consolidatedAzdoData, filteredItems, hasFilters, selectedFarol, selectedClient, selectedState, selectedPMO, selectedResponsavel])

  const pmoCounts = useMemo(() => {
    const counts = allItemsForPMOCount.reduce((acc: Record<string, number>, item) => {
      const pmo = extractPMO(item)
      const name = pmo?.trim() || 'Não atribuído'
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name?.trim() || 'Não atribuído', value }))
      .filter(({ name }) => name?.trim())
      .sort((a, b) => b.value - a.value)
  }, [allItemsForPMOCount])

  const responsibleCounts = useMemo(() => {
    const counts = activeItems.reduce((acc: Record<string, number>, item) => {
      const r = extractResponsavelCliente(item)
      const name = r?.trim() || 'Não atribuído'
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name?.trim() || 'Não atribuído', value }))
      .filter(({ name }) => name?.trim())
      .sort((a, b) => b.value - a.value)
  }, [activeItems])

  const monthlyProjectData = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth - 1, 1)
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
    const startMs = start.getTime()
    const endMs = end.getTime()
    const isInMonth = (dateStr?: string) => {
      if (!dateStr) return false
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return false
      const ms = d.getTime()
      return ms >= startMs && ms <= endMs
    }
    const projectsOpenedItems: Feature[] = []
    const projectsClosedItems: Feature[] = []
    for (const item of filteredItems) {
      if (isInMonth(item.created_date)) projectsOpenedItems.push(item)
      const state = normalizarStatus(item.state || '')
      if ((state === 'Encerrado' || state === 'Closed') && isInMonth(item.changed_date)) {
        projectsClosedItems.push(item)
      }
    }
    return { projectsOpened: projectsOpenedItems.length, projectsClosed: projectsClosedItems.length, projectsOpenedItems, projectsClosedItems }
  }, [filteredItems, selectedMonth, selectedYear])

  const performanceKpis = useMemo(() => {
    const total = totalProjects || 1
    const closed = closedFeaturesWiqlData?.count ?? 0
    const open = openCount
    const overdue = !hasFilters ? (countsWiqlData?.overdue ?? 0) : overdueProjects.length
    const semProblema = (farolSummary as Record<string, { count?: number }>)?.['Sem Problema']?.count ?? 0
    const ativosCount = activeItems.length || 1
    return {
      taxaConclusao: total > 0 ? Math.round((closed / total) * 1000) / 10 : 0,
      taxaAtraso: open > 0 ? Math.round((overdue / open) * 1000) / 10 : 0,
      saudeFarol: ativosCount > 0 ? Math.round((semProblema / ativosCount) * 1000) / 10 : 0,
      noPrazo: open > 0 ? Math.round(((open - overdue) / open) * 1000) / 10 : 0,
    }
  }, [totalProjects, closedFeaturesWiqlData?.count, openCount, hasFilters, countsWiqlData?.overdue, overdueProjects.length, farolSummary, activeItems.length])

  const pmoPerformanceData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const byPmo: Record<string, { closed: number; onTime: number; overdue: number; items: { closed: Feature[]; onTime: Feature[]; overdue: Feature[] } }> = {}
    for (const item of filteredItems) {
      const pmo = extractPMO(item)
      const name = pmo?.trim() || 'Não atribuído'
      if (!byPmo[name]) byPmo[name] = { closed: 0, onTime: 0, overdue: 0, items: { closed: [], onTime: [], overdue: [] } }
      const state = normalizarStatus(item.state || '')
      const isClosed = state === 'Encerrado' || state === 'Closed'
      if (isClosed) {
        byPmo[name].closed++
        byPmo[name].items.closed.push(item)
      } else {
        const td = getTargetDate(item)
        if (td) {
          const target = new Date(td)
          target.setHours(0, 0, 0, 0)
          if (target < today) {
            byPmo[name].overdue++
            byPmo[name].items.overdue.push(item)
          } else {
            byPmo[name].onTime++
            byPmo[name].items.onTime.push(item)
          }
        } else {
          byPmo[name].onTime++
          byPmo[name].items.onTime.push(item)
        }
      }
    }
    return Object.entries(byPmo)
      .map(([name, data]) => ({
        name,
        closed: data.closed,
        onTime: data.onTime,
        overdue: data.overdue,
        total: data.closed + data.onTime + data.overdue,
        items: data.items,
      }))
      .filter((p) => p.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [filteredItems])

  const closedByMonth = useMemo(() => {
    const closedItems = (closedFeaturesWiqlData?.items || featuresData?.items || []).filter((item: { state?: string }) => {
      const state = normalizarStatus(item.state || '')
      return state === 'Encerrado' || item.state === 'Closed'
    }) as Feature[]
    const n = evolucaoEntregasMeses
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - n)
    cutoff.setDate(1)
    cutoff.setHours(0, 0, 0, 0)
    const byMonthItems: Record<string, Feature[]> = {}
    for (const item of closedItems) {
      if (!item.changed_date) continue
      const changed = new Date(item.changed_date)
      if (Number.isNaN(changed.getTime()) || changed < cutoff) continue
      const key = format(changed, 'yyyy-MM')
      if (!byMonthItems[key]) byMonthItems[key] = []
      byMonthItems[key].push(item)
    }
    const months: { monthKey: string; label: string; closed: number; items: Feature[] }[] = []
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = format(d, 'yyyy-MM')
      months.push({
        monthKey: key,
        label: format(d, 'MMM/yy', { locale: ptBR }),
        closed: (byMonthItems[key] || []).length,
        items: byMonthItems[key] || [],
      })
    }
    return months
  }, [closedFeaturesWiqlData, featuresData, evolucaoEntregasMeses])

  const farolPieData = useMemo(() => {
    const order: FarolStatus[] = ['Sem Problema', 'Com Problema', 'Problema Crítico', 'Indefinido']
    return order
      .map((status) => {
        const data = (farolSummary as Record<string, { count?: number; percentage?: number }>)?.[status]
        return { name: status, value: data?.count ?? 0, percentage: data?.percentage ?? 0 }
      })
      .filter((d) => d.value > 0)
  }, [farolSummary])

  const taskPerformanceKpis = useMemo(() => {
    const total = tasksSummaryData?.total ?? 0
    const overdue = tasksSummaryData?.overdue_count ?? 0
    const taxaAtraso = total > 0 ? Math.round((overdue / total) * 1000) / 10 : 0
    const noPrazo = total > 0 ? Math.round(((total - overdue) / total) * 1000) / 10 : 0
    const byState = tasksSummaryData?.by_state ?? {}
    const closedStates = ['Closed', 'Done', 'Resolved', 'Removed']
    const closed = Object.entries(byState)
      .filter(([state]) => closedStates.includes(state))
      .reduce((sum, [, count]) => sum + count, 0)
    const totalGeral = total + closed
    const taxaConclusao = totalGeral > 0 ? Math.round((closed / totalGeral) * 1000) / 10 : 0
    const emAndamento = totalGeral > 0 ? Math.round((total / totalGeral) * 1000) / 10 : 0
    return { total, overdue, taxaConclusao, taxaAtraso, noPrazo, emAndamento }
  }, [tasksSummaryData])

  const tasksClosedByMonth = useMemo(() => {
    return lastNMonthsForTasks.map(({ month, year }, idx) => {
      const res = tasksByMonthQueries[idx]?.data
      const d = new Date(year, month - 1, 1)
      const items = (res?.tasks_closed_items || []) as Feature[]
      return {
        monthKey: format(d, 'yyyy-MM'),
        label: format(d, 'MMM/yy', { locale: ptBR }),
        closed: res?.tasks_closed ?? 0,
        items,
      }
    })
  }, [lastNMonthsForTasks, tasksByMonthQueries])

  const closedByDay = useMemo(() => {
    const closedItems = (closedFeaturesWiqlData?.items || featuresData?.items || []).filter((item: { state?: string }) => {
      const state = normalizarStatus(item.state || '')
      return state === 'Encerrado' || item.state === 'Closed'
    })
    const cutoff = subDays(new Date(), closedByDayDias - 1)
    cutoff.setHours(0, 0, 0, 0)
    const byDay = closedItems.reduce((acc: Record<string, number>, item: { changed_date?: string }) => {
      if (!item.changed_date) return acc
      const changed = new Date(item.changed_date)
      if (Number.isNaN(changed.getTime()) || changed < cutoff) return acc
      const date = format(changed, 'yyyy-MM-dd')
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})
    return Object.entries(byDay)
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([iso, count]) => ({
        isoDate: iso,
        date: format(new Date(iso), 'dd/MM', { locale: ptBR }),
        closed: Number(count),
      }))
  }, [closedFeaturesWiqlData, featuresData, closedByDayDias])

  return {
    // Loading / Error
    featuresLoading,
    consolidatedLoading,
    consolidatedAzdoData,
    consolidatedError,
    baseItems,

    // Filtros
    selectedFarol,
    setSelectedFarol,
    selectedClient,
    setSelectedClient,
    selectedState,
    setSelectedState,
    selectedPMO,
    setSelectedPMO,
    selectedResponsavel,
    setSelectedResponsavel,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    hasFilters,
    clearFilters,

    // Modais
    drillDownModal,
    setDrillDownModal,
    clientsModal,
    setClientsModal,
    pmosModal,
    setPMOsModal,
    openDrillDown,

    // Estados de gráficos
    evolucaoEntregasMeses,
    setEvolucaoEntregasMeses,
    evolucaoTasksMeses,
    setEvolucaoTasksMeses,
    closedByDayDias,
    setClosedByDayDias,
    responsaveisListExpanded,
    setResponsaveisListExpanded,

    // Dados consolidados
    countsWiqlData,
    openFeaturesWiqlData,
    closedFeaturesWiqlData,
    nearDeadlineWiqlData,
    filteredItems,
    activeItems,

    // Métricas
    totalProjects,
    openCount,
    overdueProjects,
    nearDeadlineProjects,
    farolSummary,
    farolSummaryDisplay,
    statusCardsData,
    statusPieData,
    uniqueClients,
    clientsForFilter,
    uniqueStates,
    uniquePMOs,
    uniqueResponsibles,
    pmoCounts,
    responsibleCounts,
    monthlyProjectData,
    performanceKpis,
    pmoPerformanceData,
    closedByMonth,
    farolPieData,
    taskPerformanceKpis,
    tasksClosedByMonth,
    closedByDay,
    closedProjectsItems,
    onTimeProjects,
    semProblemaProjects,
    countsByMonthData,
    tasksSummaryData,
    tasksOpenData,
    tasksClosedData,

    // Constantes
    MONTHS_PT,
    yearOptions,
  }
}
