import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { featuresApi, projectsApi, Feature } from '../../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function FeaturesList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    project_id: '',
    state: '',
    client: '',
    pmo: '',
    responsible: '',
    search: '',
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['features', page, filters],
    queryFn: () => featuresApi.list({ ...filters, page, limit: 50 }),
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleExportCSV = () => {
    if (!data?.items) return

    const headers = ['ID', 'Título', 'Estado', 'Cliente', 'PMO', 'Responsável', 'Data Alteração']
    const rows = data.items.map((item) => [
      item.id,
      item.title,
      item.state,
      item.client || '',
      item.pmo || '',
      item.responsible || '',
      format(new Date(item.changed_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `features_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Erro ao carregar features: {error instanceof Error ? error.message : 'Erro desconhecido'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Features</h1>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="glass dark:glass-dark p-4 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Buscar..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
          <select
            value={filters.project_id}
            onChange={(e) => handleFilterChange('project_id', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="">Todos os projetos</option>
            {projectsData?.projects?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Estado"
            value={filters.state}
            onChange={(e) => handleFilterChange('state', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Cliente"
            value={filters.client}
            onChange={(e) => handleFilterChange('client', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="PMO"
            value={filters.pmo}
            onChange={(e) => handleFilterChange('pmo', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Responsável"
            value={filters.responsible}
            onChange={(e) => handleFilterChange('responsible', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="glass dark:glass-dark rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-100 dark:bg-blue-900">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">PMO</th>
                <th className="px-4 py-3 text-left">Responsável</th>
                <th className="px-4 py-3 text-left">Alterado em</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((item: Feature) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/features/${item.id}`)}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">{item.id}</td>
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded text-sm">
                      {item.state}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.client || '-'}</td>
                  <td className="px-4 py-3">{item.pmo || '-'}</td>
                  <td className="px-4 py-3">{item.responsible || '-'}</td>
                  <td className="px-4 py-3">
                    {format(new Date(item.changed_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {data?.pagination && (
          <div className="px-4 py-3 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Página {data.pagination.page} de {data.pagination.pages} ({data.pagination.total} itens)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page >= data.pagination.pages}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

