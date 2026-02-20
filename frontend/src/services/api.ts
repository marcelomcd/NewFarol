import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 segundos de timeout global (requisições ao Azure DevOps podem demorar)
})

// Interceptor para adicionar token automaticamente nas requisições
api.interceptors.request.use(
  (config) => {
    // Obter token do localStorage
    const token = localStorage.getItem('auth_token')
    if (token) {
      // Adicionar token como query parameter para endpoints que precisam
      // O backend espera o token como query param 'token'
      if (config.params) {
        config.params.token = token
      } else {
        config.params = { token }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de conexão
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Tratar erros de conexão de forma mais amigável
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.warn('Backend não disponível:', error.message)
    }
    
    // Não redirecionar para login em caso de rate limit (429)
    // Rate limit não é um erro de autenticação
    if (error.response?.status === 429) {
      console.warn('Rate limit atingido:', error.message)
      // Não fazer nada especial, apenas rejeitar a promise
      // O componente que chamou pode tratar o erro adequadamente
    }
    
    return Promise.reject(error)
  }
)

export interface Feature {
  id: number
  project_id: string
  title: string
  state: string
  work_item_type: string
  changed_date: string
  created_date: string
  created_by?: string
  changed_by?: string
  area_path?: string
  assigned_to?: string
  tags?: string[]
  client?: string
  pmo?: string
  responsible?: string
  farol_status?: string  // Sem Problema, Com Problema, Problema Crítico, Indefinido
  board_column?: string  // BoardColumn do Azure DevOps (para identificar Backlog)
  target_date?: string  // Data de término (Microsoft.VSTS.Scheduling.TargetDate)
  start_date?: string   // Data de início (Microsoft.VSTS.Scheduling.StartDate)
  raw_fields_json?: Record<string, any>  // Campos brutos do Azure DevOps para acesso a Custom.ResponsavelCliente, etc.
}

export interface FeatureDetail extends Feature {
  raw_fields_json: Record<string, any>
  fields_formatted?: Record<string, any>  // Campos formatados (formato plano)
  fields_formatted_by_category?: {
    customizados: Record<string, any>
    microsoft: Record<string, any>
    planejamento: Record<string, any>
    organizacao: Record<string, any>
    responsaveis: Record<string, any>
    identificacao: Record<string, any>
    kanban: Record<string, any>
  }
  checklist_by_transition?: Record<string, Array<{
    label: string
    value: string | null
  }>>
  iteration_path?: string
  description?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface Comment {
  data: string
  data_formatada: string
  conteudo: string
  responsavel: string
}

export interface RevisionsResponse {
  feature_id: number
  revisions_count: number
  comments: Comment[]
}

export interface WorkItemRelation {
  id: number
  title: string
  work_item_type: string
  state: string
}

export interface RelationsResponse {
  feature_id: number
  children: WorkItemRelation[]
  children_count: number
}

export interface FeatureChildrenResponse {
  feature_id: number
  user_stories: Array<{
    id: number
    title: string
    work_item_type: string
    state: string
    created_date: string
    changed_date: string
    created_by: string
    changed_by: string
    assigned_to: string
    area_path: string
    iteration_path: string
    description: string
    tags: string[]
    url: string
    web_url: string
    story_points?: number
    priority?: number
    effort?: number
    raw_fields_json: Record<string, any>
  }>
  tasks: Array<{
    id: number
    title: string
    work_item_type: string
    state: string
    created_date: string
    changed_date: string
    created_by: string
    changed_by: string
    assigned_to: string
    area_path: string
    iteration_path: string
    description: string
    tags: string[]
    url: string
    web_url: string
    activity?: string
    remaining_work?: number
    completed_work?: number
    original_estimate?: number
    raw_fields_json: Record<string, any>
  }>
  user_stories_count: number
  tasks_count: number
  total_count: number
}

export interface Attachment {
  url: string
  attributes: Record<string, any>
}

export interface Link {
  type: string
  url: string
  attributes: Record<string, any>
}

export const featuresApi = {
  list: async (params?: {
    project_id?: string
    state?: string
    client?: string
    pmo?: string
    responsible?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Feature>> => {
    const response = await api.get('/features', { params })
    return response.data
  },

  get: async (id: number): Promise<FeatureDetail> => {
    const response = await api.get(`/features/${id}`)
    return response.data
  },

  getRevisions: async (id: number): Promise<RevisionsResponse> => {
    const response = await api.get(`/features/${id}/revisions`)
    return response.data
  },

  getRelations: async (id: number): Promise<RelationsResponse> => {
    const response = await api.get(`/features/${id}/relations`)
    return response.data
  },

  getChildren: async (id: number): Promise<FeatureChildrenResponse> => {
    const response = await api.get(`/features/${id}/children`)
    return response.data
  },

  getAttachments: async (id: number): Promise<{ feature_id: number; attachments: Attachment[] }> => {
    const response = await api.get(`/features/${id}/attachments`)
    return response.data
  },

  getLinks: async (id: number): Promise<{ feature_id: number; links: Link[] }> => {
    const response = await api.get(`/features/${id}/links`)
    return response.data
  },

  getFields: async (id: number, category?: 'flat' | 'category'): Promise<{
    feature_id: number
    fields?: Record<string, any>
    fields_flat?: Record<string, any>
    fields_by_category?: {
      customizados: Record<string, any>
      microsoft: Record<string, any>
      planejamento: Record<string, any>
      organizacao: Record<string, any>
      responsaveis: Record<string, any>
      identificacao: Record<string, any>
      kanban: Record<string, any>
    }
  }> => {
    const params = category ? { category } : {}
    const response = await api.get(`/features/${id}/fields`, { params })
    return response.data
  },
}

export const projectsApi = {
  list: async () => {
    const response = await api.get('/projects')
    return response.data
  },
}

export const reportsApi = {
  execute: async (type: string, days?: number, filters?: Record<string, any>) => {
    const response = await api.post('/reports/execute', {
      type,
      days,
      filters,
    })
    return response.data
  },
}

export const clientsApi = {
  getValidClients: async (): Promise<{ clients: string[]; count: number }> => {
    // Backend expõe esta rota como /api/clients/valid (não /features/clients/valid)
    const response = await api.get('/clients/valid')
    return response.data
  },
}

export const featuresCountApi = {
  getOpenCount: async (): Promise<{ count: number; source: string }> => {
    const response = await api.get('/features/open/count')
    return response.data
  },
  getCountsWiql: async (): Promise<{ 
    total: number
    open: number
    overdue: number
    near_deadline: number
    source: string
  }> => {
    const response = await api.get('/features/counts/wiql')
    return response.data
  },
  getOpenFeaturesWiql: async (): Promise<{ 
    items: Feature[]
    count: number
    source: string
  }> => {
    const response = await api.get('/features/open/wiql')
    return response.data
  },
  getClosedFeaturesWiql: async (): Promise<{ 
    items: Feature[]
    count: number
    source: string
  }> => {
    const response = await api.get('/features/closed/wiql')
    return response.data
  },
  getNearDeadlineFeaturesWiql: async (days: number = 7): Promise<{
    items: Feature[]
    count: number
    source: string
    days: number
  }> => {
    const response = await api.get('/features/near-deadline/wiql', { params: { days } })
    return response.data
  },
  getFeaturesByStateWiql: async (): Promise<{ 
    items: Feature[]
    count_by_state: Record<string, number>
    source: string
  }> => {
    const response = await api.get('/features/by-state/wiql')
    return response.data
  },
  getFeaturesByFarolWiql: async (): Promise<{ 
    items: Feature[]
    count_by_farol: Record<string, number>
    source: string
  }> => {
    const response = await api.get('/features/by-farol/wiql')
    return response.data
  },
  /** Tasks abertas (New, Active) - mesmo padrão de Features: client, assigned_to do Parent */
  getTasksOpenWiql: async (): Promise<{ items: Task[]; count: number; source: string }> => {
    const response = await api.get('/features/tasks/open/wiql')
    return response.data
  },
  /** Tasks fechadas (Closed) - mesmo padrão de Features */
  getTasksClosedWiql: async (): Promise<{ items: Task[]; count: number; source: string }> => {
    const response = await api.get('/features/tasks/closed/wiql')
    return response.data
  },
}

export const azdoApi = {
  /**Payload consolidado (WIQL -> IDs -> hidratação) pronto para dashboard/PowerBI. */
  getConsolidated: async (params?: { days_near_deadline?: number; cache_seconds?: number }) => {
    const response = await api.get('/azdo/consolidated', { params })
    return response.data
  },
  /**Contagens de tasks abertas/fechadas por mês. Projetos calculados no frontend. include_items=true retorna itens para drill-down. */
  getCountsByMonth: async (
    month: number,
    year: number,
    includeItems = false
  ): Promise<{
    month: number
    year: number
    tasks_opened: number
    tasks_closed: number
    tasks_opened_items?: Array<{ id: number; title: string; state: string; changed_date: string; raw_fields_json?: { work_item_type: string; web_url: string } }>
    tasks_closed_items?: Array<{ id: number; title: string; state: string; changed_date: string; raw_fields_json?: { work_item_type: string; web_url: string } }>
  }> => {
    const params: Record<string, unknown> = { month, year }
    if (includeItems) params.include_items = 'true'
    const response = await api.get('/azdo/counts-by-month', { params })
    return response.data
  },
}

export const filtersApi = {
  getStatusList: async (): Promise<{ status: string[]; count: number }> => {
    const response = await api.get('/features/status/list')
    return response.data
  },
  getPmoList: async (): Promise<{ pmo: string[]; count: number }> => {
    const response = await api.get('/features/pmo/list')
    return response.data
  },
  getResponsibleList: async (): Promise<{ responsible: string[]; count: number }> => {
    const response = await api.get('/features/responsible/list')
    return response.data
  },
}

export interface Bug {
  id: number
  title: string
  state: string
  assigned_to: string
  created_date: string
  changed_date: string
  priority?: number
  severity: string
  repro_steps: string
  url: string
  web_url: string
}

export interface Task {
  id: number
  title: string
  state: string
  assigned_to: string
  created_date: string
  changed_date: string
  target_date?: string
  days_overdue?: number
  remaining_work?: number
  completed_work?: number
  original_estimate?: number
  activity: string
  url: string
  web_url: string
  /** Cliente do Parent (Feature/User Story) */
  client?: string | null
  /** Responsável Cliente do Parent (Feature/User Story) */
  responsible?: string | null
}

export interface UserStory {
  id: number
  title: string
  state: string
  assigned_to: string
  created_date: string
  changed_date: string
  story_points?: number
  priority?: number
  effort?: number
  url: string
  web_url: string
}

export const workItemsApi = {
  getBugs: async (params?: { state?: string; assigned_to?: string }): Promise<{ bugs: Bug[]; count: number }> => {
    const response = await api.get('/work-items/bugs', { params })
    return response.data
  },
  getBugsSummary: async (): Promise<{ total: number; by_state: Record<string, number>; by_priority: Record<string, number>; by_severity: Record<string, number> }> => {
    const response = await api.get('/work-items/bugs/summary')
    return response.data
  },
  getTasks: async (params?: { state?: string; assigned_to?: string; overdue_only?: boolean }): Promise<{ tasks: Task[]; count: number }> => {
    const response = await api.get('/work-items/tasks', { params })
    return response.data
  },
  getTasksSummary: async (): Promise<{ total: number; by_state: Record<string, number>; overdue_count: number; by_assigned_to: Record<string, number> }> => {
    const response = await api.get('/work-items/tasks/summary')
    return response.data
  },
  getUserStories: async (params?: { state?: string; assigned_to?: string }): Promise<{ user_stories: UserStory[]; count: number }> => {
    const response = await api.get('/work-items/user-stories', { params })
    return response.data
  },
  getWorkItemsByType: async (): Promise<{ by_type: Record<string, number>; total: number }> => {
    const response = await api.get('/work-items/by-type')
    return response.data
  },
  getOverdueFeatures: async (): Promise<{ features: Feature[]; count: number }> => {
    console.log('[workItemsApi] Buscando features atrasadas...')
    try {
      const response = await api.get('/work-items/features/overdue')
      console.log('[workItemsApi] Features atrasadas recebidas:', {
        count: response.data?.count,
        featuresLength: response.data?.features?.length,
      })
      return response.data
    } catch (error: any) {
      console.error('[workItemsApi] Erro ao buscar features atrasadas:', error)
      throw error
    }
  },
  getNearDeadlineFeatures: async (days?: number): Promise<{ features: Feature[]; count: number }> => {
    const response = await api.get('/work-items/features/near-deadline', { params: { days } })
    return response.data
  },
  getPlanningOverdueFeatures: async (): Promise<{ features: Feature[]; count: number }> => {
    const response = await api.get('/work-items/features/planning-overdue')
    return response.data
  },
  getFeaturesWithHoursAlerts: async (): Promise<{ features: any[]; count: number }> => {
    const response = await api.get('/work-items/features/hours-alerts')
    return response.data
  },
  getFeaturesEstourados: async (): Promise<{ features: any[]; count: number }> => {
    const response = await api.get('/work-items/features/estourados')
    return response.data
  },
  getBurndownData: async (days?: number): Promise<{
    dates: string[]
    remaining: number[]
    completed: number[]
    total_scope: number[]
    stories_remaining: number
    completed_percent: number
    average_burndown: number
    total_scope_change: number
    data: Array<{ date: string; remaining: number; completed: number; total_scope: number }>
  }> => {
    const response = await api.get('/work-items/burndown', { params: { days } })
    return response.data
  },
}

// ⚠️ REMOVIDO: chamadosApi foi removido pois o ServiceUp agora é backend independente (Node.js)
// O ServiceUp frontend (porta 5174) faz requisições diretamente para o ServiceUp backend (porta 3000)
// Não há mais necessidade de chamadas de chamados através do backend New Farol
// Se você precisar fazer chamadas para o ServiceUp, use diretamente o backend ServiceUp em http://localhost:3000/api

export const featuresAnalyticsApi = {
  getCriadas: async (month?: number | null, year?: number | null, startDate?: string | null, endDate?: string | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (month !== null && month !== undefined) params.month = month
    if (year !== null && year !== undefined) params.year = year
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/criadas', { params })
    return response
  },

  getAbertoFechado: async (month?: number | null, year?: number | null, startDate?: string | null, endDate?: string | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (month !== null && month !== undefined) params.month = month
    if (year !== null && year !== undefined) params.year = year
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/aberto-fechado', { params })
    return response
  },

  getDashboardStatus: async (featureId?: number | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (featureId) params.featureId = featureId
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/dashboard/status', { params })
    return response
  },

  getDashboardTempoAberto: async (featureId?: number | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (featureId) params.featureId = featureId
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/dashboard/tempo-aberto', { params })
    return response
  },

  getDashboardUltimaAtualizacao: async (featureId?: number | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (featureId) params.featureId = featureId
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/dashboard/ultima-atualizacao', { params })
    return response
  },

  getDashboardDetalhes: async (status?: string | null, tempoAberto?: string | null, ultimaAtualizacao?: string | null, responsavel?: string | null, featureId?: number | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (status) params.status = status
    if (tempoAberto) params.tempoAberto = tempoAberto
    if (ultimaAtualizacao) params.ultimaAtualizacao = ultimaAtualizacao
    if (responsavel) params.responsavel = responsavel
    if (featureId) params.featureId = featureId
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/dashboard/detalhes', { params })
    return response
  },

  getDashboardCausaRaiz: async (featureId?: number | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (featureId) params.featureId = featureId
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/dashboard/causa-raiz', { params })
    return response
  },

  getDashboardEmAndamento: async (featureId?: number | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (featureId) params.featureId = featureId
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/dashboard/em-andamento', { params })
    return response
  },

  getPorCliente: async (month?: number | null, year?: number | null, startDate?: string | null, endDate?: string | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (month !== null && month !== undefined) params.month = month
    if (year !== null && year !== undefined) params.year = year
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/por-cliente', { params })
    return response
  },

  getPorProjeto: async (month?: number | null, year?: number | null, startDate?: string | null, endDate?: string | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (month !== null && month !== undefined) params.month = month
    if (year !== null && year !== undefined) params.year = year
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/por-projeto', { params })
    return response
  },

  getPorResponsavel: async (month?: number | null, year?: number | null, startDate?: string | null, endDate?: string | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (month !== null && month !== undefined) params.month = month
    if (year !== null && year !== undefined) params.year = year
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/por-responsavel', { params })
    return response
  },

  getSLA: async (month?: number | null, year?: number | null, startDate?: string | null, endDate?: string | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (month !== null && month !== undefined) params.month = month
    if (year !== null && year !== undefined) params.year = year
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/sla', { params })
    return response
  },

  getSLAResponsavel: async (month?: number | null, year?: number | null, startDate?: string | null, endDate?: string | null, clientFilter?: string | null, clients?: string[] | null, pmoFilter?: string | null, pmo?: string[] | null) => {
    const params: Record<string, any> = {}
    if (month !== null && month !== undefined) params.month = month
    if (year !== null && year !== undefined) params.year = year
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (clientFilter) params.clientFilter = clientFilter
    if (clients) params.clients = JSON.stringify(clients)
    if (pmoFilter) params.pmoFilter = pmoFilter
    if (pmo) params.pmo = JSON.stringify(pmo)
    const response = await api.get('/features/sla-responsavel', { params })
    return response
  },

  getTop20Clientes: async (month?: number | null, year?: number | null, startDate?: string | null, endDate?: string | null) => {
    const params: Record<string, any> = {}
    if (month !== null && month !== undefined) params.month = month
    if (year !== null && year !== undefined) params.year = year
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    const response = await api.get('/features/top-20-clientes', { params })
    return response
  },

  getListaResponsaveis: async () => {
    const response = await api.get('/features/lista-responsaveis')
    return response
  },
}

export default api

