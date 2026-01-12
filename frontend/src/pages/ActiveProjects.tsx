import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clientsApi, featuresCountApi, filtersApi, Feature } from '../services/api'
import { normalizarStatus } from '../utils/statusNormalization'
import Tooltip from '../components/Tooltip/Tooltip'
// (sem acesso direto a api aqui; usamos clientsApi/featuresCountApi)

const CLOSED_STATES = ['Closed', 'Resolved', 'Done', 'Fechado', 'Concluído', 'Removed', 'Encerrado']

export default function ActiveProjects() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [clientFilter, setClientFilter] = useState<string>('')
  const [pmoFilter, setPmoFilter] = useState<string>('')
  const [responsibleFilter, setResponsibleFilter] = useState<string>('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  // Buscar dados (fonte canônica: WIQL -> hidratação no backend)
  const { data, isLoading, error } = useQuery({
    queryKey: ['features', 'active'],
    queryFn: () => featuresCountApi.getOpenFeaturesWiql(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  // Buscar listas de filtros
  const { data: statusList } = useQuery({
    queryKey: ['status-list'],
    queryFn: () => filtersApi.getStatusList(),
  })

  const { data: clientsList } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientsApi.getValidClients(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  // Funções auxiliares para filtros (igual ao Dashboard)
  const normalizeClientKey = (value?: string | null) => {
    if (!value) return ''
    return value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .trim()
  }

  const extractPMO = (item: Feature): string => {
    // 1) campo normalizado
    if (item.pmo && item.pmo.trim() !== '') return item.pmo.trim()

    // 2) raw_fields_json custom PMO
    const raw: any = (item as any).raw_fields_json
    if (raw) {
      const customPMO = raw['Custom.PMO'] || raw['Custom.Pmo']
      if (customPMO) {
        if (typeof customPMO === 'object' && customPMO.displayName && customPMO.displayName.trim() !== '') {
          return customPMO.displayName.trim()
        }
        if (typeof customPMO === 'string' && customPMO.trim() !== '') return customPMO.trim()
      }

      // 3) fallback AssignedTo
      const assignedTo = raw['System.AssignedTo']
      if (assignedTo && typeof assignedTo === 'object' && assignedTo.displayName && assignedTo.displayName.trim() !== '') {
        return assignedTo.displayName.trim()
      }
      if (typeof assignedTo === 'string' && assignedTo.trim() !== '') return assignedTo.trim()
    }

    // 4) fallback assigned_to (string)
    const assigned = (item as any).assigned_to
    if (assigned && typeof assigned === 'string' && assigned.trim() !== '') return assigned.trim()

    return 'Não atribuído'
  }

  const extractResponsavelCliente = (item: Feature): string => {
    // 0) campo já normalizado pelo backend
    const direct = (item as any).responsible
    if (direct && typeof direct === 'string' && direct.trim() !== '') return direct.trim()

    const raw: any = (item as any).raw_fields_json
    if (raw) {
      const rc = raw['Custom.ResponsavelCliente']
      if (rc) {
        if (typeof rc === 'object' && rc.displayName && rc.displayName.trim() !== '') return rc.displayName.trim()
        if (typeof rc === 'string' && rc.trim() !== '') return rc.trim()
      }
    }
    return 'Não atribuído'
  }

  // Filtrar projetos ativos
  const activeProjects = useMemo(() => {
    if (!data?.items) return []
    return data.items.filter((item: Feature) => {
      const normalizedState = normalizarStatus(item.state)
      return !CLOSED_STATES.includes(item.state) && normalizedState !== 'Encerrado'
    })
  }, [data])

  // Aplicar filtros
  const filteredProjects = useMemo(() => {
    let filtered = activeProjects

    // Busca geral (qualquer termo)
    if (searchTerm) {
      const normalize = (s: any) =>
        String(s || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
      const term = normalize(searchTerm)
      filtered = filtered.filter((item) => {
        const searchableText = [
          item.title,
          item.client,
          item.pmo,
          item.responsible,
          item.id.toString(),
          item.raw_fields_json?.Custom?.NProposta || '',
          item.raw_fields_json?.['Custom.NProposta'] || '',
          item.state,
        ]
          .filter(Boolean)
          .join(' ')
        return normalize(searchableText).includes(term)
      })
    }

    // Filtro de Status
    if (statusFilter) {
      filtered = filtered.filter((item) => normalizarStatus(item.state) === statusFilter)
    }

    // Filtro de Cliente (usar normalizeClientKey para comparação consistente)
    if (clientFilter) {
      const key = normalizeClientKey(clientFilter)
      filtered = filtered.filter((item) => normalizeClientKey(item.client) === key)
    }

    // Filtro de PMO (usar extractPMO para extrair corretamente)
    if (pmoFilter) {
      filtered = filtered.filter((item) => extractPMO(item) === pmoFilter)
    }

    // Filtro de Responsável (usar extractResponsavelCliente para extrair corretamente)
    if (responsibleFilter) {
      filtered = filtered.filter((item) => extractResponsavelCliente(item) === responsibleFilter)
    }

    return filtered
  }, [activeProjects, searchTerm, statusFilter, clientFilter, pmoFilter, responsibleFilter, normalizeClientKey, extractPMO, extractResponsavelCliente])

  // Gerar listas de filtros dinamicamente dos dados (igual ao Dashboard)
  const availablePMOs = useMemo(() => {
    const pmos = new Set(activeProjects.map((item) => extractPMO(item)).filter(Boolean))
    return Array.from(pmos).sort()
  }, [activeProjects, extractPMO])

  const availableResponsibles = useMemo(() => {
    const responsibles = new Set(activeProjects.map((item) => extractResponsavelCliente(item)).filter(Boolean))
    return Array.from(responsibles).sort()
  }, [activeProjects, extractResponsavelCliente])

  // Ordenar
  const sortedProjects = useMemo(() => {
    if (!sortConfig) return filteredProjects

    return [...filteredProjects].sort((a, b) => {
      let aValue: any = ''
      let bValue: any = ''

      if (sortConfig.key === 'numeroProposta') {
        aValue = a.raw_fields_json?.Custom?.NProposta || a.raw_fields_json?.['Custom.NProposta'] || ''
        bValue = b.raw_fields_json?.Custom?.NProposta || b.raw_fields_json?.['Custom.NProposta'] || ''
      } else {
        aValue = a[sortConfig.key as keyof Feature] || ''
        bValue = b[sortConfig.key as keyof Feature] || ''
      }

      // Verificar se são números
      const aNum = typeof aValue === 'number' ? aValue : parseFloat(String(aValue))
      const bNum = typeof bValue === 'number' ? bValue : parseFloat(String(bValue))
      const isANum = !isNaN(aNum) && isFinite(aNum) && String(aValue).trim() !== ''
      const isBNum = !isNaN(bNum) && isFinite(bNum) && String(bValue).trim() !== ''

      // Se ambos são números, ordenar numericamente
      if (isANum && isBNum) {
        if (sortConfig.direction === 'asc') {
          return aNum - bNum
        } else {
          return bNum - aNum
        }
      }

      // Se um é número e outro não, números primeiro (em ordem crescente quando asc)
      if (isANum && !isBNum) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (!isANum && isBNum) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }

      // Comparação alfabética (ignora maiúsculas/minúsculas e acentos)
      const normalize = (str: string) => String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const aStr = normalize(String(aValue))
      const bStr = normalize(String(bValue))

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr, 'pt-BR')
      } else {
        return bStr.localeCompare(aStr, 'pt-BR')
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass dark:glass-dark p-6 rounded-lg text-center">
        <p className="text-red-500">Erro ao carregar projetos ativos</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          📈 Projetos Ativos
        </h1>
        <div className="glass dark:glass-dark px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total: <span className="font-bold text-blue-600 dark:text-blue-400">{filteredProjects.length}</span>
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
            className="w-full px-4 py-3 pl-12 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
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
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">Todos</option>
              {statusList?.status?.map((status) => (
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
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
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
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">Todos</option>
              {availablePMOs.map((pmo) => (
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
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">Todos</option>
              {availableResponsibles.map((responsible) => (
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
            <thead className="bg-blue-600/20 dark:bg-blue-800/20">
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30 transition-colors"
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
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30 transition-colors"
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
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30 transition-colors"
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
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30 transition-colors"
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
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30 transition-colors"
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
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30 transition-colors"
                  onClick={() => handleSort('pmo')}
                >
                  <div className="flex items-center gap-2">
                    PMO
                    {sortConfig?.key === 'pmo' && (
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
                  className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {project.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Tooltip content={project.title || ''} position="top">
                      <div className="text-sm font-medium text-gray-900 dark:text-white max-w-md truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhum projeto ativo encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
