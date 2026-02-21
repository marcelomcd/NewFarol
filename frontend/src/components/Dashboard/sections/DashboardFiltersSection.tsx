/**
 * Seção de filtros do Dashboard Interativo.
 * Inclui Responsável, Cliente, Estado, PMO e botão Limpar Filtros.
 */
interface ClientsForFilter {
  active: string[]
  closed: string[]
}

interface DashboardFiltersSectionProps {
  selectedResponsavel: string | null
  setSelectedResponsavel: (v: string | null) => void
  selectedClient: string | null
  setSelectedClient: (v: string | null) => void
  selectedState: string | null
  setSelectedState: (v: string | null) => void
  selectedPMO: string | null
  setSelectedPMO: (v: string | null) => void
  uniqueResponsibles: string[]
  clientsForFilter: ClientsForFilter
  uniqueStates: string[]
  uniquePMOs: string[]
  hasFilters: boolean
  clearFilters: () => void
}

export default function DashboardFiltersSection({
  selectedResponsavel,
  setSelectedResponsavel,
  selectedClient,
  setSelectedClient,
  selectedState,
  setSelectedState,
  selectedPMO,
  setSelectedPMO,
  uniqueResponsibles,
  clientsForFilter,
  uniqueStates,
  uniquePMOs,
  hasFilters,
  clearFilters,
}: DashboardFiltersSectionProps) {
  return (
    <div className="glass dark:glass-dark p-5 rounded-lg grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 items-end">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Responsável</label>
        <select
          value={selectedResponsavel || ''}
          onChange={(e) => setSelectedResponsavel(e.target.value || null)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
        >
          <option value="">Todos</option>
          {uniqueResponsibles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Cliente</label>
        <select
          value={selectedClient || ''}
          onChange={(e) => setSelectedClient(e.target.value || null)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
        >
          <option value="">Todos</option>
          {clientsForFilter.active.length > 0 && (
            <>
              {clientsForFilter.active.map((client) => (
                <option key={client} value={client}>{client}</option>
              ))}
              {clientsForFilter.closed.length > 0 && <option disabled>─────────────────</option>}
            </>
          )}
          {clientsForFilter.closed.map((client) => (
            <option key={client} value={client}>{client}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Estado</label>
        <select
          value={selectedState || ''}
          onChange={(e) => setSelectedState(e.target.value || null)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
        >
          <option value="">Todos</option>
          {uniqueStates.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>
      <div className="relative">
        <div className="absolute top-0 right-0">
          <button
            onClick={clearFilters}
            disabled={!hasFilters}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            Limpar Filtros
          </button>
        </div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">PMO</label>
        <select
          value={selectedPMO || ''}
          onChange={(e) => setSelectedPMO(e.target.value || null)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
        >
          <option value="">Todos</option>
          {uniquePMOs.map((pmo) => (
            <option key={pmo} value={pmo}>{pmo}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
