/**
 * Funções auxiliares para processamento de Features
 */

/**
 * Extrai nome completo de um email
 * Exemplos:
 * - fulano.tal@empresa.com → Fulano Tal
 * - newton.alcantud@consigaz.com.br → Newton Alcantud
 * - thiago.comoti@arteb.com.br → Thiago Comoti
 */
export function extractNameFromEmail(email: string): string {
  if (!email || typeof email !== 'string') return ''
  
  // Se for email, extrai a parte antes do @
  if (email.includes('@')) {
    const emailParts = email.split('@')[0].split('.')
    return emailParts
      .map((part: string) => part.trim())
      .filter((part: string) => part.length > 0)
      .map((part: string) => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      )
      .join(' ')
  }
  
  return email
}

/**
 * Extrai nome completo de um objeto AssignedTo do Azure DevOps
 */
export function extractDisplayName(assignedTo: any): string {
  if (!assignedTo) return '-'
  
  if (typeof assignedTo === 'string') {
    // Se for email, tenta extrair nome
    if (assignedTo.includes('@')) {
      return extractNameFromEmail(assignedTo)
    }
    return assignedTo
  }
  
  if (typeof assignedTo === 'object') {
    // Prioriza displayName
    if (assignedTo.displayName) {
      return assignedTo.displayName
    }
    if (assignedTo.name) {
      return assignedTo.name
    }
    if (assignedTo.uniqueName) {
      return extractNameFromEmail(assignedTo.uniqueName)
    }
  }
  
  return '-'
}

/**
 * Normaliza valor de Criticidade (remove número)
 */
export function normalizeCriticidade(value: any): string {
  if (!value) return '-'
  
  const str = String(value).trim()
  // Remove padrão "número - texto" (ex: "1 - Baixa" → "Baixa")
  const match = str.match(/^\d+\s*-\s*(.+)$/i)
  if (match) {
    return match[1].trim()
  }
  
  // Se já estiver normalizado, retorna
  return str
}

/**
 * Normaliza valor de SituacaoPendenteList (remove número)
 */
export function normalizePendencia(value: any): string {
  if (!value) return 'Não'
  
  const str = String(value).trim().toLowerCase()
  
  // Remove padrão "número - texto"
  const match = str.match(/^\d+\s*-\s*(.+)$/i)
  if (match) {
    const texto = match[1].trim().toLowerCase()
    return texto.includes('sim') || texto.includes('yes') || texto.includes('true') ? 'Sim' : 'Não'
  }
  
  // Verifica diretamente
  if (str.includes('sim') || str.includes('yes') || str.includes('true') || str === '1') {
    return 'Sim'
  }
  
  return 'Não'
}

/**
 * Formata data para exibição
 */
export function formatDate(value: any): string {
  if (!value) return '-'
  
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return String(value)
    
    // Ajuste GMT-3
    date.setHours(date.getHours() - 3)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return String(value)
  }
}

