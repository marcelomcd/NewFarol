import { useState, useEffect } from 'react'
import { Feature } from '../../services/api'
import FarolCircle from '../Farol/FarolCircle'
import DetailOverlay from './DetailOverlay'
import Tooltip from '../Tooltip/Tooltip'
import { normalizeFarolStatus, FarolStatus } from '../../utils/farol'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DrillDownModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  items: Feature[]
  filterLabel: string
}

export default function DrillDownModal({
  isOpen,
  onClose,
  title,
  items,
  filterLabel,
}: DrillDownModalProps) {
  const [selectedItem, setSelectedItem] = useState<{ type: 'feature' | 'task'; id: number; farolStatus?: FarolStatus | null } | null>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedItem) setSelectedItem(null)
        else onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, selectedItem, onClose])

  if (!isOpen) return null

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="glass dark:glass-dark rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filterLabel}: {items.length} {items.length === 1 ? 'item' : 'itens'}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {items.map((item) => {
              const workItemType = item.raw_fields_json?.['work_item_type']
              const webUrl = (item as any).web_url || item.raw_fields_json?.['web_url']
              const isTask = workItemType === 'Task'
              const isBug = workItemType === 'Bug'
              
              const handleClick = () => {
                if (isTask) {
                  setSelectedItem({ type: 'task', id: item.id, farolStatus: null })
                } else if (isBug) {
                  if (webUrl) {
                    window.open(webUrl, '_blank')
                  } else {
                    window.open(`https://dev.azure.com/qualiit/Quali%20IT%20-%20Inovação%20e%20Tecnologia/_workitems/edit/${item.id}`, '_blank')
                  }
                } else {
                  setSelectedItem({ type: 'feature', id: item.id, farolStatus: normalizeFarolStatus(item.farol_status) })
                }
              }
              
              return (
              <div
                key={item.id}
                onClick={handleClick}
                className="glass dark:glass-dark p-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all hover-lift border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {!isTask && !isBug && (
                        <FarolCircle
                          status={normalizeFarolStatus(item.farol_status)}
                          size="small"
                        />
                      )}
                      <span className="font-semibold text-gray-800 dark:text-white">
                        ID: {item.id}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                        {item.state}
                      </span>
                    </div>
                    <Tooltip content={item.title || ''} position="top">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {item.title || 'Sem título'}
                      </h3>
                    </Tooltip>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                      {item.client && (
                        <span className="flex items-center gap-1" title="Cliente">
                          <span>🏢</span>
                          <span>{item.client}</span>
                        </span>
                      )}
                      {((item as any).assigned_to || item.pmo) && (
                        <span className="flex items-center gap-1" title="PMO">
                          <span>👤</span>
                          <span>{(item as any).assigned_to || item.pmo}</span>
                        </span>
                      )}
                      {(item as any).responsible && (
                        <span className="flex items-center gap-1" title="Responsável Cliente">
                          <span>📋</span>
                          <span>{(item as any).responsible}</span>
                        </span>
                      )}
                      {item.changed_date && (
                        <span className="flex items-center gap-1" title="Data de Atualização">
                          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>{format(new Date(item.changed_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </span>
                      )}
                      {((item as { target_date?: string }).target_date ?? item.raw_fields_json?.['Microsoft.VSTS.Scheduling.TargetDate']) && (
                        <span className="flex items-center gap-1" title="Data Prevista para Conclusão">
                          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{format(new Date((item as { target_date?: string }).target_date ?? item.raw_fields_json?.['Microsoft.VSTS.Scheduling.TargetDate']), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </span>
                      )}
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

          {items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Nenhum item encontrado</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Clique em um item para ver detalhes
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

    {/* Overlay full-screen de detalhes (estilo Azure DevOps) */}
    {selectedItem && (
      <DetailOverlay
        type={selectedItem.type}
        id={selectedItem.id}
        farolStatus={selectedItem.farolStatus ?? null}
        onClose={() => setSelectedItem(null)}
      />
    )}
    </>
  )
}

