import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Reports() {
  const [reportType, setReportType] = useState('closed_in_days')
  const [days, setDays] = useState(30)
  const [filters, setFilters] = useState({
    project_id: '',
    state: '',
    client: '',
    pmo: '',
    responsible: '',
  })

  const mutation = useMutation({
    mutationFn: () => reportsApi.execute(reportType, days, filters),
  })

  const handleExecute = () => {
    mutation.mutate()
  }

  const handleExportCSV = () => {
    if (!mutation.data) return

    const data = mutation.data.data || []
    if (Array.isArray(data) && data.length === 0) return

    let headers: string[] = []
    let rows: any[] = []

    if (Array.isArray(data)) {
      headers = Object.keys(data[0] || {})
      rows = data
    } else {
      // Agrupado
      const allRows: any[] = []
      Object.entries(data).forEach(([group, items]) => {
        if (Array.isArray(items) && items.length > 0) {
          if (headers.length === 0) {
            headers = ['Grupo', ...Object.keys(items[0])]
          }
          items.forEach((item: any) => {
            allRows.push([group, ...Object.values(item)])
          })
        }
      })
      rows = allRows
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Relatórios</h1>

      {/* Formulário */}
      <div className="glass dark:glass-dark p-6 rounded-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Relatório</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="closed_in_days">Itens fechados em X dias</option>
            <option value="new_items">Novos itens nos últimos X dias</option>
            <option value="recent_changes">Últimas alterações</option>
            <option value="by_pmo">Agrupado por PMO</option>
            <option value="by_client">Agrupado por Cliente</option>
            <option value="by_responsible">Agrupado por Responsável</option>
          </select>
        </div>

        {(reportType === 'closed_in_days' || reportType === 'new_items') && (
          <div>
            <label className="block text-sm font-medium mb-2">Dias</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
              min="1"
            />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Projeto ID"
            value={filters.project_id}
            onChange={(e) => setFilters((prev) => ({ ...prev, project_id: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Estado"
            value={filters.state}
            onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Cliente"
            value={filters.client}
            onChange={(e) => setFilters((prev) => ({ ...prev, client: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="PMO"
            value={filters.pmo}
            onChange={(e) => setFilters((prev) => ({ ...prev, pmo: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Responsável"
            value={filters.responsible}
            onChange={(e) => setFilters((prev) => ({ ...prev, responsible: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
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

      {/* Resultados */}
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

          {Array.isArray(mutation.data.data) ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-100 dark:bg-blue-900">
                  <tr>
                    {Object.keys(mutation.data.data[0] || {}).map((key) => (
                      <th key={key} className="px-4 py-3 text-left">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mutation.data.data.map((item: any, idx: number) => (
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
                Total: {mutation.data.count || mutation.data.data.length} itens
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(mutation.data.data || {}).map(([group, items]: [string, any]) => (
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
                Total: {mutation.data.groups || 0} grupos
              </div>
            </div>
          )}
        </div>
      )}

      {mutation.isError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Erro ao executar relatório: {mutation.error instanceof Error ? mutation.error.message : 'Erro desconhecido'}
        </div>
      )}
    </div>
  )
}

