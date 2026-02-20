import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { featuresCountApi } from '../services/api'
import Tooltip from '../components/Tooltip/Tooltip'

export default function CompletedTasks() {
  const [searchTerm, setSearchTerm] = useState('')
  const [assignedFilter, setAssignedFilter] = useState<string>('')
  const [clientFilter, setClientFilter] = useState<string>('')
  const [responsibleFilter, setResponsibleFilter] = useState<string>('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', 'closed'],
    queryFn: () => featuresCountApi.getTasksClosedWiql(),
    staleTime: 300_000,
    gcTime: 600_000,
    refetchOnWindowFocus: false,
  })

  const completedTasks = useMemo(() => data?.items ?? [], [data])

  const filteredTasks = useMemo(() => {
    let filtered = completedTasks

    if (searchTerm) {
      const term = searchTerm
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
      filtered = filtered.filter((t) => {
        const searchable = [t.title, t.assigned_to, t.client, t.responsible, t.id.toString()].filter(Boolean).join(' ')
        return searchable
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(term)
      })
    }

    if (assignedFilter) {
      filtered = filtered.filter((t) => (t.assigned_to || '').trim() === assignedFilter)
    }

    if (clientFilter) {
      filtered = filtered.filter((t) => (t.client || '').trim() === clientFilter)
    }

    if (responsibleFilter) {
      filtered = filtered.filter((t) => (t.responsible || '').trim() === responsibleFilter)
    }

    return filtered
  }, [completedTasks, searchTerm, assignedFilter, clientFilter, responsibleFilter])

  const availableAssignees = useMemo(() => {
    const set = new Set(completedTasks.map((t) => (t.assigned_to || 'Não atribuído').trim()).filter(Boolean))
    return Array.from(set).sort()
  }, [completedTasks])

  const availableClients = useMemo(() => {
    const set = new Set(completedTasks.map((t) => (t.client || '–').trim()).filter((v) => v && v !== '–'))
    return Array.from(set).sort()
  }, [completedTasks])

  const availableResponsibles = useMemo(() => {
    const set = new Set(completedTasks.map((t) => (t.responsible || '–').trim()).filter((v) => v && v !== '–'))
    return Array.from(set).sort()
  }, [completedTasks])

  const sortedTasks = useMemo(() => {
    if (!sortConfig) return filteredTasks
    return [...filteredTasks].sort((a, b) => {
      const key = sortConfig.key
      let aVal: string | number = (a as any)[key] ?? ''
      let bVal: string | number = (b as any)[key] ?? ''
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortConfig.direction === 'asc' ? cmp : -cmp
    })
  }, [filteredTasks, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    )
  }

  const formatDate = (s?: string | null) => {
    if (!s) return '-'
    try {
      return new Date(s).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return '-'
    }
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
        <p className="text-red-500">Erro ao carregar tasks concluídas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          ✅ Task&apos;s Concluídas
        </h1>
        <div className="glass dark:glass-dark px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total: <span className="font-bold text-blue-600 dark:text-blue-400">{filteredTasks.length}</span>
          </span>
        </div>
      </div>

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
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="glass dark:glass-dark p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Executante</label>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">Todos</option>
              {availableAssignees.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cliente</label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">Todos</option>
              {availableClients.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resp. Cliente</label>
            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">Todos</option>
              {availableResponsibles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="glass dark:glass-dark rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600/20 dark:bg-blue-800/20">
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30"
                  onClick={() => handleSort('id')}
                >
                  ID {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30"
                  onClick={() => handleSort('title')}
                >
                  Título {sortConfig?.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30"
                  onClick={() => handleSort('assigned_to')}
                >
                  Executante {sortConfig?.key === 'assigned_to' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30"
                  onClick={() => handleSort('client')}
                >
                  Cliente {sortConfig?.key === 'client' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30"
                  onClick={() => handleSort('responsible')}
                >
                  Resp. Cliente {sortConfig?.key === 'responsible' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-blue-600/30"
                  onClick={() => handleSort('changed_date')}
                >
                  Alterada em {sortConfig?.key === 'changed_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTasks.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={t.web_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {t.id}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <Tooltip content={t.title || ''} position="top">
                      <a
                        href={t.web_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 dark:text-white max-w-md truncate block hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {t.title || 'Sem título'}
                      </a>
                    </Tooltip>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{t.assigned_to || 'Não atribuído'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{t.client || '–'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{t.responsible || '–'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{formatDate(t.changed_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma task concluída encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
