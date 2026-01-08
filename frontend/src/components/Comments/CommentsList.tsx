import { useQuery } from '@tanstack/react-query'
import { featuresApi, Comment } from '../../services/api'

interface CommentsListProps {
  featureId: number
}

export default function CommentsList({ featureId }: CommentsListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['feature-revisions', featureId],
    queryFn: () => featuresApi.getRevisions(featureId),
    enabled: !!featureId,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    let errorMessage = 'Erro desconhecido ao carregar comentários'
    let isConfigError = false
    
    if (error instanceof Error) {
      errorMessage = error.message
      // Verificar se é erro HTTP
      if ('response' in error && (error as any).response) {
        const response = (error as any).response
        if (response.status === 500) {
          // isServerError = true
          const detail = response.data?.detail || ''
          if (detail.includes('PAT') || detail.includes('token') || detail.includes('autenticação')) {
            isConfigError = true
            errorMessage = 'Azure DevOps não está configurado corretamente. O Personal Access Token (PAT) não foi configurado no servidor.'
          } else {
            errorMessage = `Erro no servidor (500): ${detail.substring(0, 200)}`
          }
        } else if (response.status === 401 || response.status === 403) {
          isConfigError = true
          errorMessage = 'Erro de autenticação com Azure DevOps. Verifique as configurações do servidor.'
        }
      }
    }
    
    return (
      <div className="glass dark:glass-dark p-6 rounded-lg text-center animate-fadeIn">
        <div className="text-red-500 dark:text-red-400 mb-2">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Erro ao carregar comentários
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
          {errorMessage}
        </p>
        {isConfigError && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4 max-w-md mx-auto">
            💡 Configure a variável de ambiente <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">AZDO_PAT</code> no backend para habilitar os comentários.
          </p>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  const comments = data?.comments || []

  if (comments.length === 0) {
    return (
      <div className="glass dark:glass-dark p-6 rounded-lg text-center">
        <p className="text-gray-500 dark:text-gray-400">Nenhum comentário encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <span>💬</span>
        <span>Comentários ({comments.length})</span>
      </h3>

      <div className="space-y-4">
        {comments.map((comment: Comment, index: number) => (
          <div
            key={index}
            className="glass dark:glass-dark p-6 rounded-lg hover-lift transition-all duration-300 border-l-4 border-blue-500"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {comment.responsavel.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">
                    {comment.responsavel}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {comment.data_formatada}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {comment.conteudo}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

