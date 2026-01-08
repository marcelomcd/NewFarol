/**API v2 - Arquitetura limpa, consumo apenas de endpoints do backend.*/
import api from './api'

export interface Client {
  name: string
}

export interface Feature {
  id: number
  title: string
  state: string
  normalized_state: string
  client: string | null
  pmo: string | null
  target_date?: string
  board_column?: string
  farol_status?: string
  changed_date: string
  created_date: string
  tags: string[]
}

export interface FeaturesResponse {
  items: Feature[]
  count: number
  source: string
}

export interface ClientsResponse {
  clients: string[]
  count: number
  source: string
}

export interface FeaturesCountResponse {
  total: number
  open: number
  source: string
}

export const clientsApi = {
  /**Obtém lista de clientes válidos extraídos dos Epics em aberto.*/
  getClients: async (): Promise<ClientsResponse> => {
    const response = await api.get('/v2/clients')
    return response.data
  },
}

export const featuresApiV2 = {
  /**Lista Features em aberto do projeto.*/
  list: async (params?: { client?: string }): Promise<FeaturesResponse> => {
    const response = await api.get('/v2/features', { params })
    return response.data
  },

  /**Obtém contagens de Features em aberto.*/
  getCounts: async (): Promise<FeaturesCountResponse> => {
    const response = await api.get('/v2/features/counts')
    return response.data
  },
}

