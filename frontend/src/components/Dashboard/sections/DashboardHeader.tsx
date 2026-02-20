/**
 * Cabeçalho e alerta de erro do Dashboard Interativo.
 */
interface DashboardHeaderProps {
  consolidatedError: Error | null
  consolidatedLoading: boolean
}

export default function DashboardHeader({ consolidatedError, consolidatedLoading }: DashboardHeaderProps) {
  return (
    <>
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <span className="text-4xl">📊</span>
          <span>Dashboard Interativo</span>
        </h1>
      </div>
    </>
  )
}
