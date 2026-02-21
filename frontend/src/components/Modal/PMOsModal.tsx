import React, { useEffect } from 'react'

interface PMOsModalProps {
  isOpen: boolean
  onClose: () => void
  pmos: Array<{ name: string; count: number }>
  onPMOClick: (pmo: string) => void
}

export default function PMOsModal({ isOpen, onClose, pmos, onPMOClick }: PMOsModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="glass dark:glass-dark rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Lista de PMOs</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pmos.length} {pmos.length === 1 ? 'PMO' : 'PMOs'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Fechar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {pmos.map((pmo) => (
              <div
                key={pmo.name}
                onClick={() => {
                  onPMOClick(pmo.name)
                  onClose()
                }}
                className="glass dark:glass-dark p-4 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all hover-lift border-l-4 border-purple-500"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-white">{pmo.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{pmo.count} projeto{pmo.count !== 1 ? 's' : ''}</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
            {pmos.length === 0 && (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">Nenhum PMO encontrado</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Clique em um PMO para filtrar</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}


