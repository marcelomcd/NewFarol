import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface DashboardDataContextValue {
  dataUpdatedAt: number | null
  setDataUpdatedAt: (ts: number | null) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null)

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [dataUpdatedAt, setDataUpdatedAt] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const setter = useCallback((ts: number | null) => setDataUpdatedAt(ts), [])
  const setSearch = useCallback((q: string) => setSearchQuery(q), [])
  return (
    <DashboardDataContext.Provider value={{ dataUpdatedAt, setDataUpdatedAt: setter, searchQuery, setSearchQuery: setSearch }}>
      {children}
    </DashboardDataContext.Provider>
  )
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext)
  return ctx ?? { dataUpdatedAt: null, setDataUpdatedAt: () => {}, searchQuery: '', setSearchQuery: () => {} }
}
