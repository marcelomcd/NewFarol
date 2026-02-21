import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { FarolStatus } from '../utils/farol'

interface FarolNavbarContextValue {
  farolStatus: FarolStatus | null
  setFarolStatus: (status: FarolStatus | null) => void
}

const FarolNavbarContext = createContext<FarolNavbarContextValue | null>(null)

export function FarolNavbarProvider({ children }: { children: ReactNode }) {
  const [farolStatus, setFarolStatus] = useState<FarolStatus | null>(null)
  const setter = useCallback((status: FarolStatus | null) => setFarolStatus(status), [])
  return (
    <FarolNavbarContext.Provider value={{ farolStatus, setFarolStatus: setter }}>
      {children}
    </FarolNavbarContext.Provider>
  )
}

export function useFarolNavbar() {
  const ctx = useContext(FarolNavbarContext)
  return ctx ?? { farolStatus: null, setFarolStatus: () => {} }
}
