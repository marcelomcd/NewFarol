import { FarolStatus } from '../../utils/farol'
import FeatureDetails from '../../pages/FeatureDetails'
import TaskDetails from '../../pages/TaskDetails'

interface DetailOverlayProps {
  type: 'feature' | 'task'
  id: number
  farolStatus?: FarolStatus | null
  onClose: () => void
}

const FAROL_MODAL_STYLES: Record<FarolStatus, { border: string; bgLight: string; bgDark: string }> = {
  'Problema Crítico': {
    border: 'rgba(220, 53, 69, 0.9)',
    bgLight: 'rgba(220, 53, 69, 0.06)',
    bgDark: 'rgba(220, 53, 69, 0.12)',
  },
  'Com Problema': {
    border: 'rgba(245, 158, 11, 0.9)',
    bgLight: 'rgba(245, 158, 11, 0.06)',
    bgDark: 'rgba(245, 158, 11, 0.1)',
  },
  'Sem Problema': {
    border: 'rgba(34, 197, 94, 0.9)',
    bgLight: 'rgba(34, 197, 94, 0.05)',
    bgDark: 'rgba(34, 197, 94, 0.08)',
  },
  Indefinido: { border: 'transparent', bgLight: 'transparent', bgDark: 'transparent' },
}

/**
 * Overlay full-screen para exibir detalhes de Feature ou Task.
 * Tonalidade do farol (vermelho/amarelo/verde) aplicada na janela de detalhes.
 */
export default function DetailOverlay({ type, id, farolStatus, onClose }: DetailOverlayProps) {
  const farolStyle = farolStatus && farolStatus !== 'Indefinido' ? FAROL_MODAL_STYLES[farolStatus] : null

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-slate-900 overflow-hidden animate-fadeIn relative"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes do item ${type === 'feature' ? 'Feature' : 'Task'} ${id}`}
      style={
        farolStyle
          ? {
              borderLeft: `4px solid ${farolStyle.border}`,
              boxShadow: farolStyle.border !== 'transparent' ? 'inset 0 0 0 1px rgba(255,255,255,0.03)' : undefined,
            }
          : undefined
      }
    >
      {farolStyle && (
        <>
          <div
            className="absolute inset-0 pointer-events-none dark:hidden"
            style={{
              background: `linear-gradient(135deg, ${farolStyle.bgLight} 0%, transparent 50%)`,
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 pointer-events-none hidden dark:block"
            style={{
              background: `linear-gradient(135deg, ${farolStyle.bgDark} 0%, transparent 50%)`,
            }}
            aria-hidden
          />
        </>
      )}

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
      <div className="relative z-10 flex-1 overflow-y-auto pt-2 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {type === 'feature' ? (
          <FeatureDetails idOverride={id} embedded onClose={onClose} />
        ) : (
          <TaskDetails idOverride={id} embedded onClose={onClose} />
        )}
      </div>
    </div>
  )
}
