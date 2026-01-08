/**
 * Cards de métricas principais do dashboard.
 * 
 * Componente focado em exibir os 4 cards principais de métricas.
 */
import { Feature } from '../../services/api'
import TooltipComponent from '../Tooltip/Tooltip'

interface DashboardMetricsCardsProps {
  totalProjects: number
  openProjects: number
  overdueProjects: Feature[]
  nearDeadlineProjects: Feature[]
  countsWiqlData: any
  hasActiveFilters: boolean
  onOpenClick: () => void
  onOverdueClick: () => void
  onNearDeadlineClick: () => void
}

export default function DashboardMetricsCards({
  totalProjects,
  openProjects,
  overdueProjects,
  nearDeadlineProjects,
  countsWiqlData,
  hasActiveFilters,
  onOpenClick,
  onOverdueClick,
  onNearDeadlineClick,
}: DashboardMetricsCardsProps) {
  
  // Lógica de exibição do card "Em Aberto"
  const getOpenCount = () => {
    if (!hasActiveFilters && countsWiqlData?.open !== undefined && countsWiqlData.open !== null) {
      console.log('[DashboardMetricsCards] ✅ Usando dados WIQL:', countsWiqlData.open)
      return countsWiqlData.open
    }
    console.log('[DashboardMetricsCards] 🔍 Usando cálculo local:', openProjects)
    return openProjects
  }
  
  // Lógica de exibição do card "Atrasados"
  const getOverdueCount = () => {
    if (!hasActiveFilters && countsWiqlData?.overdue !== undefined) {
      return countsWiqlData.overdue
    }
    return overdueProjects.length
  }
  
  // Lógica de exibição do card "Próximos do Prazo"
  const getNearDeadlineCount = () => {
    if (!hasActiveFilters && countsWiqlData?.near_deadline !== undefined) {
      return countsWiqlData.near_deadline
    }
    return nearDeadlineProjects.length
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total */}
      <TooltipComponent content="Total de projetos" position="top">
        <div className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
            {totalProjects}
          </div>
        </div>
      </TooltipComponent>
      
      {/* Em Aberto */}
      <TooltipComponent content="Projetos em aberto" position="top">
        <div 
          className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all group cursor-pointer border-l-4 border-green-500"
          onClick={onOpenClick}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Aberto</div>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
            {getOpenCount()}
          </div>
        </div>
      </TooltipComponent>
      
      {/* Atrasados */}
      <TooltipComponent content="Projetos com prazo vencido" position="top">
        <div 
          className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all group cursor-pointer border-l-4 border-red-500 animate-pulse"
          onClick={onOverdueClick}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Atrasados</div>
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🚨</span>
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
            {getOverdueCount()}
          </div>
        </div>
      </TooltipComponent>
      
      {/* Próximos do Prazo */}
      <TooltipComponent content="Projetos próximos do prazo (7 dias)" position="top">
        <div 
          className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all group cursor-pointer border-l-4 border-yellow-500"
          onClick={onNearDeadlineClick}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Próximos do Prazo</div>
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">⏰</span>
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
            {getNearDeadlineCount()}
          </div>
        </div>
      </TooltipComponent>
    </div>
  )
}

