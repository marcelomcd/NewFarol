import React from 'react'

interface ProgressBarProps {
  percentage: number
  label?: string
  showPercentage?: boolean
  className?: string
}

const getProgressColor = (percent: number): string => {
  if (percent >= 80) return '#28a745' // Verde
  if (percent >= 50) return '#ffc107' // Amarelo
  if (percent >= 25) return '#fd7e14' // Laranja
  return '#dc3545' // Vermelho
}

export default function ProgressBar({
  percentage,
  label,
  showPercentage = true,
  className = '',
}: ProgressBarProps) {
  const color = getProgressColor(percentage)
  const clampedPercentage = Math.max(0, Math.min(100, percentage))

  return (
    <div className={`relative ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {clampedPercentage}%
            </span>
          )}
        </div>
      )}
      <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out shadow-lg"
          style={{
            width: `${clampedPercentage}%`,
            backgroundColor: color,
          }}
        >
          {showPercentage && clampedPercentage > 10 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-md">
                {clampedPercentage}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

