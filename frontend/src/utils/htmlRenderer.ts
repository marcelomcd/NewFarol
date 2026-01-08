import React from 'react'

/**
 * Utilitários para renderização segura de HTML
 */

/**
 * Converte HTML simples para JSX seguro, preservando links e formatação
 * Usa dangerouslySetInnerHTML de forma controlada apenas para HTML simples
 */
export function htmlToJsx(html: string): React.ReactNode {
  if (!html) return null
  
  // Se não tem HTML, retorna texto
  if (!html.includes('<') && !html.includes('>')) {
    return html.trim()
  }

  // Para HTML simples com links, usar dangerouslySetInnerHTML
  // Mas primeiro vamos sanitizar removendo scripts e eventos perigosos
  let sanitized = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')  // Remove scripts
    .replace(/on\w+="[^"]*"/gi, '')              // Remove event handlers
    .replace(/on\w+='[^']*'/gi, '')              // Remove event handlers
    .replace(/javascript:/gi, '')                 // Remove javascript: URLs
  
  // Adicionar target="_blank" e rel aos links
  sanitized = sanitized.replace(
    /<a\s+([^>]*href=["'][^"']+["'][^>]*)>/gi,
    (match, attrs) => {
      if (!attrs.includes('target=')) {
        return `<a ${attrs} target="_blank" rel="noopener noreferrer">`
      }
      return match
    }
  )
  
  // Normalizar espaços em branco dentro de tags de lista para preservar formatação
  // Remove espaços extras entre tags de lista mas preserva estrutura
  sanitized = sanitized.replace(/>\s+</g, '><')  // Remove espaços entre tags
    .replace(/(<\/?(?:ul|ol|li|p|div)[^>]*>)/gi, '\n$1\n')  // Adiciona quebras antes/depois de tags importantes
    .replace(/\n{3,}/g, '\n\n')  // Normaliza múltiplas quebras
  
  return React.createElement('div', {
    dangerouslySetInnerHTML: { __html: sanitized },
    className: 'prose dark:prose-invert max-w-none',
    style: {
      wordBreak: 'break-word',
    },
  })
}

