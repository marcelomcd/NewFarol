import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { workItemsApi, TaskDetail } from '../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getFieldLabel } from '../utils/fieldNormalization'
import { formatDate } from '../utils/featureHelpers'
import { htmlToJsx } from '../utils/htmlRenderer'

function HighlightField({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-l-4 border-blue-500 pl-4 py-2">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">{String(value ?? '-')}</div>
    </div>
  )
}

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const taskId = id && /^\d+$/.test(id) ? parseInt(id, 10) : null

  const { data, isLoading, error } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => workItemsApi.getTask(taskId!),
    enabled: !!taskId,
    staleTime: 60_000,
    retry: (failureCount, err: any) => {
      if (err?.response?.status === 404) return false
      if (err?.response?.status === 429) return failureCount < 3
      return failureCount < 2
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !data || !taskId) {
    const errorStatus = (error as any)?.response?.status
    const isRateLimit = errorStatus === 429
    const isNotFound = errorStatus === 404

    return (
      <div className="glass dark:glass-dark p-6 rounded-lg text-center animate-fadeIn">
        {isRateLimit ? (
          <>
            <p className="text-yellow-600 dark:text-yellow-400 text-lg font-semibold mb-2">⚠️ Muitas requisições</p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              O servidor está recebendo muitas requisições. Tente novamente em alguns segundos.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </>
        ) : (
          <>
            <p className="text-red-500 text-lg">
              {isNotFound ? 'Task não encontrada' : `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`}
            </p>
            <button
              onClick={() => navigate('/tasks/active')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voltar para Task&apos;s Ativas
            </button>
          </>
        )}
      </div>
    )
  }

  const task = data as TaskDetail
  const fields = task.raw_fields_json || {}
  const azureDevOpsUrl = `https://dev.azure.com/qualiit/Quali%20IT%20-%20Inovação%20e%20Tecnologia/_workitems/edit/${task.id}`

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all hover-lift"
            title="Voltar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <span>📋</span>
              <span>ID: {task.id}</span>
              <span className="text-xl">-</span>
              <span>{task.title}</span>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <a
                href={azureDevOpsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                Abrir no Azure DevOps
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="glass dark:glass-dark p-6 rounded-lg">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
            {task.state}
          </span>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Atualizado: {format(new Date(task.changed_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </div>
        </div>
      </div>

      {/* Informações Principais */}
      <div className="glass dark:glass-dark p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          <span>⭐</span>
          <span>Informações Principais</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <HighlightField label="Cliente" value={task.client || '-'} />
          <HighlightField label="Responsável (Cliente)" value={task.responsible || '-'} />
          <HighlightField label="Responsável (Assigned To)" value={task.assigned_to || '-'} />
          <HighlightField label="Data Fim" value={task.target_date ? formatDate(task.target_date) : '-'} />
          <HighlightField label="Criado Por" value={task.created_by || '-'} />
          <HighlightField label="Horas Restantes" value={task.remaining_work ?? '-'} />
          <HighlightField label="Horas Concluídas" value={task.completed_work ?? '-'} />
          <HighlightField label="Estimativa" value={task.original_estimate ?? '-'} />
          <HighlightField label="Atividade" value={task.activity || '-'} />
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Criado em: {format(new Date(task.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })} | 
          Alterado em: {format(new Date(task.changed_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </div>
      </div>

      {/* Descrição */}
      {task.description && (
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
            <span>📝</span>
            <span>Descrição</span>
          </h2>
          <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {typeof task.description === 'string' && (task.description.includes('<') || task.description.includes('>'))
              ? htmlToJsx(task.description)
              : String(task.description)}
          </div>
        </div>
      )}

      {/* Informações Gerais (Campos Formatados) */}
      {task.fields_formatted && Object.keys(task.fields_formatted).length > 0 && (
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
            <span>📋</span>
            <span>Informações Gerais</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(task.fields_formatted).map(([label, value]) => (
              <div key={label} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">• {label}:</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                  {value === null || value === undefined ? '-' : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campos Brutos do Azure DevOps */}
      <div className="glass dark:glass-dark p-6 rounded-lg">
        <details className="cursor-pointer">
          <summary className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 list-none flex items-center gap-2">
            <span>🔧</span>
            <span>Campos Brutos do Azure DevOps ({Object.keys(fields).length})</span>
          </summary>
          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(fields)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, value]) => (
                <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{getFieldLabel(key)}</div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400">{key}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
    </div>
  )
}
