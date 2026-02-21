import { useEffect, useState } from 'react'

interface KpiCounterProps {
  value: number
  suffix?: string
  duration?: number
  decimals?: number
  className?: string
}

/**
 * Exibe um número com animação de count-up ao montar.
 */
export default function KpiCounter({
  value,
  suffix = '',
  duration = 600,
  decimals = 1,
  className = '',
}: KpiCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (hasAnimated) {
      setDisplayValue(value)
      return
    }
    setHasAnimated(true)

    const start = 0
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (value - start) * eased
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration, hasAnimated])

  const formatted = decimals >= 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString()

  return (
    <span className={className}>
      {formatted}{suffix}
    </span>
  )
}
