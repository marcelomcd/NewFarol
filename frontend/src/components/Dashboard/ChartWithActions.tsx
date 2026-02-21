/**
 * Wrapper para gráficos com ações: export PNG e fullscreen (via galeria).
 */
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'

interface ChartWithActionsProps {
  title: string
  children: React.ReactNode
  onFullscreenClick?: () => void
}

export default function ChartWithActions({ title, children, onFullscreenClick }: ChartWithActionsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const handleFullscreen = () => {
    onFullscreenClick?.()
  }

  const handleExportPng = async () => {
    const el = containerRef.current
    if (!el) return
    setExporting(true)
    try {
      const isDark = document.documentElement.classList.contains('dark')
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        backgroundColor: isDark ? '#111827' : '#ffffff',
      })
      const link = document.createElement('a')
      link.download = `${title.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Erro ao exportar PNG:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="glass dark:glass-dark p-6 rounded-lg transition-all hover-lift"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white font-heading">{title}</h3>
        <div className="flex gap-1">
          <button
            onClick={handleExportPng}
            disabled={exporting}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Exportar PNG"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors btn-active-feedback"
            title="Tela cheia"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}
