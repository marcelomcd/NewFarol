import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clientsApi, featuresCountApi, filtersApi, Feature } from '../services/api'
import { normalizarStatus } from '../utils/statusNormalization'
import Tooltip from '../components/Tooltip/Tooltip'

const CLOSED_STATES = ['Closed', 'Resolved', 'Removed']
const CLOSED_STATES_TRANSLATED: Record<string, string> = {
  'Closed': 'Fechado',
  'Resolved': 'Resolvido',
  'Removed': 'Removido',
}

export default function CompletedProjects() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [clientFilter, setClientFilter] = useState<string>('')
  const [pmoFilter, setPmoFilter] = useState<string>('')
  const [responsibleFilter, setResponsibleFilter] = useState<string>('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  // Buscar dados (fonte canônica: WIQL -> hidratação no backend)
  const { data, isLoading, error } = useQuery({
    queryKey: ['features', 'completed'],
    queryFn: () => featuresCountApi.getClosedFeaturesWiql(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  // Buscar listas de filtros
  const { data: clientsList } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientsApi.getValidClients(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const { data: pmoList } = useQuery({
    queryKey: ['pmo-list'],
    queryFn: () => filtersApi.getPmoList(),
  })

  const { data: responsibleList } = useQuery({
    queryKey: ['responsible-list'],
    queryFn: () => filtersApi.getResponsibleList(),
  })

  // Filtrar projetos concluídos
  const completedProjects = useMemo(() => {
    if (!data?.items) return []
    return data.items.filter((item) => {
      const state = item.state || ''
      return CLOSED_STATES.includes(state) || state === 'Encerrado' || state === 'Fechado' || state === 'Resolvido' || state === 'Removido'
    })
  }, [data])

  // Status disponíveis para projetos concluídos
  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>()
    completedProjects.forEach((item) => {
      const state = item.state || ''
      if (CLOSED_STATES.includes(state)) {
        statusSet.add(CLOSED_STATES_TRANSLATED[state] || state)
      } else {
        const normalized = normalizarStatus(state)
        if (normalized === 'Encerrado' || normalized === 'Fechado' || normalized === 'Resolvido' || normalized === 'Removido') {
          statusSet.add(normalized)
        }
      }
    })
    return Array.from(statusSet).sort()
  }, [completedProjects])

  // Aplicar filtros
  const filteredProjects = useMemo(() => {
    let filtered = completedProjects

    // Busca geral (qualquer termo)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((item) => {
        const searchableText = [
          item.title,
          item.client,
          item.pmo,
          item.responsible,
          item.id.toString(),
          item.raw_fields_json?.Custom?.NProposta || '',
          item.raw_fields_json?.['Custom.NProposta'] || '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return searchableText.includes(term)
      })
    }

    // Filtro de Status
    if (statusFilter) {
      filtered = filtered.filter((item) => {
        const state = item.state || ''
        let translatedState = state
        if (CLOSED_STATES.includes(state)) {
          translatedState = CLOSED_STATES_TRANSLATED[state] || state
        } else {
          translatedState = normalizarStatus(state)
        }
        return translatedState === statusFilter
      })
    }

    // Filtro de Cliente
    if (clientFilter) {
      filtered = filtered.filter((item) => item.client === clientFilter)
    }

    // Filtro de PMO
    if (pmoFilter) {
      filtered = filtered.filter((item) => item.pmo === pmoFilter)
    }

    // Filtro de Responsável
    if (responsibleFilter) {
      filtered = filtered.filter((item) => item.responsible === responsibleFilter)
    }

    return filtered
  }, [completedProjects, searchTerm, statusFilter, clientFilter, pmoFilter, responsibleFilter])

  // Ordenar
  const sortedProjects = useMemo(() => {
    if (!sortConfig) return filteredProjects

    return [...filteredProjects].sort((a, b) => {
      let aValue: any = ''
      let bValue: any = ''

      if (sortConfig.key === 'numeroProposta') {
        aValue = a.raw_fields_json?.Custom?.NProposta || a.raw_fields_json?.['Custom.NProposta'] || ''
        bValue = b.raw_fields_json?.Custom?.NProposta || b.raw_fields_json?.['Custom.NProposta'] || ''
      } else if (sortConfig.key === 'status') {
        const aState = a.state || ''
        const bState = b.state || ''
        aValue = CLOSED_STATES.includes(aState) ? (CLOSED_STATES_TRANSLATED[aState] || aState) : normalizarStatus(aState)
        bValue = CLOSED_STATES.includes(bState) ? (CLOSED_STATES_TRANSLATED[bState] || bState) : normalizarStatus(bState)
      } else {
        aValue = a[sortConfig.key as keyof Feature] || ''
        bValue = b[sortConfig.key as keyof Feature] || ''
      }

      // Converter para string para comparação
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (sortConfig.direction === 'asc') {
        return aStr > bStr ? 1 : -1
      } else {
        return aStr < bStr ? 1 : -1
      }
    })
  }, [filteredProjects, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const getNumeroProposta = (item: Feature): string => {
    return item.raw_fields_json?.Custom?.NProposta || 
           item.raw_fields_json?.['Custom.NProposta'] || 
           '-'
  }

  const getTranslatedStatus = (item: Feature): string => {
    const state = item.state || ''
    if (CLOSED_STATES.includes(state)) {
      return CLOSED_STATES_TRANSLATED[state] || state
    }
    return normalizarStatus(state)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass dark:glass-dark p-6 rounded-lg text-center">
        <p className="text-red-500">Erro ao carregar projetos concluídos</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          ✅ Projetos Concluídos
        </h1>
        <div className="glass dark:glass-dark px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total: <span className="font-bold text-green-600 dark:text-green-400">{filteredProjects.length}</span>
          </span>
        </div>
      </div>

      {/* Busca */}
      <div className="glass dark:glass-dark p-4 rounded-lg">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white transition-all"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass dark:glass-dark p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
            >
              <option value="">Todos</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cliente
            </label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
            >
              <option value="">Todos</option>
              {clientsList?.clients?.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro PMO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              PMO
            </label>
            <select
              value={pmoFilter}
              onChange={(e) => setPmoFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
            >
              <option value="">Todos</option>
              {pmoList?.pmo?.map((pmo) => (
                <option key={pmo} value={pmo}>
                  {pmo}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Responsável
            </label>
            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
            >
              <option value="">Todos</option>
              {responsibleList?.responsible?.map((responsible) => (
                <option key={responsible} value={responsible}>
                  {responsible}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="glass dark:glass-dark rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-600/20 dark:bg-green-800/20">
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-green-600/30 transition-colors"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-2">
                    ID
                    {sortConfig?.key === 'id' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-green-600/30 transition-colors"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-2">
                    Título
                    {sortConfig?.key === 'title' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-green-600/30 transition-colors"
                  onClick={() => handleSort('client')}
                >
                  <div className="flex items-center gap-2">
                    Cliente
                    {sortConfig?.key === 'client' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-green-600/30 transition-colors"
                  onClick={() => handleSort('numeroProposta')}
                >
                  <div className="flex items-center gap-2">
                    Nº de Proposta
                    {sortConfig?.key === 'numeroProposta' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-green-600/30 transition-colors"
                  onClick={() => handleSort('responsible')}
                >
                  <div className="flex items-center gap-2">
                    Responsável
                    {sortConfig?.key === 'responsible' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-green-600/30 transition-colors"
                  onClick={() => handleSort('pmo')}
                >
                  <div className="flex items-center gap-2">
                    PMO
                    {sortConfig?.key === 'pmo' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-green-600/30 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortConfig?.key === 'status' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedProjects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => navigate(`/features/${project.id}`)}
                  className="hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {project.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Tooltip content={project.title || ''} position="top">
                      <div className="text-sm font-medium text-gray-900 dark:text-white max-w-md truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {project.title || 'Sem Título'}
                      </div>
                    </Tooltip>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.client || 'Sem Cliente'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {getNumeroProposta(project)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {project.responsible || 'Não atribuído'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {project.pmo || 'Não atribuído'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {getTranslatedStatus(project)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhum projeto concluído encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
