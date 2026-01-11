/**
 * Utilitários de validação e sanitização de entrada
 * 
 * Segue as diretrizes de segurança:
 * - Validação de entrada sempre (nunca confie em input externo)
 * - Sanitização de outputs
 * - Fail fast
 */

import { 
  ValidationError, 
  validatePositiveInteger, 
  validateInteger,
  validateNonEmptyString,
  validateEnum,
} from './errors.js'

/**
 * Valida e sanitiza parâmetros de paginação
 */
export function validatePaginationParams(page, limit) {
  const pageNum = validatePositiveInteger(page || '1', 'page')
  const limitNum = validatePositiveInteger(limit || '100', 'limit')
  
  // Limitar limite máximo para evitar sobrecarga
  const MAX_LIMIT = 1000
  if (limitNum > MAX_LIMIT) {
    throw new ValidationError(`limit não pode ser maior que ${MAX_LIMIT}`, 'limit', limitNum)
  }

  return { page: pageNum, limit: limitNum }
}

/**
 * Valida estado de work item
 */
export function validateState(state) {
  if (!state) return null
  
  const validStates = ['New', 'Active', 'Resolved', 'Closed', 'Removed', 'All']
  return validateEnum(state, validStates, 'state')
}

/**
 * Sanitiza string para busca (remove caracteres especiais perigosos)
 */
export function sanitizeSearchString(search) {
  if (!search || typeof search !== 'string') {
    return null
  }

  // Remover caracteres especiais que poderiam causar problemas em queries
  // Mantém apenas alfanuméricos, espaços e alguns caracteres especiais seguros
  const sanitized = search
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .substring(0, 100) // Limitar tamanho

  return sanitized.length > 0 ? sanitized : null
}

/**
 * Valida ID numérico
 */
export function validateId(id, resourceName = 'ID') {
  const numId = validateInteger(id, resourceName)
  if (numId < 1) {
    throw new ValidationError(`${resourceName} deve ser um número positivo`, resourceName, id)
  }
  return numId
}

/**
 * Sanitiza array de strings
 */
export function sanitizeStringArray(value) {
  if (!value) return null
  
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      // Se não for JSON válido, tratar como string única
      return [sanitizeSearchString(value)].filter(Boolean)
    }
  }

  if (!Array.isArray(value)) {
    return null
  }

  return value
    .filter(item => typeof item === 'string')
    .map(item => sanitizeSearchString(item))
    .filter(Boolean)
}

/**
 * Valida e sanitiza filtros de query
 */
export function validateQueryFilters(filters) {
  const sanitized = {}

  if (filters.client) {
    sanitized.client = sanitizeSearchString(filters.client)
  }

  if (filters.pmo) {
    sanitized.pmo = sanitizeSearchString(filters.pmo)
  }

  if (filters.responsible) {
    sanitized.responsible = sanitizeSearchString(filters.responsible)
  }

  if (filters.search) {
    sanitized.search = sanitizeSearchString(filters.search)
  }

  if (filters.state) {
    sanitized.state = validateState(filters.state)
  }

  if (filters.clients) {
    sanitized.clients = sanitizeStringArray(filters.clients)
  }

  return sanitized
}
