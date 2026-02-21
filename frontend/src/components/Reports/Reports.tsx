import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const toYyyyMmDd = (d: Date) => format(d, 'yyyy-MM-dd')

export default function Reports() {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [reportType, setReportType] = useState('closed_in_days')
  const [dateDe, setDateDe] = useState(toYyyyMmDd(firstOfMonth))
  const [dateAte, setDateAte] = useState(toYyyyMmDd(lastOfMonth))
  const [filters, setFilters] = useState({
    project_id: '',
    state: '',
    client: '',
    pmo: '',
    responsible: '',
  })

  const needsDateRange =
    reportType === 'closed_in_days' ||
    reportType === 'new_items' ||
    reportType === 'recent_changes'

  const isGrouped =
    reportType === 'by_pmo' || reportType === 'by_client' || reportType === 'by_responsible'

  const mutation = useMutation({
    mutationFn: () =>
      reportsApi.execute(reportType, {
        dateDe: needsDateRange ? dateDe : undefined,
        dateAte: needsDateRange ? dateAte : undefined,
        filters,
      }),
  })

  const handleExecute = () => {
    mutation.mutate()
  }

  const handleExportCSV = () => {
    if (!mutation.data) return

    const data = mutation.data.data || []
    if (Array.isArray(data) && data.length === 0 && typeof data !== 'object') return

    let headers: string[] = []
    let rows: any[] = []

    if (Array.isArray(data)) {
      headers = Object.keys(data[0] || {})
      rows = data
    } else if (typeof data === 'object') {
      if (isGrouped) {
        headers = ['Nome']
        rows = Object.keys(data).map((name) => ({ Nome: name }))
      } else {
        const allRows: any[] = []
        Object.entries(data).forEach(([group, items]) => {
          if (Array.isArray(items) && items.length > 0) {
            if (headers.length === 0) headers = ['Grupo', ...Object.keys(items[0])]
            items.forEach((item: any) => allRows.push([group, ...Object.values(item)]))
          }
        })
        rows = allRows
      }
    }

    const csv = [headers, ...rows.map((row) => (Array.isArray(row) ? row : Object.values(row)))]
      .map((row) => row.map((cell: any) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const renderResults = () => {
    const data = mutation.data?.data
    if (!data) return null

    if (isGrouped && typeof data === 'object' && !Array.isArray(data)) {
      const list = Object.keys(data)
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {reportType === 'by_pmo' && 'Lista de PMOs (Assigned To dos Projetos)'}
            {reportType === 'by_client' && 'Lista de Clientes dos Projetos'}
            {reportType === 'by_responsible' && 'Lista de Responsáveis dos Projetos'}
          </p>
          <ul className="space-y-1 max-h-96 overflow-y-auto">
            {list.map((name) => (
              <li
                key={name}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-800 dark:text-gray-200"
              >
                {name}
              </li>
            ))}
          </ul>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Total: {list.length} {reportType === 'by_pmo' ? 'PMOs' : reportType === 'by_client' ? 'Clientes' : 'Responsáveis'}
          </div>
        </div>
      )
    }

    if (Array.isArray(data)) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-100 dark:bg-blue-900">
              <tr>
                {Object.keys(data[0] || {}).map((key) => (
                  <th key={key} className="px-4 py-3 text-left">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                  {Object.values(item).map((value: any, vIdx: number) => (
                    <td key={vIdx} className="px-4 py-3">
                      {typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)
                        ? format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Total: {mutation.data?.count ?? data.length} itens
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {Object.entries(data as Record<string, any>).map(([group, items]: [string, any]) => (
          <div key={group} className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">{group}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-100 dark:bg-blue-900">
                  <tr>
                    {Array.isArray(items) && items.length > 0
                      ? Object.keys(items[0]).map((key) => (
                          <th key={key} className="px-4 py-3 text-left">
                            {key}
                          </th>
                        ))
                      : null}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(items) &&
                    items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                        {Object.values(item).map((value: any, vIdx: number) => (
                          <td key={vIdx} className="px-4 py-3">
                            {typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)
                              ? format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Total: {mutation.data?.groups || 0} grupos
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Relatórios</h1>

      <div className="glass dark:glass-dark p-6 rounded-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Tipo de Relatório
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          >
            <option value="closed_in_days">Itens Fechados no período</option>
            <option value="new_items">Novos Itens no período</option>
            <option value="recent_changes">Itens Atualizados no período</option>
            <option value="by_pmo">Agrupados por PMO</option>
            <option value="by_client">Agrupados por Cliente</option>
            <option value="by_responsible">Agrupados por Responsável</option>
          </select>
        </div>

        {needsDateRange && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                De (DD/MM/AAAA)
              </label>
              <input
                type="date"
                value={dateDe}
                onChange={(e) => setDateDe(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Até (DD/MM/AAAA)
              </label>
              <input
                type="date"
                value={dateAte}
                onChange={(e) => setDateAte(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Projeto ID"
            value={filters.project_id}
            onChange={(e) => setFilters((prev) => ({ ...prev, project_id: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="Estado"
            value={filters.state}
            onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="Cliente"
            value={filters.client}
            onChange={(e) => setFilters((prev) => ({ ...prev, client: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="PMO"
            value={filters.pmo}
            onChange={(e) => setFilters((prev) => ({ ...prev, pmo: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="Responsável"
            value={filters.responsible}
            onChange={(e) => setFilters((prev) => ({ ...prev, responsible: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          />
        </div>

        <button
          onClick={handleExecute}
          disabled={mutation.isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? 'Executando...' : 'Executar Relatório'}
        </button>
      </div>

      {mutation.data && (
        <div className="glass dark:glass-dark p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Resultados</h2>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Exportar CSV
            </button>
          </div>
          {renderResults()}
        </div>
      )}

      {mutation.isError && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          Erro ao executar relatório: {mutation.error instanceof Error ? mutation.error.message : 'Erro desconhecido'}
        </div>
      )}
    </div>
  )
}
