/**
 * Skeleton de carregamento do Dashboard.
 * Exibido enquanto os dados principais estão sendo buscados.
 * Com efeito shimmer para aparência mais moderna.
 */
export default function DashboardSkeleton() {
  const SkeletonBlock = ({ className = '' }: { className?: string }) => (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <div className="w-full h-full bg-gray-300 dark:bg-gray-600 skeleton-shimmer" />
    </div>
  )

  return (
    <div className="space-y-6 px-2 pt-0 pb-6">
      {/* Layout: Semáforo + Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        {/* Card Farol */}
        <div className="w-fit animate-fadeIn">
          <div className="glass dark:glass-dark p-6 rounded-lg flex flex-col w-fit min-w-[140px] h-[280px]">
            <SkeletonBlock className="h-6 w-32 mx-auto mb-4" />
            <div className="flex flex-col gap-4 flex-1 justify-center items-center">
              <SkeletonBlock className="w-[120px] h-[120px] rounded-xl" />
              <SkeletonBlock className="w-[100px] h-[100px] rounded-xl" />
              <SkeletonBlock className="w-[100px] h-[100px] rounded-xl" />
            </div>
          </div>
        </div>

        {/* Filtros + Cards */}
        <div className="flex flex-col gap-4 animate-fadeIn stagger-2">
          <div className="glass dark:glass-dark p-5 rounded-lg h-[100px]">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonBlock key={i} className="h-10" />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} className="h-20 flex-1 min-w-[150px]" />
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonBlock className="h-[350px]" />
        <SkeletonBlock className="h-[350px]" />
      </div>
    </div>
  )
}
