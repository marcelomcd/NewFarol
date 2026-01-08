/**
 * Cards secundários do dashboard (Clientes, PMOs, Estados).
 */
import TooltipComponent from '../Tooltip/Tooltip'

interface DashboardSecondaryCardsProps {
  clientsCount: number
  pmosCount: number
  statesCount: number
  onClientsClick: () => void
}

export default function DashboardSecondaryCards({
  clientsCount,
  pmosCount,
  statesCount,
  onClientsClick,
}: DashboardSecondaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TooltipComponent content="Número de clientes únicos com projetos ativos" position="top">
        <div 
          className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all group cursor-pointer"
          onClick={onClientsClick}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Clientes</div>
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
            {clientsCount}
          </div>
        </div>
      </TooltipComponent>
      
      <TooltipComponent content="Número de PMOs (Project Management Officers) ativos" position="top">
        <div className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">PMOs</div>
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">👤</span>
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
            {pmosCount}
          </div>
        </div>
      </TooltipComponent>
      
      <TooltipComponent content="Número de estados diferentes dos projetos" position="top">
        <div className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Estados</div>
            <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
            {statesCount}
          </div>
        </div>
      </TooltipComponent>
    </div>
  )
}

