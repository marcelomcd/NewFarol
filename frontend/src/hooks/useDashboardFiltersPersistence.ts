/**
 * Hook para persistir filtros do dashboard em sessionStorage.
 * Restaura ao montar e salva quando os filtros mudam (pelo usuário).
 */
import { useEffect, useRef } from 'react'

const STORAGE_KEY = 'farol-dashboard-filters'

export interface PersistedFilters {
  selectedFarol: string | null
  selectedClient: string | null
  selectedState: string | null
  selectedPMO: string | null
  selectedResponsavel: string | null
  dateRangeDe: string
  dateRangeAte: string
}

export function useDashboardFiltersPersistence(
  filters: PersistedFilters,
  setters: {
    setSelectedFarol: (v: string | null) => void
    setSelectedClient: (v: string | null) => void
    setSelectedState: (v: string | null) => void
    setSelectedPMO: (v: string | null) => void
    setSelectedResponsavel: (v: string | null) => void
    setDateRangeDe: (v: string) => void
    setDateRangeAte: (v: string) => void
  },
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options
  const skipNextSave = useRef(false)

  // Restaurar ao montar
  useEffect(() => {
    if (!enabled) return
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return
      skipNextSave.current = true
      const parsed = JSON.parse(raw) as Partial<PersistedFilters>
      if (parsed.selectedFarol != null) setters.setSelectedFarol(parsed.selectedFarol)
      if (parsed.selectedClient != null) setters.setSelectedClient(parsed.selectedClient)
      if (parsed.selectedState != null) setters.setSelectedState(parsed.selectedState)
      if (parsed.selectedPMO != null) setters.setSelectedPMO(parsed.selectedPMO)
      if (parsed.selectedResponsavel != null) setters.setSelectedResponsavel(parsed.selectedResponsavel)
      if (parsed.dateRangeDe) setters.setDateRangeDe(parsed.dateRangeDe)
      if (parsed.dateRangeAte) setters.setDateRangeAte(parsed.dateRangeAte)
    } catch {
      // Ignora erro de parse
    }
  }, [enabled]) // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  // Salvar quando filtros mudam (exceto logo após restore)
  const filtersKey = JSON.stringify(filters)
  useEffect(() => {
    if (!enabled) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, filtersKey)
    } catch {
      // Ignora erro (quota, private mode, etc.)
    }
  }, [enabled, filtersKey])
}
