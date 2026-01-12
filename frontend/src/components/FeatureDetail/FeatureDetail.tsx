import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { featuresApi } from '../../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function FeatureDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['feature', id],
    queryFn: () => featuresApi.get(Number(id)),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Erro ao carregar feature: {error instanceof Error ? error.message : 'Feature não encontrada'}
      </div>
    )
  }

  // Usar campos formatados se disponível, senão usar campos brutos como fallback
  const formattedFields = data.fields_formatted || {}
  const rawFields = data.raw_fields_json || {}
  const fields = Object.keys(formattedFields).length > 0 
    ? Object.entries(formattedFields).sort(([a], [b]) => a.localeCompare(b))
    : Object.entries(rawFields).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/features')}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← Voltar
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{data.title}</h1>
      </div>

      <div className="glass dark:glass-dark p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">ID</div>
            <div className="font-semibold">{data.id}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Estado</div>
            <div>
              <span className="px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded text-sm">
                {data.state}
              </span>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Projeto</div>
            <div className="font-semibold">{data.project_id}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tipo</div>
            <div className="font-semibold">{data.work_item_type}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cliente</div>
            <div className="font-semibold">{data.client || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">PMO</div>
            <div className="font-semibold">{data.pmo || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Responsável</div>
            <div className="font-semibold">{data.responsible || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Atribuído a</div>
            <div className="font-semibold">{data.assigned_to || '-'}</div>
          </div>
        </div>

        {data.description && (
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Descrição</div>
            <div className="prose dark:prose-invert max-w-none">{data.description}</div>
          </div>
        )}

        {data.tags && data.tags.length > 0 && (
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tags</div>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Criado em</div>
            <div className="font-semibold">
              {format(new Date(data.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </div>
            <div className="text-xs text-gray-500">{data.created_by}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Alterado em</div>
            <div className="font-semibold">
              {format(new Date(data.changed_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </div>
            <div className="text-xs text-gray-500">{data.changed_by}</div>
          </div>
        </div>
      </div>

      {/* Campos Formatados */}
      {Object.keys(formattedFields).length > 0 && (
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            Campos Formatados ({Object.keys(formattedFields).length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(formattedFields)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, value]) => (
                <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{key}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {value === null || value === undefined ? '-' : String(value)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Campos Brutos (Colapsável) - Para debug */}
      {Object.keys(rawFields).length > 0 && (
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <details className="cursor-pointer">
            <summary className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 list-none flex items-center gap-2">
              <span>🔧</span>
              <span>Campos Brutos do Azure DevOps ({Object.keys(rawFields).length})</span>
            </summary>
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(rawFields)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => (
                  <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                    <div className="text-xs font-mono text-gray-600 dark:text-gray-400">{key}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {typeof value === 'object' ? (
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        String(value)
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

