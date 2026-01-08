/**
 * Utilitário para agregar dados de work items por Assigned To.
 * 
 * Agrupa itens por responsável e retorna dados formatados para gráficos.
 */

export interface ChartDataPoint {
  name: string
  value: number
}

/**
 * Agrega features por Assigned To e retorna dados para gráfico.
 * 
 * @param features - Array de features para agregar
 * @param extractAssignedTo - Função para extrair o responsável de cada feature
 * @param limit - Limite máximo de itens a retornar (opcional)
 * @returns Array de pontos de dados ordenados por valor decrescente
 */
export function aggregateByAssignedTo<T>(
  items: T[] | undefined,
  extractAssignedTo: (item: T) => string,
  limit?: number
): ChartDataPoint[] {
  if (!items || items.length === 0) {
    return []
  }

  const counts: Record<string, number> = {}
  
  items.forEach((item) => {
    const assigned = extractAssignedTo(item)
    counts[assigned] = (counts[assigned] || 0) + 1
  })

  const result = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return limit ? result.slice(0, limit) : result
}

