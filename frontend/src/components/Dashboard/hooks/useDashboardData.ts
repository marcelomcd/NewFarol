/**
 * Hook customizado para gerenciar dados do dashboard.
 * 
 * Centraliza toda lógica de fetching de dados e estado.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import axios from 'axios'
import { azdoApi, featuresApi, featuresCountApi, workItemsApi } from '../../../services/api'

export interface DashboardDataHookResult {
  // Features
  featuresData: any
  isLoadingFeatures: boolean
  featuresError: any
  
  // WIQL Counts
  countsWiqlData: any
  isLoadingCounts: boolean
  countsError: any
  
  // Open Features WIQL
  openFeaturesWiqlData: any
  isLoadingOpenFeatures: boolean
  
  // Closed Features WIQL
  closedFeaturesWiqlData: any
  
  // Features by State WIQL
  featuresByStateWiqlData: any
  
  // Features by Farol WIQL
  featuresByFarolWiqlData: any
  
  // Valid Clients
  validClientsData: any
  isLoadingClients: boolean
  validClientsError: any
  
  // Work Items
  tasksSummary: any
  overdueTasksData: any
  workItemsByType: any
  overdueFeaturesData: any
  nearDeadlineFeaturesData: any
  
  // Errors
  isCriticalError: boolean
  isConnectionError: boolean
}

export function useDashboardData(): DashboardDataHookResult {
  const queryClient = useQueryClient()
  
  // Forçar refetch dos dados WIQL quando o componente montar
  useEffect(() => {
    console.log('[useDashboardData] 🔄 Forçando refetch dos dados WIQL e limpando cache...')
    queryClient.removeQueries({ queryKey: ['features'] })
    queryClient.removeQueries({ queryKey: ['clients'] })
    queryClient.invalidateQueries({ queryKey: ['features', 'counts-wiql'] })
    queryClient.invalidateQueries({ queryKey: ['features', 'open-wiql'] })
    queryClient.invalidateQueries({ queryKey: ['clients', 'valid'] })
    queryClient.refetchQueries({ queryKey: ['features', 'counts-wiql'] })
    queryClient.refetchQueries({ queryKey: ['features', 'open-wiql'] })
    queryClient.refetchQueries({ queryKey: ['clients', 'valid'] })
  }, [queryClient])
  
  // Features do banco de dados
  const { data: featuresData, isLoading: isLoadingFeatures, error: featuresError } = useQuery({
    queryKey: ['features', 'all'],
    queryFn: async () => {
      console.log('[useDashboardData] Buscando features do banco...')
      const result = await featuresApi.list({ limit: 1000 })
      const openCount = result?.items?.filter(item => {
        const state = item.state || ''
        return !['Closed', 'Resolved', 'Done', 'Fechado', 'Concluído'].includes(state)
      }).length || 0
      console.log('[useDashboardData] Features recebidas do BANCO:', {
        total: result?.items?.length || 0,
        emAberto: openCount,
        warning: openCount !== 135 ? `⚠️ Banco: ${openCount}, Esperado (WIQL): 135` : '✅ OK'
      })
      return result
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  })
  
  // Clientes válidos dos Epics
  const { data: validClientsData, isLoading: isLoadingClients, error: validClientsError } = useQuery({
    queryKey: ['clients', 'valid'],
    queryFn: async () => {
      console.log('[useDashboardData] 🔍 Buscando clientes válidos...')
      const response = await axios.get('/api/features/clients/valid')
      console.log('[useDashboardData] ✅ Clientes válidos:', {
        count: response.data?.clients?.length || 0,
      })
      return response.data
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  })
  
  // Contagens via WIQL
  const { data: countsWiqlData, isLoading: isLoadingCounts, error: countsError } = useQuery({
    queryKey: ['features', 'counts-wiql'],
    queryFn: async () => {
      console.log('[useDashboardData] 🔍 Buscando contagens via WIQL...')
      const result = await featuresCountApi.getCountsWiql()
      console.log('[useDashboardData] ✅ Contagens WIQL do BACKEND:', {
        open: result?.open,
        validation: result?.open === 135 ? '✅ Correto' : `⚠️ Esperado 135, recebeu ${result?.open}`
      })
      return result
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  })

  // Consolidado (1 chamada) — preferido para reduzir loading e inconsistências
  // Mantemos o restante por compatibilidade durante a migração.
  const { data: consolidatedAzdoData } = useQuery({
    queryKey: ['azdo', 'consolidated', 7],
    queryFn: () => azdoApi.getConsolidated({ days_near_deadline: 7, cache_seconds: 30 }),
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  })
  
  // Features abertas via WIQL
  const { data: openFeaturesWiqlData, isLoading: isLoadingOpenFeatures } = useQuery({
    queryKey: ['features', 'open-wiql'],
    queryFn: async () => {
      console.log('[useDashboardData] Buscando features abertas via WIQL...')
      const result = await featuresCountApi.getOpenFeaturesWiql()
      console.log('[useDashboardData] ✅ Features abertas WIQL:', {
        count: result?.count,
        itemsLength: result?.items?.length
      })
      return result
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  })
  
  // Features encerradas via WIQL
  const { data: closedFeaturesWiqlData } = useQuery({
    queryKey: ['features', 'closed-wiql'],
    queryFn: () => featuresCountApi.getClosedFeaturesWiql(),
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
  
  // Features por estado via WIQL
  const { data: featuresByStateWiqlData } = useQuery({
    queryKey: ['features', 'by-state-wiql'],
    queryFn: () => featuresCountApi.getFeaturesByStateWiql(),
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
  
  // Features por Farol via WIQL
  const { data: featuresByFarolWiqlData } = useQuery({
    queryKey: ['features', 'by-farol-wiql'],
    queryFn: () => featuresCountApi.getFeaturesByFarolWiql(),
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
  
  // Work Items adicionais
  const { data: tasksSummary } = useQuery({
    queryKey: ['tasks', 'summary'],
    queryFn: () => workItemsApi.getTasksSummary(),
    retry: 1,
    refetchOnWindowFocus: false,
  })
  
  const { data: overdueTasksData } = useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: () => workItemsApi.getTasks({ overdue_only: true }),
    retry: 1,
    refetchOnWindowFocus: false,
  })
  
  const { data: workItemsByType } = useQuery({
    queryKey: ['work-items', 'by-type'],
    queryFn: () => workItemsApi.getWorkItemsByType(),
    retry: 1,
    refetchOnWindowFocus: false,
  })
  
  const { data: overdueFeaturesData } = useQuery({
    queryKey: ['features', 'overdue'],
    queryFn: () => workItemsApi.getOverdueFeatures(),
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!featuresData,
  })
  
  const { data: nearDeadlineFeaturesData } = useQuery({
    queryKey: ['features', 'near-deadline'],
    queryFn: () => workItemsApi.getNearDeadlineFeatures(10),
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!featuresData,
  })
  
  // Detectar erros críticos
  const isCriticalError = !!featuresError || !!countsError || !!validClientsError
  const isConnectionError = 
    featuresError?.message?.includes('Network') ||
    featuresError?.message?.includes('ERR_CONNECTION') ||
    countsError?.message?.includes('Network')
  
  return {
    // Features
    featuresData,
    isLoadingFeatures,
    featuresError,
    
    // WIQL Counts
    countsWiqlData: consolidatedAzdoData?.totals
      ? {
          total: consolidatedAzdoData.totals.total_projects,
          open: consolidatedAzdoData.totals.open_projects,
          overdue: consolidatedAzdoData.totals.overdue_projects,
          near_deadline: consolidatedAzdoData.totals.near_deadline_projects,
          source: consolidatedAzdoData.cache?.hit ? 'azdo_consolidated_cache' : 'azdo_consolidated',
        }
      : countsWiqlData,
    isLoadingCounts,
    countsError,
    
    // Open Features WIQL
    openFeaturesWiqlData,
    isLoadingOpenFeatures,
    
    // Closed Features WIQL
    closedFeaturesWiqlData,
    
    // Features by State WIQL
    featuresByStateWiqlData,
    
    // Features by Farol WIQL
    featuresByFarolWiqlData,
    
    // Valid Clients
    validClientsData,
    isLoadingClients,
    validClientsError,
    
    // Work Items
    tasksSummary,
    overdueTasksData,
    workItemsByType,
    overdueFeaturesData,
    nearDeadlineFeaturesData,
    
    // Errors
    isCriticalError,
    isConnectionError,
  }
}

