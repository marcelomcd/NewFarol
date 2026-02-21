import React, { useEffect } from 'react'
import { Feature } from '../../services/api'

interface ClientsModalProps {
  isOpen: boolean
  onClose: () => void
  clients: string[]
  allItems: Feature[]
  activeItems: Feature[]
  onClientClick: (client: string) => void
}

export default function ClientsModal({
  isOpen,
  onClose,
  clients,
  allItems,
  activeItems,
  onClientClick,
}: ClientsModalProps) {
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

  // Normalizar nomes para comparação consistente (evita divergência: "QUALIIT" vs "Quali IT", caixa, acentos, etc.)
  const normalizeClientKey = (value?: string | null) => {
    if (!value) return ''
    return value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '') // remove espaços/pontuação
      .trim()
  }

  // Separar clientes com projetos ativos dos que só têm encerrados
  const activeClientKeys = new Set(activeItems.map(item => normalizeClientKey(item.client)).filter(Boolean))
  const clientsWithActive = clients.filter(client => activeClientKeys.has(normalizeClientKey(client)))
  const clientsOnlyClosed = clients.filter(client => !activeClientKeys.has(normalizeClientKey(client)))

  const getClientCount = (client: string) => {
    const key = normalizeClientKey(client)
    return allItems.filter(item => normalizeClientKey(item.client) === key).length
  }

  const getActiveCount = (client: string) => {
    const key = normalizeClientKey(client)
    return activeItems.filter(item => normalizeClientKey(item.client) === key).length
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="glass dark:glass-dark rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Lista de Clientes</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
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

        {/* Content - min-h-0 fixa rolagem em flexbox */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {/* Clientes com projetos ativos */}
          {clientsWithActive.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                Clientes com Projetos Ativos ({clientsWithActive.length})
              </h3>
              <div className="space-y-2">
                {clientsWithActive.map((client) => {
                  const total = getClientCount(client)
                  const active = getActiveCount(client)
                  return (
                    <div
                      key={client}
                      onClick={() => {
                        onClientClick(client)
                        onClose()
                      }}
                      className="glass dark:glass-dark p-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all hover-lift border-l-4 border-blue-500"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800 dark:text-white">{client}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {active} ativo{active !== 1 ? 's' : ''} • {total} total
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Clientes apenas com projetos encerrados */}
          {clientsOnlyClosed.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                Clientes com Apenas Projetos Encerrados ({clientsOnlyClosed.length})
              </h3>
              <div className="space-y-2">
                {clientsOnlyClosed.map((client) => {
                  const total = getClientCount(client)
                  return (
                    <div
                      key={client}
                      onClick={() => {
                        onClientClick(client)
                        onClose()
                      }}
                      className="glass dark:glass-dark p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all hover-lift border-l-4 border-gray-400"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800 dark:text-white">{client}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {total} projeto{total !== 1 ? 's' : ''} encerrado{total !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Clique em um cliente para ver seus projetos
          </div>
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

