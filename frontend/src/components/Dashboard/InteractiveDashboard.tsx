import { useMemo, useState, useCallback, useEffect } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { azdoApi, featuresApi, featuresCountApi, workItemsApi, Feature } from '../../services/api'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { format, subDays, parseISO, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import TrafficLight from '../Farol/TrafficLight'
import FarolTooltip from '../Farol/FarolTooltip'
import StatusCardsGrid from '../Status/StatusCardsGrid'
import DrillDownModal from '../Modal/DrillDownModal'
import ClientsModal from '../Modal/ClientsModal'
import PMOsModal from '../Modal/PMOsModal'
import CustomTooltip from './CustomTooltip'
import { FarolStatus, getFarolStatusSummary, normalizeFarolStatus } from '../../utils/farol'
import { normalizarStatus } from '../../utils/statusNormalization'
import {
  normalizeClientKey,
  extractPMO,
  extractResponsavelCliente,
  getTargetDate,
} from '../../utils/featureExtractors'
import DashboardHeader from './sections/DashboardHeader'
import DashboardFiltersSection from './sections/DashboardFiltersSection'
import DashboardSkeleton from './DashboardSkeleton'
import ChartWithActions from './ChartWithActions'
import ChartGalleryOverlay from './ChartGalleryOverlay'
import ScrollToTop from '../ScrollToTop/ScrollToTop'
import KpiCounter from '../KpiCounter/KpiCounter'
import { useDashboardFiltersPersistence } from '../../hooks/useDashboardFiltersPersistence'
import { useToast } from '../Toast/Toast'
import { useFarolNavbar } from '../../contexts/FarolNavbarContext'

// Cores para gráficos
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
}

// Formatar valores grandes no eixo (ex: 1500 -> 1.5k)
const formatAxisValue = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))

const FAROL_COLORS: Record<FarolStatus, string> = {
  'Sem Problema': COLORS.success,
  'Com Problema': COLORS.warning,
  'Problema Crítico': COLORS.danger,
  'Indefinido': '#6b7280',
}

// Status que devem ser excluídos (após normalização)
// "Ativos" no dashboard = tudo exceto Closed/Encerrado (Em Garantia continua sendo ativo)
const EXCLUDED_STATES = ['Encerrado']
// Status que não devem aparecer nos cards (mas podem existir nos dados)
const HIDDEN_CARD_STATES = ['Active', 'Sem Estado', 'Removed']
// Ordem específica de status conforme solicitado
const STATUS_ORDER = [
  'Em Aberto',
  'Em Planejamento',
  'Em Andamento',
  'Projeto em Fase Crítica',
  'Homologação Interna',
  'Em Homologação',
  'Em Fase de Encerramento',
  'Em Garantia',
  'Pausado Pelo Cliente',
  'Encerrado',
]

