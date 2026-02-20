import FeatureDetails from '../../pages/FeatureDetails'
import TaskDetails from '../../pages/TaskDetails'

interface DetailOverlayProps {
  type: 'feature' | 'task'
  id: number
  onClose: () => void
}

/**
 * Overlay full-screen para exibir detalhes de Feature ou Task.
 * Comportamento estilo Azure DevOps: ocupa toda a janela, X no canto fecha e retorna à lista.
 */
export default function DetailOverlay({ type, id, onClose }: DetailOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-slate-900 overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes do item ${type === 'feature' ? 'Feature' : 'Task'} ${id}`}
    >
      {/* Botão X no canto superior direito */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-lg"
        title="Fechar"
        aria-label="Fechar detalhes"
      >
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto pt-2 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {type === 'feature' ? (
          <FeatureDetails idOverride={id} embedded onClose={onClose} />
        ) : (
          <TaskDetails idOverride={id} embedded onClose={onClose} />
        )}
      </div>
    </div>
  )
}
