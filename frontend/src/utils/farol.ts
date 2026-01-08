import { FarolStatus } from '../components/Farol/FarolCircle'

export type { FarolStatus }

export function normalizeFarolStatus(status?: string | null): FarolStatus {
  if (!status) return 'Indefinido'
  
  const statusLower = status.toLowerCase().trim()
  
  if (statusLower.includes('sem problema') || statusLower.includes('green')) {
    return 'Sem Problema'
  }
  if (statusLower.includes('com problema') || statusLower.includes('yellow')) {
    return 'Com Problema'
  }
  if (statusLower.includes('problema crítico') || statusLower.includes('problema critico') || statusLower.includes('red')) {
    return 'Problema Crítico'
  }
  
  return 'Indefinido'
}

export function getFarolStatusSummary(
  items: Array<{ farol_status?: string | null }>
): Record<FarolStatus, { count: number; percentage: number }> {
  const summary: Record<string, number> = {}
  
  items.forEach(item => {
    const status = normalizeFarolStatus(item.farol_status)
    summary[status] = (summary[status] || 0) + 1
  })
  
  const total = items.length
  const result: Record<FarolStatus, { count: number; percentage: number }> = {
    'Sem Problema': { count: summary['Sem Problema'] || 0, percentage: 0 },
    'Com Problema': { count: summary['Com Problema'] || 0, percentage: 0 },
    'Problema Crítico': { count: summary['Problema Crítico'] || 0, percentage: 0 },
    'Indefinido': { count: summary['Indefinido'] || 0, percentage: 0 },
  }
  
  if (total > 0) {
    Object.keys(result).forEach(status => {
      result[status as FarolStatus].percentage = Math.round(
        (result[status as FarolStatus].count / total) * 100 * 10
      ) / 10
    })
  }
  
  return result
}

