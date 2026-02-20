import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Feature } from '../../services/api'
import FarolCircle from '../Farol/FarolCircle'
import Tooltip from '../Tooltip/Tooltip'
import { normalizeFarolStatus } from '../../utils/farol'
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
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
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
                if (isBug || isTask) {
                  // Para Bugs e Tasks, abrir diretamente no Azure DevOps
                  if (webUrl) {
                    window.open(webUrl, '_blank')
                  } else {
                    // Fallback: tentar construir URL do Azure DevOps
                    const org = window.location.hostname.includes('localhost') ? 'qualiit' : 'qualiit'
                    window.open(`https://dev.azure.com/${org}/Quali%20IT%20-%20Inovação%20e%20Tecnologia/_workitems/edit/${item.id}`, '_blank')
                  }
                } else {
                  // Para Features, usar rota normal
                  window.open(`/features/${item.id}`, '_blank')
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
                        <span className="flex items-center gap-1">
                          <span>🏢</span>
                          <span>{item.client}</span>
                        </span>
                      )}
                      {((item as any).assigned_to || item.pmo) && (
                        <span className="flex items-center gap-1">
                          <span>👤</span>
                          <span>{(item as any).assigned_to || item.pmo}</span>
                        </span>
                      )}
                      {(item as any).responsible && (
                        <span className="flex items-center gap-1">
                          <span>📋</span>
                          <span>{(item as any).responsible}</span>
                        </span>
                      )}
                      {item.changed_date && (
                        <span className="flex items-center gap-1">
                          <span>📅</span>
                          <span>{format(new Date(item.changed_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
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
  )
}