export default function InteractiveDashboard() {
  const [selectedFarol, setSelectedFarol] = useState<FarolStatus | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedPMO, setSelectedPMO] = useState<string | null>(null)
  const [selectedResponsavel, setSelectedResponsavel] = useState<string | null>(null)

  const nowForRange = new Date()
  const firstOfMonthRange = new Date(nowForRange.getFullYear(), nowForRange.getMonth(), 1)
  const lastOfMonthRange = new Date(nowForRange.getFullYear(), nowForRange.getMonth() + 1, 0)
  const [dateRangeDe, setDateRangeDe] = useState(format(firstOfMonthRange, 'yyyy-MM-dd'))
  const [dateRangeAte, setDateRangeAte] = useState(format(lastOfMonthRange, 'yyyy-MM-dd'))

  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean
    title: string
    items: Feature[]
    filterLabel: string
  }>({
    isOpen: false,
    title: '',
    items: [],
    filterLabel: '',
  })

  const [clientsModal, setClientsModal] = useState<{ isOpen: boolean }>({ isOpen: false })
  const [pmosModal, setPMOsModal] = useState<{ isOpen: boolean }>({ isOpen: false })
  const [evolucaoEntregasMeses, setEvolucaoEntregasMeses] = useState(6)
  const [evolucaoTasksMeses, setEvolucaoTasksMeses] = useState(6)
  const [closedByDayDateDe, setClosedByDayDateDe] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'))
  const [closedByDayDateAte, setClosedByDayDateAte] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [responsaveisListExpanded, setResponsaveisListExpanded] = useState(false)
  const [fullscreenChartIndex, setFullscreenChartIndex] = useState<number | null>(null)
  const { showToast } = useToast()
  const { setFarolStatus } = useFarolNavbar()

  // Persistir filtros em sessionStorage
  useDashboardFiltersPersistence(
    {
      selectedFarol,
      selectedClient,
      selectedState,
      selectedPMO,
      selectedResponsavel,
      dateRangeDe,
      dateRangeAte,
    },
    {
      setSelectedFarol: (v) => setSelectedFarol(v as FarolStatus | null),
      setSelectedClient,
      setSelectedState,
      setSelectedPMO,
      setSelectedResponsavel,
      setDateRangeDe,
      setDateRangeAte,
    }
  )

  const derivedMonthYear = useMemo(() => {
    const d = parseISO(dateRangeDe)
    return { month: d.getMonth() + 1, year: d.getFullYear() }
  }, [dateRangeDe])

  // Fonte “DB” (pode falhar — não pode derrubar o dashboard)
  const { data: featuresData, isLoading: featuresLoading } = useQuery({
    queryKey: ['features', 'all'],
    queryFn: () => featuresApi.list({ limit: 1000 }),
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const { data: countsByMonthData } = useQuery({
    queryKey: ['azdo', 'counts-by-month', derivedMonthYear.month, derivedMonthYear.year, true],
    queryFn: () => azdoApi.getCountsByMonth(derivedMonthYear.month, derivedMonthYear.year, true),
    staleTime: 60_000,
  })

  const { data: tasksSummaryData } = useQuery({
    queryKey: ['work-items', 'tasks-summary'],
    queryFn: () => workItemsApi.getTasksSummary(),
    staleTime: 300_000,
    gcTime: 600_000,
    refetchOnWindowFocus: false,
  })

  // Tasks abertas - mesma query que Task's Ativas para compartilhar cache; usado nos modais
  const { data: tasksOpenData } = useQuery({
    queryKey: ['tasks', 'open'],
    queryFn: () => featuresCountApi.getTasksOpenWiql(),
    staleTime: 300_000, // 5 min - carregamento quase instantâneo ao reusar cache
    gcTime: 600_000,
    refetchOnWindowFocus: false,
  })

  // Tasks fechadas - para modal do KPI Task's Fechadas
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

  // Clientes (via consolidado) — evita divergência com lista parcial
  const validClientsLoading = false

  // Consolidado (1 chamada) — reduz loading e garante padrão WIQL -> hidratação no backend
  // Estratégia: sempre buscar dados frescos na primeira carga, não usar dados antigos do cache
  const {
    data: consolidatedAzdoData,
    isLoading: consolidatedLoading,
    error: consolidatedError,
    dataUpdatedAt: consolidatedUpdatedAt,
  } = useQuery({
    queryKey: ['azdo', 'consolidated', 7],
    queryFn: () => azdoApi.getConsolidated({ days_near_deadline: 7, cache_seconds: 10 }), // Cache backend reduzido para 10s
    retry: 2,
    refetchOnMount: 'always', // Sempre buscar dados frescos ao montar o componente
    refetchOnWindowFocus: true, // Refazer busca ao focar janela (garante dados atualizados)
    staleTime: 0, // Dados sempre considerados stale - força busca fresca na primeira carga
    gcTime: 30_000, // Mantém no cache por 30s apenas (para navegação rápida)
    // placeholderData removido: não usar dados antigos na primeira carga
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

  // Fonte base do dashboard: preferir consolidado (WIQL->hidratação), fallback para DB (legado)
  // Total de Projetos = Closed (316) + Em Aberto (147) = 463
  const baseItems = useMemo<Feature[]>(() => {
    const openItems = (openFeaturesWiqlData?.items ?? []) as Feature[]
    const closedItems = (closedFeaturesWiqlData?.items ?? []) as Feature[]
    // Combinar features abertas + fechadas para o Total de Projetos
    const combinedItems = [...openItems, ...closedItems]
    // Se não temos dados consolidados, usar fallback
    if (combinedItems.length === 0) {
      return (featuresData?.items ?? []) as Feature[]
    }
    return combinedItems
  }, [featuresData, openFeaturesWiqlData, closedFeaturesWiqlData])

  // Filtrar por seleções (helpers em utils/featureExtractors)
  const filteredItems = useMemo(() => {
    let items = baseItems

    if (selectedFarol) {
      items = items.filter((item) => normalizeFarolStatus(item.farol_status) === selectedFarol)
    }
    if (selectedClient) {
      const key = normalizeClientKey(selectedClient)
      items = items.filter((item) => normalizeClientKey(item.client) === key)
    }
    if (selectedState) {
      items = items.filter((item) => normalizarStatus(item.state || '') === selectedState)
    }
    if (selectedPMO) {
      items = items.filter((item) => extractPMO(item) === selectedPMO)
    }
    if (selectedResponsavel) {
      items = items.filter((item) => extractResponsavelCliente(item) === selectedResponsavel)
    }
    return items
  }, [baseItems, selectedFarol, selectedClient, selectedState, selectedPMO, selectedResponsavel])

  // Itens ativos (exclui apenas Encerrado/Closed)
  const activeItems = useMemo(() => {
    return filteredItems.filter((item) => {
      const state = normalizarStatus(item.state || '')
      return !EXCLUDED_STATES.includes(state)
    })
  }, [filteredItems])

  const hasFilters = !!(selectedFarol || selectedClient || selectedState || selectedPMO || selectedResponsavel)

  // Cards principais
  // Total de Projetos = Closed (316) + Em Aberto (147) = 463
  const totalProjects = useMemo(() => {
    if (!hasFilters && countsWiqlData?.total !== undefined) {
      // Se temos dados consolidados, verificar se o total inclui closed + open
      const openCount = countsWiqlData.open ?? 0
      const closedCount = closedFeaturesWiqlData?.count ?? 0
      const expectedTotal = openCount + closedCount
      // Usar o total consolidado se disponível, senão calcular
      return countsWiqlData.total >= expectedTotal ? countsWiqlData.total : expectedTotal
    }
    // Com filtros ou sem dados consolidados, usar filteredItems (que já inclui closed + open)
    return filteredItems.length
  }, [countsWiqlData, closedFeaturesWiqlData, filteredItems.length, hasFilters])

  const openCount = useMemo(() => {
    // Quando há filtros, sempre usar filteredItems (já filtrado por cliente, estado, etc.)
    if (hasFilters) {
      return filteredItems.filter((item) => {
        const state = normalizarStatus(item.state || '')
        return state !== 'Encerrado' && state !== 'Closed'
      }).length
    }
    // Sem filtros, usar dados consolidados do backend quando disponível
    if (countsWiqlData?.open !== undefined) return countsWiqlData.open
    // Fallback: calcular a partir de filteredItems
    return filteredItems.filter((item) => {
      const state = normalizarStatus(item.state || '')
      return state !== 'Encerrado' && state !== 'Closed'
    }).length
  }, [countsWiqlData, filteredItems, hasFilters])

  // Backlog New (apenas Feature com state New)
  const backlogNewCount = useMemo(() => {
    return activeItems.filter((item) => {
      if (item.work_item_type && item.work_item_type.toLowerCase() !== 'feature') return false
      const state = normalizarStatus(item.state || '')
      return state === 'New'
    }).length
  }, [activeItems, hasFilters, nearDeadlineWiqlData])

  // Resumo Farol
  const farolSummary = useMemo(() => getFarolStatusSummary(activeItems), [activeItems])
  const farolSummaryDisplay = useMemo(() => {
    const { Indefinido: _ignored, ...rest } = (farolSummary as any) || {}
    return rest
  }, [farolSummary])

  // Atualiza farol da navbar quando no dashboard (pior status prevalece)
  useEffect(() => {
    const s = farolSummary as Record<FarolStatus, { count: number }> | undefined
    if (!s) {
      setFarolStatus(null)
      return
    }
    if ((s['Problema Crítico']?.count ?? 0) > 0) setFarolStatus('Problema Crítico')
    else if ((s['Com Problema']?.count ?? 0) > 0) setFarolStatus('Com Problema')
    else if ((s['Sem Problema']?.count ?? 0) > 0) setFarolStatus('Sem Problema')
    else setFarolStatus(null)
  }, [farolSummary, setFarolStatus])

  // Cards por status (ordenado)
  // Preferir o consolidado (fonte canônica WIQL -> hidratação), e só cair para cálculo local quando filtrado.
  const statusCardsData = useMemo(() => {
    // Quando sem filtros, usar o backend consolidado para refletir o DevOps.
    if (!hasFilters && consolidatedAzdoData?.features_by_status) {
      const normalizedCounts: Record<string, number> = {}
      Object.entries(consolidatedAzdoData.features_by_status as any).forEach(([rawStatus, payload]) => {
        const count = (payload as any)?.count ?? 0
        const normalized = normalizarStatus(rawStatus)
        if (!HIDDEN_CARD_STATES.includes(normalized)) {
          normalizedCounts[normalized] = (normalizedCounts[normalized] || 0) + count
        }
      })

      return STATUS_ORDER.map((name) => ({ status: name, count: normalizedCounts[name] || 0 }))
        .filter(({ status, count }) => count > 0 && !EXCLUDED_STATES.includes(status) && !HIDDEN_CARD_STATES.includes(status))
    }

    // Com filtros, usa cálculo local sobre os itens filtrados.
    const activeStateCounts = activeItems.reduce((acc: Record<string, number>, item) => {
      if (item.work_item_type && item.work_item_type.toLowerCase() !== 'feature') return acc
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

  // Pizza por STATUS (ativos): substitui "Distribuição por Farol"
  const statusPieData = useMemo(() => {
    const counts = activeItems.reduce((acc: Record<string, number>, item) => {
      if (item.work_item_type && item.work_item_type.toLowerCase() !== 'feature') return acc
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

  const STATUS_PIE_COLORS: Record<string, string> = {
    'Em Andamento': COLORS.primary,
    'Em Planejamento': COLORS.indigo,
    'Projeto em Fase Crítica': COLORS.danger,
    'Homologação Interna': COLORS.purple,
    'Em Homologação': COLORS.warning,
    'Em Fase de Encerramento': '#6b7280',
    'Pausado Pelo Cliente': COLORS.success,
    Novo: '#0ea5e9',
  }

  // Clientes (Epics) — para card/modal
  const uniqueClients = useMemo(() => {
    const summary = consolidatedAzdoData?.clients?.summary
    if (Array.isArray(summary) && summary.length > 0) return summary.map((c: any) => c.name).sort()
    return []
  }, [consolidatedAzdoData])

  // Separar clientes ativos e encerrados para o filtro (usando a base disponível)
  const clientsForFilter = useMemo(() => {
    const summary = consolidatedAzdoData?.clients?.summary
    if (Array.isArray(summary) && summary.length > 0) {
      const active = summary.filter((c: any) => (c.active || 0) > 0).map((c: any) => c.name)
      const closed = summary.filter((c: any) => (c.active || 0) === 0 && (c.total || 0) > 0).map((c: any) => c.name)
      return { active: active.sort(), closed: closed.sort() }
    }
    return { active: [], closed: [] }
  }, [consolidatedAzdoData])

  const uniqueStates = useMemo(() => {
    const states = new Set(
      filteredItems
        .map((item) => normalizarStatus(item.state || ''))
        .filter((s) => !EXCLUDED_STATES.includes(s) && !HIDDEN_CARD_STATES.includes(s)),
    )
    return Array.from(states).sort()
  }, [filteredItems])

  // Mantido por compatibilidade (dropdown de filtro). A lista completa/contagem usa pmoCounts.
  // IMPORTANTE: Usar extractPMO para incluir PMOs de AssignedTo, não apenas do campo pmo
  const uniquePMOs = useMemo(() => {
    const pmos = new Set(filteredItems.map((item) => extractPMO(item)).filter(Boolean))
    return Array.from(pmos).sort()
  }, [filteredItems])

  const uniqueResponsibles = useMemo(() => {
    const responsibles = new Set(
      baseItems.map((item) => extractResponsavelCliente(item)).filter((r) => r && r !== 'Não atribuído'),
    )
    return Array.from(responsibles).sort()
  }, [baseItems])

  // Projetos atrasados: TargetDate < hoje
  const overdueProjects = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return activeItems.filter((item) => {
      const td = getTargetDate(item)
      if (!td) return false
      const t = new Date(td)
      t.setHours(0, 0, 0, 0)
      return t < today
    })
  }, [activeItems])

  // Projetos em dia (abertos, não atrasados)
  const onTimeProjects = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return activeItems.filter((item) => {
      const td = getTargetDate(item)
      if (!td) return true
      const t = new Date(td)
      t.setHours(0, 0, 0, 0)
      return t >= today
    })
  }, [activeItems])

  // Projetos com farol Sem Problema
  const semProblemaProjects = useMemo(
    () => activeItems.filter((item) => normalizeFarolStatus(item.farol_status) === 'Sem Problema'),
    [activeItems]
  )

  // Projetos encerrados (para modal)
  const closedProjectsItems = useMemo(
    () => (closedFeaturesWiqlData?.items ?? []) as Feature[],
    [closedFeaturesWiqlData?.items]
  )

  // Próximos do prazo: 0..7 dias (inclusive)
  const nearDeadlineProjects = useMemo(() => {
    // Fonte de verdade quando sem filtros: WIQL já retorna a lista correta
    if (!hasFilters && nearDeadlineWiqlData?.items) {
      return nearDeadlineWiqlData.items as Feature[]
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const seven = new Date(today)
    seven.setDate(today.getDate() + 7)
    return activeItems.filter((item) => {
      const td = getTargetDate(item)
      if (!td) return false
      const t = new Date(td)
      t.setHours(0, 0, 0, 0)
      return t >= today && t <= seven
    })
  }, [activeItems])

  // Contagens para gráficos (PMO / Responsável)
  // IMPORTANTE: PMOs devem ser calculados apenas com projetos ABERTOS (não fechados)
  // Usar open_projects da API consolidada para obter apenas projetos abertos
  const allItemsForPMOCount = useMemo(() => {
    // Se temos dados consolidados, usar apenas projetos abertos (não incluir encerrados)
    if (consolidatedAzdoData?.lists?.open_projects) {
      const openProjects = consolidatedAzdoData.lists.open_projects as Feature[]
      // Se há filtros, aplicar aos projetos abertos, senão usar todos os abertos
      if (hasFilters) {
        let items = openProjects
        if (selectedFarol) {
          items = items.filter((item) => normalizeFarolStatus(item.farol_status) === selectedFarol)
        }
        if (selectedClient) {
          const key = normalizeClientKey(selectedClient)
          items = items.filter((item) => normalizeClientKey(item.client) === key)
        }
        if (selectedState) {
          items = items.filter((item) => normalizarStatus(item.state || '') === selectedState)
        }
        if (selectedPMO) {
          items = items.filter((item) => extractPMO(item) === selectedPMO)
        }
        if (selectedResponsavel) {
          items = items.filter((item) => extractResponsavelCliente(item) === selectedResponsavel)
        }
        return items
      }
      return openProjects
    }
    // Fallback: usar filteredItems (que já são apenas projetos abertos)
    return filteredItems
  }, [consolidatedAzdoData, filteredItems, hasFilters, selectedFarol, selectedClient, selectedState, selectedPMO, selectedResponsavel])

  const pmoCounts = useMemo(() => {
    const counts = allItemsForPMOCount.reduce((acc: Record<string, number>, item) => {
      const pmo = extractPMO(item)
      const name = pmo && pmo.trim() !== '' ? pmo.trim() : 'Não atribuído'
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name && name.trim() !== '' ? name.trim() : 'Não atribuído', value }))
      .filter(({ name }) => name && name.trim() !== '')
      .sort((a, b) => b.value - a.value)
  }, [allItemsForPMOCount])

  // Contagem por responsável: apenas projetos ABERTOS (ativo = não encerrado)
  // Deve ser consistente com o modal que exibe activeItems ao clicar
  const responsibleCounts = useMemo(() => {
    const counts = activeItems.reduce((acc: Record<string, number>, item) => {
      const responsible = extractResponsavelCliente(item)
      const name = responsible && responsible.trim() !== '' ? responsible.trim() : 'Não atribuído'
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name && name.trim() !== '' ? name.trim() : 'Não atribuído', value }))
      .filter(({ name }) => name && name.trim() !== '')
      .sort((a, b) => b.value - a.value)
  }, [activeItems])

  // Contagens e itens por período (projetos abertos/fechados no período selecionado)
  const monthlyProjectData = useMemo(() => {
    const start = startOfDay(parseISO(dateRangeDe))
    const end = endOfDay(parseISO(dateRangeAte))
    const startMs = start.getTime()
    const endMs = end.getTime()

    const isInPeriod = (dateStr: string | undefined) => {
      if (!dateStr) return false
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return false
      const ms = d.getTime()
      return ms >= startMs && ms <= endMs
    }

    const projectsOpenedItems: Feature[] = []
    const projectsClosedItems: Feature[] = []

    for (const item of filteredItems) {
      if (isInPeriod(item.created_date)) projectsOpenedItems.push(item)
      const state = normalizarStatus(item.state || '')
      if ((state === 'Encerrado' || state === 'Closed') && isInPeriod(item.changed_date)) {
        projectsClosedItems.push(item)
      }
    }
    return {
      projectsOpened: projectsOpenedItems.length,
      projectsClosed: projectsClosedItems.length,
      projectsOpenedItems,
      projectsClosedItems,
    }
  }, [filteredItems, dateRangeDe, dateRangeAte])

  // KPIs de Performance
  const performanceKpis = useMemo(() => {
    const total = totalProjects || 1
    const closed = closedFeaturesWiqlData?.count ?? 0
    const open = openCount
    const overdue = !hasFilters ? (countsWiqlData?.overdue ?? 0) : overdueProjects.length
    const semProblema = (farolSummary as any)?.['Sem Problema']?.count ?? 0
    const ativosCount = activeItems.length || 1

    const taxaConclusao = total > 0 ? Math.round((closed / total) * 1000) / 10 : 0
    const taxaAtraso = open > 0 ? Math.round((overdue / open) * 1000) / 10 : 0
    const saudeFarol = ativosCount > 0 ? Math.round((semProblema / ativosCount) * 1000) / 10 : 0
    const noPrazo = open > 0 ? Math.round(((open - overdue) / open) * 1000) / 10 : 0

    return { taxaConclusao, taxaAtraso, saudeFarol, noPrazo }
  }, [
    totalProjects,
    closedFeaturesWiqlData?.count,
    openCount,
    hasFilters,
    countsWiqlData?.overdue,
    overdueProjects.length,
    farolSummary,
    activeItems.length,
  ])

  // Performance por PMO (stacked: Concluídos | Em Dia | Atrasados)
  const pmoPerformanceData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const byPmo: Record<
      string,
      { closed: number; onTime: number; overdue: number; items: { closed: Feature[]; onTime: Feature[]; overdue: Feature[] } }
    > = {}

    for (const item of filteredItems) {
      const pmo = extractPMO(item)
      const name = pmo?.trim() || 'Não atribuído'
      if (!byPmo[name]) {
        byPmo[name] = { closed: 0, onTime: 0, overdue: 0, items: { closed: [], onTime: [], overdue: [] } }
      }

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

  // Evolução de entregas (últimos N meses)
  const closedByMonth = useMemo(() => {
    const closedItems = (closedFeaturesWiqlData?.items || featuresData?.items || []).filter((item: any) => {
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
      if (Number.isNaN(changed.getTime())) continue
      if (changed < cutoff) continue
      const key = format(changed, 'yyyy-MM')
      if (!byMonthItems[key]) byMonthItems[key] = []
      byMonthItems[key].push(item)
    }

    const months: { monthKey: string; label: string; closed: number; items: Feature[] }[] = []
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = format(d, 'yyyy-MM')
      const items = byMonthItems[key] || []
      months.push({
        monthKey: key,
        label: format(d, 'MMM/yy', { locale: ptBR }),
        closed: items.length,
        items,
      })
    }
    return months
  }, [closedFeaturesWiqlData, featuresData, evolucaoEntregasMeses])

  // Dados para gráfico Saúde do Farol (pie)
  const farolPieData = useMemo(() => {
    const order: FarolStatus[] = ['Sem Problema', 'Com Problema', 'Problema Crítico', 'Indefinido']
    return order
      .map((status) => {
        const data = (farolSummary as any)?.[status]
        const count = data?.count ?? 0
        const pct = data?.percentage ?? 0
        return { name: status, value: count, percentage: pct }
      })
      .filter((d) => d.value > 0)
  }, [farolSummary])

  // KPIs de Tasks - todos em percentual
  const taskPerformanceKpis = useMemo(() => {
    const total = tasksSummaryData?.total ?? 0 // Backend retorna só New+Active
    const overdue = tasksSummaryData?.overdue_count ?? 0 // New+Active com prazo vencido
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

  // Evolução de tasks fechadas (N meses)
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

  // Fechadas por dia (período selecionado): prefere WIQL closed; fallback DB.
  const closedByDay = useMemo(() => {
    const closedItems = (closedFeaturesWiqlData?.items || featuresData?.items || []).filter((item: any) => {
      const state = normalizarStatus(item.state || '')
      return state === 'Encerrado' || item.state === 'Closed'
    })
    const start = startOfDay(parseISO(closedByDayDateDe))
    const end = endOfDay(parseISO(closedByDayDateAte))

    const byDay = closedItems.reduce((acc: Record<string, number>, item: any) => {
      if (!item.changed_date) return acc
      const changed = new Date(item.changed_date)
      if (Number.isNaN(changed.getTime())) return acc
      if (changed < start || changed > end) return acc
      const date = format(changed, 'yyyy-MM-dd')
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    return Object.entries(byDay as Record<string, number>)
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([iso, count]) => ({
        isoDate: iso,
        date: format(new Date(iso), 'dd/MM', { locale: ptBR }),
        closed: Number(count),
      }))
  }, [closedFeaturesWiqlData, featuresData, closedByDayDateDe, closedByDayDateAte])

  const handleClosedDayClick = (isoDate: string) => {
    const items = (closedFeaturesWiqlData?.items || featuresData?.items || []) as Feature[]
    const filtered = items.filter((it: any) => {
      if (!it?.changed_date) return false
      const d = format(new Date(it.changed_date), 'yyyy-MM-dd')
      return d === isoDate
    })
    if (filtered.length > 0) {
      openDrillDown(`Features fechadas em ${isoDate}`, filtered as Feature[], `Fechadas em: ${isoDate}`)
    }
  }

  const ClosedDot = (props: any) => {
    const { cx, cy, payload } = props || {}
    const iso = payload?.isoDate
    if (!cx || !cy) return null
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (iso) handleClosedDayClick(iso)
    }
    return (
      <g onClick={handleClick} style={{ cursor: 'pointer' }}>
        {/* Área de clique ampliada (invisível) - cobre toda a bolinha e entorno */}
        <circle cx={cx} cy={cy} r={20} fill="transparent" />
        {/* Bolinha visível */}
        <circle cx={cx} cy={cy} r={8} fill={COLORS.primary} stroke="#fff" strokeWidth={2} pointerEvents="none" />
      </g>
    )
  }

  const openDrillDown = useCallback((title: string, items: Feature[], filterLabel: string) => {
    setDrillDownModal({ isOpen: true, title, items, filterLabel })
  }, [])

  // Slots para galeria fullscreen (navegação entre gráficos)
  const chartSlots = useMemo(
    () => [
      {
        id: 'pmo-perf',
        title: 'Performance por PMO',
        content: (
          <ResponsiveContainer width="100%" height={Math.min(400, Math.max(250, pmoPerformanceData.length * 36))}>
            <BarChart data={pmoPerformanceData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tickFormatter={formatAxisValue} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="closed" name="Concluídos" stackId="a" fill={COLORS.success} />
              <Bar dataKey="onTime" name="Em dia" stackId="a" fill={COLORS.primary} />
              <Bar dataKey="overdue" name="Atrasados" stackId="a" fill={COLORS.danger} />
            </BarChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'evol-entregas',
        title: `Evolução de Entregas (${evolucaoEntregasMeses} meses)`,
        content: (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={closedByMonth}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatAxisValue} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="closed" fill={COLORS.primary} name="Projetos fechados" />
            </BarChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'saude-farol',
        title: 'Saúde do Farol (Performance)',
        content: (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={farolPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }: { name: string; percent?: number }) => `${name}: ${percent != null ? (percent * 100).toFixed(1) : 0}%`}>
                {farolPieData.map((entry: { name: string }, index: number) => (
                  <Cell key={`cell-${index}`} fill={FAROL_COLORS[entry.name as FarolStatus] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'evol-tasks',
        title: `Evolução de Tasks Fechadas (${evolucaoTasksMeses} meses)`,
        content: (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tasksClosedByMonth}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatAxisValue} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="closed" fill="#14b8a6" name="Tasks fechadas" />
            </BarChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'dist-status',
        title: 'Distribuição por Status (ativos)',
        content: (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent?: number }) => `${name}\n${percent != null ? (percent * 100).toFixed(1) : 0}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusPieData.map((entry: { name: string }, index: number) => (
                  <Cell key={`cell-${index}`} fill={STATUS_PIE_COLORS[entry.name] || COLORS.primary} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'fechadas-dia',
        title: 'Features Fechadas por Dia',
        content: (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={closedByDay}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis tickFormatter={formatAxisValue} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1 }} />
              <Line type="monotone" dataKey="closed" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 6 }} activeDot={{ r: 10, strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'projetos-pmo',
        title: 'Projetos por PMO',
        content: (
          <ResponsiveContainer width="100%" height={Math.min(400, Math.max(300, pmoCounts.slice(0, 10).length * 30))}>
            <BarChart data={pmoCounts.slice(0, 10)} layout="vertical">
              <XAxis type="number" tickFormatter={formatAxisValue} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={COLORS.purple} />
            </BarChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'projetos-responsavel',
        title: 'Projetos por Responsável',
        content: (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={responsibleCounts.slice(0, 10)}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatAxisValue} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={COLORS.success} />
            </BarChart>
          </ResponsiveContainer>
        ),
      },
    ],
    [
      pmoPerformanceData,
      closedByMonth,
      evolucaoEntregasMeses,
      farolPieData,
      tasksClosedByMonth,
      evolucaoTasksMeses,
      statusPieData,
      closedByDay,
      pmoCounts,
      responsibleCounts,
    ]
  )

  if (featuresLoading && baseItems.length === 0) {
    return <DashboardSkeleton />
  }

  // Na primeira carga, mostrar skeleton até os dados chegarem
  if (consolidatedLoading && !consolidatedAzdoData) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6 px-2 pt-0 pb-6">
      <DashboardHeader
        consolidatedError={consolidatedError}
        consolidatedLoading={consolidatedLoading}
        dataUpdatedAt={consolidatedUpdatedAt}
      />

      {/* Layout: Semáforo à esquerda, Filtros e Cards à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 lg:items-stretch animate-fadeIn stagger-1">
        {/* Coluna esquerda: Semáforo */}
        <div className="w-fit">
          <div className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all flex flex-col w-fit min-w-fit h-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white whitespace-nowrap text-center w-full font-heading">
              Status do Farol
            </h2>
            <div className="flex flex-col items-center justify-center gap-4 flex-1">
              <TrafficLight
                summary={farolSummaryDisplay}
                onStatusClick={(status) => {
                  const items = activeItems.filter((item) => normalizeFarolStatus(item.farol_status) === status)
                  if (items.length > 0) {
                    openDrillDown(`Features com Farol: ${status}`, items as Feature[], `Farol: ${status}`)
                  } else {
                    setSelectedFarol(selectedFarol === status ? null : status)
                  }
                }}
              />
              {farolSummary['Indefinido'] && farolSummary['Indefinido'].count > 0 && (
                <FarolTooltip
                  status="Indefinido"
                  count={farolSummary['Indefinido'].count}
                  percentage={farolSummary['Indefinido'].percentage}
                  color={FAROL_COLORS['Indefinido']}
                  position="top"
                >
                  <button
                    onClick={() => {
                      const items = activeItems.filter(
                        (item) => !item.farol_status || normalizeFarolStatus(item.farol_status) === 'Indefinido',
                      )
                      if (items.length > 0) {
                        openDrillDown('Features sem Status de Farol', items as Feature[], 'Status: Indefinido')
                      }
                    }}
                    className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg transition-all duration-300 backdrop-blur-sm border border-gray-500/30 hover:border-gray-500/50 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:scale-105"
                  >
                    Indefinido: {farolSummary['Indefinido'].count} projeto{farolSummary['Indefinido'].count !== 1 ? 's' : ''}
                  </button>
                </FarolTooltip>
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita: Filtros e Cards */}
        <div className="flex flex-col lg:h-full justify-between gap-4">
          {/* Filtros */}
          <DashboardFiltersSection
            selectedResponsavel={selectedResponsavel}
            setSelectedResponsavel={setSelectedResponsavel}
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            selectedPMO={selectedPMO}
            setSelectedPMO={setSelectedPMO}
            uniqueResponsibles={uniqueResponsibles}
            clientsForFilter={clientsForFilter}
            uniqueStates={uniqueStates}
            uniquePMOs={uniquePMOs}
            hasFilters={hasFilters}
            clearFilters={() => {
              setSelectedFarol(null)
              setSelectedClient(null)
              setSelectedState(null)
              setSelectedPMO(null)
              setSelectedResponsavel(null)
              showToast('Filtros limpos', 'success')
            }}
          />

          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="glass dark:glass-dark p-8 rounded-lg hover-lift transition-all group cursor-pointer border-b-4 border-blue-500/30 hover:border-blue-500"
              onClick={() => openDrillDown('Total de Projetos', filteredItems as Feature[], 'Todos os Projetos')}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total de Projetos</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {totalProjects}
              </div>
            </div>

            <div
              className="glass dark:glass-dark p-8 rounded-lg hover-lift transition-all group cursor-pointer border-b-4 border-green-500/30 hover:border-green-500"
              onClick={() => {
                // Quando há filtros, usar filteredItems (já filtrado por cliente, estado, etc.)
                // e filtrar por status "Em Aberto" (excluir Encerrado/Closed)
                const items = hasFilters
                  ? (filteredItems.filter((item) => {
                      const state = normalizarStatus(item.state || '')
                      return state !== 'Encerrado' && state !== 'Closed'
                    }) as Feature[])
                  : ((openFeaturesWiqlData?.items || filteredItems) as Feature[])
                openDrillDown('Projetos Em Aberto', items, 'Em Aberto')
              }}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Em Aberto</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                {openCount}
              </div>
            </div>

            <div
              className="glass dark:glass-dark p-8 rounded-lg hover-lift transition-all group cursor-pointer border-b-4 border-red-500/30 hover:border-red-500"
              onClick={() => {
                if (overdueProjects.length > 0) {
                  openDrillDown('Projetos Atrasados', overdueProjects as Feature[], 'Atrasados')
                }
              }}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Atrasados</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                {!hasFilters ? (countsWiqlData?.overdue ?? 0) : overdueProjects.length}
              </div>
            </div>

            <div
              className="glass dark:glass-dark p-8 rounded-lg hover-lift transition-all group cursor-pointer border-b-4 border-yellow-500/30 hover:border-yellow-500"
              onClick={() => {
                if (nearDeadlineProjects.length > 0) {
                  openDrillDown('Projetos Próximos do Prazo', nearDeadlineProjects as Feature[], 'Próximos do Prazo')
                }
              }}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Próximos do Prazo</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent">
                {!hasFilters ? (nearDeadlineWiqlData?.count ?? countsWiqlData?.near_deadline ?? 0) : nearDeadlineProjects.length}
              </div>
            </div>
          </div>

          {/* Cards secundários - acima dos cards por mês */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              className="glass dark:glass-dark p-8 rounded-lg hover-lift transition-all group cursor-pointer border-b-4 border-orange-500/30 hover:border-orange-500"
              onClick={() => setClientsModal({ isOpen: true })}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Clientes</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                {validClientsLoading ? '...' : uniqueClients.length}
              </div>
            </div>

            <div
              className="glass dark:glass-dark p-8 rounded-lg hover-lift transition-all group cursor-pointer border-b-4 border-purple-500/30 hover:border-purple-500"
              onClick={() => setPMOsModal({ isOpen: true })}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">PMOs</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                {pmoCounts.length}
              </div>
            </div>

            <div
              className="glass dark:glass-dark p-8 rounded-lg hover-lift transition-all group cursor-pointer border-b-4 border-gray-500/30 hover:border-gray-500"
              onClick={() => {
                const items = (closedFeaturesWiqlData?.items || []) as Feature[]
                if (items.length > 0) openDrillDown('Features Encerradas (Closed)', items, 'Closed')
              }}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Encerrados</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">
                {closedFeaturesWiqlData?.count ?? 0}
              </div>
            </div>
          </div>

          {/* Cards por período - seletor de data (abaixo de Clientes/PMOs/Encerrados) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Período:</span>
              <div className="flex gap-2 items-center">
                <label className="text-xs text-gray-500 dark:text-gray-400">De</label>
                <input
                  type="date"
                  value={dateRangeDe}
                  onChange={(e) => setDateRangeDe(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                />
                <label className="text-xs text-gray-500 dark:text-gray-400">a</label>
                <input
                  type="date"
                  value={dateRangeAte}
                  onChange={(e) => setDateRangeAte(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all border-b-4 border-blue-400/30 cursor-pointer hover:border-blue-400"
                onClick={() =>
                  openDrillDown(
                    `Projetos Abertos de ${format(parseISO(dateRangeDe), 'dd/MM/yyyy', { locale: ptBR })} a ${format(parseISO(dateRangeAte), 'dd/MM/yyyy', { locale: ptBR })}`,
                    monthlyProjectData.projectsOpenedItems,
                    `${dateRangeDe} a ${dateRangeAte}`
                  )
                }
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {format(parseISO(dateRangeDe), 'dd/MM/yyyy', { locale: ptBR })} a {format(parseISO(dateRangeAte), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Projetos Abertos no Período</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  {monthlyProjectData.projectsOpened}
                </div>
              </div>
              <div
                className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all border-b-4 border-gray-400/30 cursor-pointer hover:border-gray-400"
                onClick={() =>
                  openDrillDown(
                    `Projetos Fechados de ${format(parseISO(dateRangeDe), 'dd/MM/yyyy', { locale: ptBR })} a ${format(parseISO(dateRangeAte), 'dd/MM/yyyy', { locale: ptBR })}`,
                    monthlyProjectData.projectsClosedItems,
                    `${dateRangeDe} a ${dateRangeAte}`
                  )
                }
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {format(parseISO(dateRangeDe), 'dd/MM/yyyy', { locale: ptBR })} a {format(parseISO(dateRangeAte), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Projetos Fechados no Período</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">
                  {monthlyProjectData.projectsClosed}
                </div>
              </div>
              <div
                className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all border-b-4 border-teal-400/30 cursor-pointer hover:border-teal-400"
                onClick={() =>
                  openDrillDown(
                    `Task's Abertas de ${format(parseISO(dateRangeDe), 'dd/MM/yyyy', { locale: ptBR })} a ${format(parseISO(dateRangeAte), 'dd/MM/yyyy', { locale: ptBR })}`,
                    (countsByMonthData?.tasks_opened_items || []) as Feature[],
                    `${dateRangeDe} a ${dateRangeAte}`
                  )
                }
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {format(parseISO(dateRangeDe), 'dd/MM/yyyy', { locale: ptBR })} a {format(parseISO(dateRangeAte), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Task&apos;s Abertas no Período</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-teal-500 to-teal-600 bg-clip-text text-transparent">
                  {countsByMonthData?.tasks_opened ?? '–'}
                </div>
              </div>
              <div
                className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all border-b-4 border-cyan-400/30 cursor-pointer hover:border-cyan-400"
                onClick={() =>
                  openDrillDown(
                    `Task's Fechadas de ${format(parseISO(dateRangeDe), 'dd/MM/yyyy', { locale: ptBR })} a ${format(parseISO(dateRangeAte), 'dd/MM/yyyy', { locale: ptBR })}`,
                    (countsByMonthData?.tasks_closed_items || []) as Feature[],
                    `${dateRangeDe} a ${dateRangeAte}`
                  )
                }
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {format(parseISO(dateRangeDe), 'dd/MM/yyyy', { locale: ptBR })} a {format(parseISO(dateRangeAte), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Task&apos;s Fechadas no Período</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent">
                  {countsByMonthData?.tasks_closed ?? '–'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          <span>📋</span>
          <span>Features por Status</span>
        </h2>
        <StatusCardsGrid
          statusCounts={statusCardsData}
          onCardClick={(status) => {
            const items = activeItems.filter((item) => {
              if (item.work_item_type && item.work_item_type.toLowerCase() !== 'feature') return false
              return normalizarStatus(item.state || '') === status
            })
            if (items.length > 0) {
              openDrillDown(`Features com Status: ${status}`, items as Feature[], `Status: ${status}`)
            } else {
              setSelectedState(selectedState === status ? null : status)
            }
          }}
        />
      </div>

      {/* Análise de Performance */}
      <div className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all animate-fadeIn stagger-2">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2 font-heading">
          <span>📊</span>
          <span>Análise de Performance</span>
        </h2>

        {/* Scorecard KPIs - Projetos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fadeIn stagger-3">
          <div
            className={`glass dark:glass-dark p-4 rounded-lg border-l-4 border-blue-500 transition-opacity ${
              closedProjectsItems.length > 0 ? 'cursor-pointer hover:opacity-90' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => {
              if (closedProjectsItems.length > 0) openDrillDown('Projetos Encerrados', closedProjectsItems, 'Projetos Encerrado')
            }}
            title={closedProjectsItems.length === 0 ? 'Nenhum item nesta categoria' : undefined}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Taxa de Conclusão</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400"><KpiCounter value={performanceKpis.taxaConclusao} suffix="%" decimals={1} /></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Projetos Encerrado</div>
          </div>
          <div
            className={`glass dark:glass-dark p-4 rounded-lg border-l-4 border-amber-500 transition-opacity ${
              overdueProjects.length > 0 ? 'cursor-pointer hover:opacity-90' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => {
              if (overdueProjects.length > 0) openDrillDown('Projetos Atrasados', overdueProjects as Feature[], 'Projetos Atrasados')
            }}
            title={overdueProjects.length === 0 ? 'Nenhum item nesta categoria' : undefined}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Taxa de Atraso</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400"><KpiCounter value={performanceKpis.taxaAtraso} suffix="%" decimals={1} /></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Projetos Atrasados</div>
          </div>
          <div
            className={`glass dark:glass-dark p-4 rounded-lg border-l-4 border-green-500 transition-opacity ${
              semProblemaProjects.length > 0 ? 'cursor-pointer hover:opacity-90' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => {
              if (semProblemaProjects.length > 0) openDrillDown('Projetos Sem Problema', semProblemaProjects as Feature[], 'Sem Problema')
            }}
            title={semProblemaProjects.length === 0 ? 'Nenhum item nesta categoria' : undefined}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Saúde do Farol</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400"><KpiCounter value={performanceKpis.saudeFarol} suffix="%" decimals={1} /></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sem Problema</div>
          </div>
          <div
            className={`glass dark:glass-dark p-4 rounded-lg border-l-4 border-emerald-500 transition-opacity ${
              onTimeProjects.length > 0 ? 'cursor-pointer hover:opacity-90' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => {
              if (onTimeProjects.length > 0) openDrillDown('Projetos em Dia', onTimeProjects as Feature[], 'Abertos em Dia')
            }}
            title={onTimeProjects.length === 0 ? 'Nenhum item nesta categoria' : undefined}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">No Prazo</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"><KpiCounter value={performanceKpis.noPrazo} suffix="%" decimals={1} /></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Projetos Abertos em Dia</div>
          </div>
        </div>

        {/* KPIs de Tasks - todos em percentual */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`glass dark:glass-dark p-4 rounded-lg border-l-4 border-cyan-500 transition-opacity ${
              (tasksClosedData?.items ?? []).length > 0 ? 'cursor-pointer hover:opacity-90' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => {
              const items = (tasksClosedData?.items ?? []).map((t) => ({
                ...t,
                raw_fields_json: { ...(t as any).raw_fields_json, work_item_type: 'Task', web_url: (t as any).web_url || (t as any).raw_fields_json?.web_url },
              })) as Feature[]
              if (items.length > 0) openDrillDown("Task's Fechadas", items, "Task's Fechadas (Closed e Resolved)")
            }}
            title={(tasksClosedData?.items ?? []).length === 0 ? 'Nenhum item nesta categoria' : undefined}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Task&apos;s Fechadas</div>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {tasksSummaryData ? <KpiCounter value={taskPerformanceKpis.taxaConclusao} suffix="%" decimals={1} /> : '–'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Task&apos;s Fechadas (Closed e Resolved)</div>
          </div>
          <div
            className={`glass dark:glass-dark p-4 rounded-lg border-l-4 border-red-500 transition-opacity ${
              (tasksOpenData?.items ?? []).filter((t) => (t as any).days_overdue != null && (t as any).days_overdue > 0).length > 0
                ? 'cursor-pointer hover:opacity-90'
                : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => {
              const items = (tasksOpenData?.items ?? [])
                .filter((t) => (t as any).days_overdue != null && (t as any).days_overdue > 0)
                .map((t) => ({
                  ...t,
                  raw_fields_json: { ...t.raw_fields_json, work_item_type: 'Task', web_url: t.web_url || t.raw_fields_json?.web_url },
                })) as Feature[]
              if (items.length > 0) openDrillDown("Task's Atrasadas", items, "Task's Atrasadas")
            }}
            title={(tasksOpenData?.items ?? []).filter((t) => (t as any).days_overdue != null && (t as any).days_overdue > 0).length === 0 ? 'Nenhum item nesta categoria' : undefined}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Taxa de atraso</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {tasksSummaryData ? <KpiCounter value={taskPerformanceKpis.taxaAtraso} suffix="%" decimals={1} /> : '–'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Task&apos;s Atrasadas</div>
          </div>
          <div
            className={`glass dark:glass-dark p-4 rounded-lg border-l-4 border-teal-500 transition-opacity ${
              (tasksOpenData?.items ?? []).length > 0 ? 'cursor-pointer hover:opacity-90' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => {
              const items = (tasksOpenData?.items ?? []).map((t) => ({
                ...t,
                raw_fields_json: { ...t.raw_fields_json, work_item_type: 'Task', web_url: t.web_url || t.raw_fields_json?.web_url },
              })) as Feature[]
              if (items.length > 0) openDrillDown("Task's em Aberto", items, "Task's em Aberto (New e Active)")
            }}
            title={(tasksOpenData?.items ?? []).length === 0 ? 'Nenhum item nesta categoria' : undefined}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Em Andamento</div>
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {tasksSummaryData ? <KpiCounter value={taskPerformanceKpis.emAndamento} suffix="%" decimals={1} /> : '–'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Task&apos;s em Aberto (New e Active)</div>
          </div>
          <div
            className={`glass dark:glass-dark p-4 rounded-lg border-l-4 border-emerald-500 transition-opacity ${
              (tasksOpenData?.items ?? []).filter((t) => (t as any).days_overdue == null || (t as any).days_overdue <= 0).length > 0
                ? 'cursor-pointer hover:opacity-90'
                : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => {
              const items = (tasksOpenData?.items ?? [])
                .filter((t) => (t as any).days_overdue == null || (t as any).days_overdue <= 0)
                .map((t) => ({
                  ...t,
                  raw_fields_json: { ...(t as any).raw_fields_json, work_item_type: 'Task', web_url: (t as any).web_url || (t as any).raw_fields_json?.web_url },
                })) as Feature[]
              if (items.length > 0) openDrillDown("Task's em Dia", items, 'Abertos em Dia')
            }}
            title={(tasksOpenData?.items ?? []).filter((t) => (t as any).days_overdue == null || (t as any).days_overdue <= 0).length === 0 ? 'Nenhum item nesta categoria' : undefined}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">No Prazo</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {tasksSummaryData ? <KpiCounter value={taskPerformanceKpis.noPrazo} suffix="%" decimals={1} /> : '–'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Task&apos;s Abertas em Dia</div>
          </div>
        </div>

        {/* Performance por PMO + Evolução + Saúde Farol */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn stagger-4">
          <ChartWithActions title="Performance por PMO" onFullscreenClick={() => setFullscreenChartIndex(0)}>
            <ResponsiveContainer width="100%" height={Math.min(400, Math.max(250, pmoPerformanceData.length * 36))}>
              <BarChart data={pmoPerformanceData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tickFormatter={formatAxisValue} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="closed"
                  name="Concluídos"
                  stackId="a"
                  fill={COLORS.success}
                  onClick={(data: any) => {
                    const row = data?.payload ?? data
                    const items = row?.items?.closed ?? []
                    if (items.length > 0) {
                      openDrillDown(`PMO: ${row.name} - Concluídos`, items, `PMO: ${row.name} | Concluídos`)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <Bar
                  dataKey="onTime"
                  name="Em dia"
                  stackId="a"
                  fill={COLORS.primary}
                  onClick={(data: any) => {
                    const row = data?.payload ?? data
                    const items = row?.items?.onTime ?? []
                    if (items.length > 0) {
                      openDrillDown(`PMO: ${row.name} - Em dia`, items, `PMO: ${row.name} | Em dia`)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <Bar
                  dataKey="overdue"
                  name="Atrasados"
                  stackId="a"
                  fill={COLORS.danger}
                  onClick={(data: any) => {
                    const row = data?.payload ?? data
                    const items = row?.items?.overdue ?? []
                    if (items.length > 0) {
                      openDrillDown(`PMO: ${row.name} - Atrasados`, items, `PMO: ${row.name} | Atrasados`)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartWithActions>

          <ChartWithActions title={`Evolução de Entregas (${evolucaoEntregasMeses} meses)`} onFullscreenClick={() => setFullscreenChartIndex(1)}>
            <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
              <div className="flex gap-1">
                {[3, 6, 9, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setEvolucaoEntregasMeses(m)}
                    className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                      evolucaoEntregasMeses === m
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={closedByMonth}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatAxisValue} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="closed"
                  fill={COLORS.primary}
                  name="Projetos fechados"
                  onClick={(evt: any) => {
                    const row = closedByMonth.find((r) => r.label === evt?.payload?.label)
                    if (row?.items?.length) {
                      openDrillDown(
                        `Projetos fechados em ${row.label}`,
                        row.items,
                        `Fechados em: ${row.label}`
                      )
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartWithActions>

          <ChartWithActions title="Saúde do Farol (Performance)" onFullscreenClick={() => setFullscreenChartIndex(2)}>
            <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={farolPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }: { name: string; percent?: number }) => `${name}: ${percent != null ? (percent * 100).toFixed(1) : 0}%`}
                      onClick={(data: any) => {
                        const status = data.name as FarolStatus
                        const items = activeItems.filter((item) => normalizeFarolStatus(item.farol_status) === status)
                        if (items.length > 0) {
                          openDrillDown(`Farol: ${status}`, items as Feature[], `Farol: ${status}`)
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {farolPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={FAROL_COLORS[entry.name as FarolStatus] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
          </ChartWithActions>

          <ChartWithActions title={`Evolução de Tasks Fechadas (${evolucaoTasksMeses} meses)`} onFullscreenClick={() => setFullscreenChartIndex(3)}>
            <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
              <div className="flex gap-1">
                {[3, 6, 9, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setEvolucaoTasksMeses(m)}
                    className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                      evolucaoTasksMeses === m
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tasksClosedByMonth}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatAxisValue} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="closed"
                  fill="#14b8a6"
                  name="Tasks fechadas"
                  onClick={(evt: any) => {
                    const row = tasksClosedByMonth.find((r) => r.label === evt?.payload?.label)
                    if (row?.items?.length) {
                      openDrillDown(
                        `Tasks fechadas em ${row.label}`,
                        row.items as Feature[],
                        `Tasks em: ${row.label}`
                      )
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartWithActions>
        </div>
      </div>

      {/* Gráficos (limpos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWithActions title="Distribuição por Status (ativos)" onFullscreenClick={() => setFullscreenChartIndex(4)}>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent?: number }) => `${name}\n${percent != null ? (percent * 100).toFixed(1) : 0}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onClick={(data: any) => {
                  const items = activeItems.filter((item) => normalizarStatus(item.state || '') === data.name)
                  if (items.length > 0) {
                    openDrillDown(`Features com Status: ${data.name}`, items as Feature[], `Status: ${data.name}`)
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {statusPieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={STATUS_PIE_COLORS[entry.name] || COLORS.primary} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWithActions>

        <ChartWithActions title="Features Fechadas por Dia" onFullscreenClick={() => setFullscreenChartIndex(5)}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">De</label>
              <input
                type="date"
                value={closedByDayDateDe}
                onChange={(e) => setClosedByDayDateDe(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
              />
              <label className="text-sm text-gray-600 dark:text-gray-400">a</label>
              <input
                type="date"
                value={closedByDayDateAte}
                onChange={(e) => setClosedByDayDateAte(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={closedByDay}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis tickFormatter={formatAxisValue} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="closed"
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={<ClosedDot />}
                activeDot={{ r: 10, strokeWidth: 2, stroke: '#fff' }}
                onClick={(data: { isoDate?: string }) => {
                  if (data?.isoDate) handleClosedDayClick(data.isoDate)
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWithActions>
      </div>

      {/* Gráficos: Features por PMO / Responsável (como no Backup) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWithActions title="Projetos por PMO" onFullscreenClick={() => setFullscreenChartIndex(6)}>
          <ResponsiveContainer width="100%" height={Math.min(400, Math.max(300, pmoCounts.slice(0, 10).length * 30))}>
            <BarChart data={pmoCounts.slice(0, 10)} layout="vertical">
              <XAxis type="number" tickFormatter={formatAxisValue} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill={COLORS.purple}
                onClick={(data: any) => {
                  if (data && data.name) {
                    const items = filteredItems.filter((item) => extractPMO(item) === data.name)
                    if (items.length > 0) openDrillDown(`Projetos do PMO: ${data.name}`, items as Feature[], `PMO: ${data.name}`)
                    else setSelectedPMO(selectedPMO === data.name ? null : data.name)
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartWithActions>

        <ChartWithActions title="Projetos por Responsável" onFullscreenClick={() => setFullscreenChartIndex(7)}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={responsibleCounts.slice(0, 10)}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatAxisValue} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill={COLORS.success}
                onClick={(data: any) => {
                  if (data && data.name) {
                    const items = activeItems.filter((item) => extractResponsavelCliente(item) === data.name)
                    if (items.length > 0) openDrillDown(`Features do Responsável: ${data.name}`, items as Feature[], `Responsável: ${data.name}`)
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Lista completa (encolhível por padrão para evitar sobreposição com rótulos do gráfico) */}
          {(() => {
            const top = new Set(responsibleCounts.slice(0, 10).map((x) => x.name))
            const rest = responsibleCounts.filter((r) => !top.has(r.name))
            const count = rest.length
            if (count === 0) return null
            return (
              <div className="mt-8 glass dark:glass-dark p-4 rounded-lg">
                <button
                  type="button"
                  onClick={() => setResponsaveisListExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span>Todos os responsáveis (exceto top 10) ({count})</span>
                  <span className="text-lg leading-none" aria-hidden="true">{responsaveisListExpanded ? '▼' : '▶'}</span>
                </button>
                {responsaveisListExpanded && (
                  <div className="mt-2 max-h-64 overflow-y-auto space-y-2 pr-2">
                    {rest.map((r) => (
                      <button
                        key={r.name}
                        className="w-full text-left glass dark:glass-dark px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                        onClick={() => {
                          const items = activeItems.filter((item) => extractResponsavelCliente(item) === r.name)
                          if (items.length > 0) openDrillDown(`Features do Responsável: ${r.name}`, items as Feature[], `Responsável: ${r.name}`)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-800 dark:text-gray-100 truncate">{r.name}</span>
                          <span className="text-sm font-bold text-green-700 dark:text-green-300">{r.value}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </ChartWithActions>
      </div>

      {/* Galeria fullscreen com navegação entre gráficos */}
      <ChartGalleryOverlay
        isOpen={fullscreenChartIndex !== null}
        currentIndex={fullscreenChartIndex ?? 0}
        charts={chartSlots}
        onClose={() => setFullscreenChartIndex(null)}
        onNavigate={(i) => setFullscreenChartIndex(i)}
      />

      {/* Botão voltar ao topo */}
      <ScrollToTop />

      {/* Modal de Drill-Down */}
      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}
        title={drillDownModal.title}
        items={drillDownModal.items}
        filterLabel={drillDownModal.filterLabel}
      />

      {/* Modal de Clientes */}
      <ClientsModal
        isOpen={clientsModal.isOpen}
        onClose={() => setClientsModal({ isOpen: false })}
        clients={uniqueClients}
        allItems={filteredItems as Feature[]}
        activeItems={activeItems as Feature[]}
        onClientClick={(client) => {
          const key = normalizeClientKey(client)
          const items = filteredItems.filter((item) => normalizeClientKey(item.client) === key)
          openDrillDown(`Projetos do Cliente: ${client}`, items as Feature[], `Cliente: ${client}`)
        }}
      />

      {/* Modal de PMOs */}
      <PMOsModal
        isOpen={pmosModal.isOpen}
        onClose={() => setPMOsModal({ isOpen: false })}
        pmos={pmoCounts.map((p) => ({ name: p.name, count: p.value }))}
        onPMOClick={(pmo) => {
          const items = activeItems.filter((item) => extractPMO(item) === pmo)
          if (items.length > 0) openDrillDown(`Projetos do PMO: ${pmo}`, items as Feature[], `PMO: ${pmo}`)
          else setSelectedPMO(selectedPMO === pmo ? null : pmo)
        }}
      />
    </div>
  )
}
