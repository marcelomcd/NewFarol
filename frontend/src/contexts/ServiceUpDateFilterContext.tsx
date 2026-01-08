import { createContext, useContext, ReactNode } from 'react'

interface DateFilterContextType {
  month: number | null
  year: number | null
  startDate: string | null
  endDate: string | null
  analistaFilter: string
  analistasSelecionados: string[]
}

const DateFilterContext = createContext<DateFilterContextType | null>(null)

export const DateFilterProvider = ({
  children,
  month,
  year,
  startDate,
  endDate,
  analistaFilter,
  analistasSelecionados,
}: {
  children: ReactNode
  month: number | null
  year: number | null
  startDate: string | null
  endDate: string | null
  analistaFilter: string
  analistasSelecionados: string[]
}) => {
  return (
    <DateFilterContext.Provider
      value={{ month, year, startDate, endDate, analistaFilter, analistasSelecionados }}
    >
      {children}
    </DateFilterContext.Provider>
  )
}

export const useDateFilterContext = () => {
  const context = useContext(DateFilterContext)
  return (
    context || {
      month: null,
      year: null,
      startDate: null,
      endDate: null,
      analistaFilter: 'todos',
      analistasSelecionados: [],
    }
  )
}

