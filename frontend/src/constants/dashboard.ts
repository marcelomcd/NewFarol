/**
 * Constantes do Dashboard.
 * 
 * Centraliza todos os valores mágicos e configurações em um único local.
 */

// Limites de exibição
export const DISPLAY_LIMITS = {
  MAX_ITEMS_PER_TABLE: 20,
  MAX_CHART_ITEMS: 10,
  MAX_FEATURES_PER_PAGE: 1000,
  MAX_RESPONSIBLE_IN_CHART: 10,
  MAX_CLIENTS_IN_CHART: 10,
} as const

// Thresholds de alerta
export const ALERT_THRESHOLDS = {
  PERCENTAGE_WARNING: 80,
  PERCENTAGE_CRITICAL: 100,
  DAYS_NEAR_DEADLINE: 7,
  HOURS_ALERT_THRESHOLD: 90,
} as const

// Tempos de cache
export const CACHE_CONFIG = {
  TTL_SECONDS: 300,  // 5 minutos
  STALE_TIME_MS: 0,  // Sempre considerar stale (força refetch)
  GC_TIME_MS: 0,  // Não manter em cache após unmount
} as const

// Timeouts de API
export const API_TIMEOUTS = {
  DEFAULT_MS: 30000,  // 30 segundos
  WIQL_QUERY_MS: 45000,  // 45 segundos (queries podem ser lentas)
  EXPORT_MS: 120000,  // 2 minutos (export pode ser demorado)
} as const

// Estados excluídos
export const EXCLUDED_STATES = ['Encerrado', 'Em Garantia'] as const

// Estados que não aparecem nos cards
export const HIDDEN_CARD_STATES = ['Active', 'Sem Estado', 'Removed'] as const

// Ordem dos status
export const STATUS_ORDER = [
  "Em Aberto",
  "Em Planejamento",
  "Em Andamento",
  "Projeto em Fase Crítica",
  "Homologação Interna",
  "Em Homologação",
  "Em Fase de Encerramento",
  "Em Garantia",
  "Pausado Pelo Cliente",
  "Encerrado",
] as const

// Cores dos gráficos
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  PURPLE: '#8b5cf6',
  INDIGO: '#6366f1',
} as const

// Cores do Farol
export const FAROL_COLORS = {
  'Sem Problema': CHART_COLORS.SUCCESS,
  'Com Problema': CHART_COLORS.WARNING,
  'Problema Crítico': CHART_COLORS.DANGER,
  'Indefinido': '#9ca3af',
} as const

// Contagem esperada de Features (para validação)
export const EXPECTED_COUNTS = {
  OPEN_FEATURES: 135,  // Valor esperado do WIQL
} as const

// Mensagens de erro
export const ERROR_MESSAGES = {
  NO_DATA: 'Nenhum dado disponível',
  LOADING_ERROR: 'Erro ao carregar dados',
  CONNECTION_ERROR: 'Erro de conexão com o servidor',
  WIQL_MISMATCH: 'Atenção: Dados WIQL diferentes do esperado',
} as const

