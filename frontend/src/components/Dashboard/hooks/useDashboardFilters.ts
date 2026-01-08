/**
 * Hook customizado para gerenciar filtros do dashboard.
 * 
 * Centraliza lógica de estado dos filtros.
 */
import { useState, useCallback } from 'react'
import { FarolStatus } from '../../../utils/farol'

export interface DashboardFilters {
  selectedFarol: FarolStatus | null
  selectedClient: string | null
  selectedState: string | null
  selectedPMO: string | null
}

export interface DashboardFiltersHookResult extends DashboardFilters {
  setSelectedFarol: (farol: FarolStatus | null) => void
  setSelectedClient: (client: string | null) => void
  setSelectedState: (state: string | null) => void
  setSelectedPMO: (pmo: string | null) => void
  clearAllFilters: () => void
  hasActiveFilters: boolean
}

export function useDashboardFilters(): DashboardFiltersHookResult {
  const [selectedFarol, setSelectedFarol] = useState<FarolStatus | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedPMO, setSelectedPMO] = useState<string | null>(null)
  
  const clearAllFilters = useCallback(() => {
    setSelectedFarol(null)
    setSelectedClient(null)
    setSelectedState(null)
    setSelectedPMO(null)
  }, [])
  
  const hasActiveFilters = !!(selectedFarol || selectedClient || selectedState || selectedPMO)
  
  return {
    selectedFarol,
    selectedClient,
    selectedState,
    selectedPMO,
    setSelectedFarol,
    setSelectedClient,
    setSelectedState,
    setSelectedPMO,
    clearAllFilters,
    hasActiveFilters,
  }
}

