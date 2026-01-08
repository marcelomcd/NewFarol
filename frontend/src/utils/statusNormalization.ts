// Ordem específica de status conforme solicitado
export const STATUS_ORDER = [
  "Novo",                 // New (Backlog) - exibido como "Novo"
  "Em Planejamento",
  "Em Andamento",
  "Projeto em Fase Crítica",
  "Homologação Interna",
  "Em Homologação",
  "Em Fase de Encerramento",
  "Em Garantia",
  "Pausado Pelo Cliente",
  "Encerrado",           // Closed
]

export const STATUS_MAPEAMENTO: { [key: string]: string } = {
  // New/Backlog -> Novo
  "New": "Novo",
  "Backlog": "Novo",
  
  // Planejamento
  "Projeto Em Planejamento": "Em Planejamento",
  "Em Planejamento": "Em Planejamento",
  
  // Andamento
  "Projeto Em Andamento": "Em Andamento",
  "Em Andamento": "Em Andamento",
  "Active": "Em Andamento",
  "In Progress": "Em Andamento",
  
  // Fase Crítica
  "Projeto em Fase Crítica": "Projeto em Fase Crítica",
  "Projeto em Fase Critica": "Projeto em Fase Crítica",
  "Projeto Em Fase Crítica": "Projeto em Fase Crítica",
  
  // Homologação Interna
  "Homologação Interna": "Homologação Interna",
  
  // Em Homologação
  "Projeto Em Homologação": "Em Homologação",
  "Em Homologação": "Em Homologação",
  
  // Fase de Encerramento
  "Projeto Em Fase de Encerramento": "Em Fase de Encerramento",
  "Resolved": "Em Fase de Encerramento",
  "Done": "Em Fase de Encerramento",
  
  // Em Garantia
  "Em Garantia": "Em Garantia",
  
  // Pausado
  "Projeto Pausado pelo Cliente": "Pausado Pelo Cliente",
  "Pausado pelo Cliente": "Pausado Pelo Cliente",
  "Pausado Pelo Cliente": "Pausado Pelo Cliente",
  
  // Encerrado
  "Closed": "Encerrado",
  "Fechado": "Encerrado",
  "Concluído": "Encerrado",
}

// Estados que devem ser excluídos da contagem de "ativos" e cards
// (apenas Encerrado e Em Garantia após normalização)
export const EXCLUDED_STATES: string[] = ['Encerrado', 'Em Garantia']

// Função para ordenar status conforme ordem específica
export function getStatusOrder(status: string): number {
  const index = STATUS_ORDER.indexOf(status)
  return index === -1 ? 999 : index
}

export function normalizarStatus(status: string | undefined | null): string {
  if (!status) {
    return "Sem Estado"
  }
  const cleanedStatus = status.trim()
  return STATUS_MAPEAMENTO[cleanedStatus] || cleanedStatus
}

