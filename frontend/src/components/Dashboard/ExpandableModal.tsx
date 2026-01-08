import React, { ReactNode } from 'react'

interface ExpandableModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function ExpandableModal({ isOpen, onClose, title, children }: ExpandableModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 text-center sm:p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all w-[95vw] max-w-[95vw] h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 px-6 pb-4 pt-6 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white" id="modal-title">
                {title}
              </h3>
              <button
                type="button"
                className="rounded-md bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Fechar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="bg-white dark:bg-slate-800 px-6 py-4 flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
