import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Cabeçalho e alerta de erro do Dashboard Interativo.
 * Título removido para aproximar o conteúdo da navbar.
 */
interface DashboardHeaderProps {
  consolidatedError: Error | null
  consolidatedLoading: boolean
  dataUpdatedAt?: number
}

export default function DashboardHeader({ consolidatedError, consolidatedLoading, dataUpdatedAt }: DashboardHeaderProps) {
  return (
    <>
      {!consolidatedLoading && dataUpdatedAt && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Atualizado {formatDistanceToNow(dataUpdatedAt, { addSuffix: true, locale: ptBR })}
        </div>
      )}
      {!consolidatedLoading && consolidatedError && (
        <div className="glass dark:glass-dark p-4 rounded-lg border border-red-300/40 dark:border-red-500/30">
          <div className="text-sm text-red-700 dark:text-red-300 font-medium">
            Falha ao carregar dados consolidados do Azure DevOps (`/api/azdo/consolidated`). Os números podem ficar divergentes
            (fallback do banco/local).
          </div>
          <div className="text-xs text-red-600/80 dark:text-red-300/80 mt-1">
            Verifique se o backend está com `AZDO_PAT` configurado e acessando o Azure DevOps sem 302/401.
          </div>
        </div>
      )}
    </>
  )
}
