interface PageTransitionProps {
  children: React.ReactNode
}

/**
 * Wrapper que aplica animação sutil de entrada.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="animate-fadeIn" style={{ animationDuration: '0.25s' }}>
      {children}
    </div>
  )
}
