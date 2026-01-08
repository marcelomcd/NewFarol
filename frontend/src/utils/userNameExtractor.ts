/**
 * Utilitário para extrair e normalizar nomes de usuários.
 * 
 * Extrai nomes de diferentes formatos:
 * - Emails: "fulano.tal@empresa.com" -> "Fulano Tal"
 * - Objetos JSON com displayName
 * - Strings simples
 */
export function extractUserName(assignedTo: string | undefined | null): string {
  if (!assignedTo) {
    return 'Não atribuído'
  }

  if (assignedTo.includes('@')) {
    const emailParts = assignedTo.split('@')[0].split('.')
    return emailParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  try {
    const parsed = typeof assignedTo === 'string' ? JSON.parse(assignedTo) : assignedTo
    if (parsed?.displayName) {
      return parsed.displayName
    }
  } catch {
    // Não é JSON válido, continuar com o valor original
  }

  return assignedTo
}

