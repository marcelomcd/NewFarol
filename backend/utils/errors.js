/**
 * Classes de erro customizadas e utilitários de tratamento de erros
 * 
 * Segue as diretrizes de:
 * - Fail fast (validação imediata)
 * - Mensagens de erro acionáveis (não genéricas)
 * - Tratamento explícito de falhas
 */

/**
 * Erro de validação de entrada
 */
export class ValidationError extends Error {
  constructor(message, field = null, value = null) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = 400
    this.field = field
    this.value = value
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      ...(this.field && { field: this.field }),
    }
  }
}

/**
 * Erro de autenticação/autorização
 */
export class AuthenticationError extends Error {
  constructor(message = 'Token inválido ou ausente') {
    super(message)
    this.name = 'AuthenticationError'
    this.statusCode = 401
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
    }
  }
}

/**
 * Erro de recurso não encontrado
 */
export class NotFoundError extends Error {
  constructor(resource = 'Recurso', id = null) {
    const message = id ? `${resource} com ID ${id} não encontrado` : `${resource} não encontrado`
    super(message)
    this.name = 'NotFoundError'
    this.statusCode = 404
    this.resource = resource
    this.id = id
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
    }
  }
}

/**
 * Erro de integração externa (ex: Azure DevOps)
 */
export class ExternalServiceError extends Error {
  constructor(service, message, originalError = null) {
    super(`Erro ao comunicar com ${service}: ${message}`)
    this.name = 'ExternalServiceError'
    this.statusCode = 502
    this.service = service
    this.originalError = originalError
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      service: this.service,
    }
  }
}

/**
 * Valida número inteiro positivo
 */
export function validatePositiveInteger(value, fieldName = 'Valor') {
  const num = parseInt(value)
  if (isNaN(num) || num < 1) {
    throw new ValidationError(`${fieldName} deve ser um número inteiro positivo`, fieldName, value)
  }
  return num
}

/**
 * Valida número inteiro (pode ser zero ou negativo)
 */
export function validateInteger(value, fieldName = 'Valor') {
  const num = parseInt(value)
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} deve ser um número inteiro`, fieldName, value)
  }
  return num
}

/**
 * Valida string não vazia
 */
export function validateNonEmptyString(value, fieldName = 'Campo') {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} não pode estar vazio`, fieldName, value)
  }
  return value.trim()
}

/**
 * Valida enum/opção válida
 */
export function validateEnum(value, validOptions, fieldName = 'Campo') {
  if (!validOptions.includes(value)) {
    throw new ValidationError(
      `${fieldName} deve ser um dos seguintes valores: ${validOptions.join(', ')}`,
      fieldName,
      value
    )
  }
  return value
}

/**
 * Middleware de tratamento de erros para Express
 */
export function errorHandler(err, req, res, next) {
  // Se já foi enviada uma resposta, delegar para o handler padrão do Express
  if (res.headersSent) {
    return next(err)
  }

  // Erros conhecidos
  if (err.statusCode || err.status) {
    const statusCode = err.statusCode || err.status
    return res.status(statusCode).json(err.toJSON ? err.toJSON() : { error: err.message })
  }

  // Erro JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'AuthenticationError',
      message: 'Token inválido ou expirado',
    })
  }

  // Erro desconhecido - 500
  return res.status(500).json({
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor'
      : err.message,
    ...(process.env.DEBUG === 'true' && { stack: err.stack }),
  })
}
