/**
 * Componente de filtros do dashboard.
 * 
 * Permite filtrar por Farol, Cliente, Estado e PMO.
 */
import { FarolStatus } from '../../utils/farol'

interface DashboardFiltersProps {
  selectedFarol: FarolStatus | null
  selectedClient: string | null
  selectedState: string | null
  selectedPMO: string | null
  uniqueClients: string[]
  uniqueStates: string[]
  uniquePMOs: string[]
  onFarolChange: (farol: FarolStatus | null) => void
  onClientChange: (client: string | null) => void
  onStateChange: (state: string | null) => void
  onPMOChange: (pmo: string | null) => void
}

export default function DashboardFilters({
  selectedFarol,
  selectedClient,
  selectedState,
  selectedPMO,
  uniqueClients,
  uniqueStates,
  uniquePMOs,
  onFarolChange,
  onClientChange,
  onStateChange,
  onPMOChange,
}: DashboardFiltersProps) {
  return (
    <div className="glass dark:glass-dark p-4 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Filtro de Farol */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Farol
        </label>
        <select
          value={selectedFarol || ''}
          onChange={(e) => onFarolChange(e.target.value as FarolStatus || null)}
          className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todos</option>
          <option value="Sem Problema">✅ Sem Problema</option>
          <option value="Com Problema">⚠️ Com Problema</option>
          <option value="Problema Crítico">🚨 Problema Crítico</option>
        </select>
      </div>
      
      {/* Filtro de Cliente */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Cliente
        </label>
        <select
          value={selectedClient || ''}
          onChange={(e) => onClientChange(e.target.value || null)}
          className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todos</option>
          {uniqueClients.map((client) => (
            <option key={client} value={client}>
              {client}
            </option>
          ))}
        </select>
      </div>
      
      {/* Filtro de Estado */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Estado
        </label>
        <select
          value={selectedState || ''}
          onChange={(e) => onStateChange(e.target.value || null)}
          className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todos</option>
          {uniqueStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>
      
      {/* Filtro de PMO */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          PMO
        </label>
        <select
          value={selectedPMO || ''}
          onChange={(e) => onPMOChange(e.target.value || null)}
          className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todos</option>
          {uniquePMOs.map((pmo) => (
            <option key={pmo} value={pmo}>
              {pmo}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

