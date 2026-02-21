import { useEffect } from 'react'

export interface ChartSlot {
  id: string
  title: string
  content: React.ReactNode
}

interface ChartGalleryOverlayProps {
  isOpen: boolean
  currentIndex: number
  charts: ChartSlot[]
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function ChartGalleryOverlay({
  isOpen,
  currentIndex,
  charts,
  onClose,
  onNavigate,
}: ChartGalleryOverlayProps) {
  const current = charts[currentIndex]
  const hasMultiple = charts.length > 1
  const canGoPrev = hasMultiple && currentIndex > 0
  const canGoNext = hasMultiple && currentIndex < charts.length - 1

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft' && canGoPrev) {
        e.preventDefault()
        onNavigate(currentIndex - 1)
      } else if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault()
        onNavigate(currentIndex + 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, canGoPrev, canGoNext, onClose, onNavigate])

  if (!isOpen || charts.length === 0 || !current) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-500/50 dark:bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      {/* Conteúdo centralizado no eixo Y */}
      <div
        className="relative flex items-center justify-center w-full max-w-6xl mx-4 max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão anterior */}
        {hasMultiple && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (canGoPrev) onNavigate(currentIndex - 1)
            }}
            disabled={!canGoPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 dark:glass-dark hover:scale-110 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg border border-gray-200/80 dark:border-white/10"
            title="Gráfico anterior"
            aria-label="Gráfico anterior"
          >
            <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Card do gráfico - centralizado (tema light: fundo branco; tema dark: glass escuro) */}
        <div className="flex-1 flex flex-col items-center justify-center max-h-[95vh] overflow-auto">
          <div className="bg-white/98 dark:glass-dark p-6 rounded-2xl shadow-2xl w-full max-w-5xl my-auto border border-gray-200/80 dark:border-white/10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white font-heading">
                {current.title}
              </h2>
              <div className="flex gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentIndex + 1} / {charts.length}
                </span>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Fechar"
                  aria-label="Fechar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="min-h-[400px] flex items-center justify-center">
              {current.content}
            </div>
          </div>
        </div>

        {/* Botão próximo */}
        {hasMultiple && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (canGoNext) onNavigate(currentIndex + 1)
            }}
            disabled={!canGoNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 dark:glass-dark hover:scale-110 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg border border-gray-200/80 dark:border-white/10"
            title="Próximo gráfico"
            aria-label="Próximo gráfico"
          >
            <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Indicadores de teclado */}
        {hasMultiple && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400">
            Use ← → para navegar • Esc para fechar
          </div>
        )}
      </div>
    </div>
  )
}
