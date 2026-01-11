/**
 * Sistema de logging estruturado
 * 
 * Segue as diretrizes de observabilidade:
 * - Logs estruturados (formato JSON em produção)
 * - Níveis apropriados (DEBUG, INFO, WARN, ERROR)
 * - Contexto suficiente para debugging
 * - Sem dados sensíveis (senhas, tokens, PII)
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

const CURRENT_LEVEL = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
  : LOG_LEVELS.INFO

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Formata log estruturado
 */
function formatLog(level, message, context = {}) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  }

  if (isDevelopment) {
    // Em desenvolvimento, exibir formato legível
    return `[${timestamp}] [${level}] ${message}${Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : ''}`
  }

  // Em produção, retornar JSON estruturado
  return JSON.stringify(logEntry)
}

/**
 * Logger estruturado
 */
export const logger = {
  debug(message, context = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.debug(formatLog('DEBUG', message, context))
    }
  },

  info(message, context = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.log(formatLog('INFO', message, context))
    }
  },

  warn(message, context = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message, context))
    }
  },

  error(message, error = null, context = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      const errorContext = {
        ...context,
      }

      if (error) {
        errorContext.error = {
          message: error.message,
          name: error.name,
          ...(process.env.DEBUG === 'true' && { stack: error.stack }),
        }
      }

      console.error(formatLog('ERROR', message, errorContext))
    }
  },
}

export default logger
