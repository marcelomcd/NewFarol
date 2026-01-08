import { useQuery } from '@tanstack/react-query'
import { featuresCountApi, featuresApi } from '../../services/api'
import axios from 'axios'

interface DebugPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  // Buscar dados WIQL
  const { data: countsWiqlData, isLoading: countsLoading, error: countsError } = useQuery({
    queryKey: ['features', 'counts-wiql'],
    queryFn: () => featuresCountApi.getCountsWiql(),
    retry: 1,
  })

  // Buscar dados do banco
  const { data: featuresData } = useQuery({
    queryKey: ['features', 'all'],
    queryFn: () => featuresApi.list({ limit: 1000 }),
    retry: 1,
  })

  // Buscar Features abertas via WIQL
  const { data: openFeaturesWiqlData } = useQuery({
    queryKey: ['features', 'open-wiql'],
    queryFn: () => featuresCountApi.getOpenFeaturesWiql(),
    retry: 1,
  })

  // Buscar clientes válidos
  const { data: validClientsData } = useQuery({
    queryKey: ['clients', 'valid'],
    queryFn: async () => {
      const response = await axios.get('/api/features/clients/valid')
      return response.data
    },
    retry: 1,
  })

  if (!isOpen) return null

  const featuresFromDb = featuresData?.items || []
  const openFromDb = featuresFromDb.filter(item => {
    const state = item.state || ''
    return !['Closed', 'Resolved', 'Done', 'Fechado', 'Concluído'].includes(state)
  }).length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              🔍 Painel de Debug - Fluxo de Dados
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕ Fechar
            </button>
          </div>

          <div className="space-y-6">
            {/* Dados WIQL */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-green-600 dark:text-green-400">
                📊 Dados WIQL (Backend → Frontend)
              </h3>
              {countsLoading ? (
                <div className="text-gray-500">Carregando...</div>
              ) : countsError ? (
                <div className="text-red-500">Erro: {String(countsError)}</div>
              ) : countsWiqlData ? (
                <div className="space-y-2 font-mono text-sm">
                  <div>
                    <span className="font-semibold">Total:</span>{' '}
                    <span className={countsWiqlData.total ? 'text-green-600' : 'text-red-500'}>
                      {countsWiqlData.total ?? 'null'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Em Aberto:</span>{' '}
                    <span className={countsWiqlData.open ? 'text-green-600' : 'text-red-500'}>
                      {countsWiqlData.open ?? 'null'}
                    </span>
                    {countsWiqlData.open === 135 && (
                      <span className="ml-2 text-green-500">✅ Correto (esperado: 135)</span>
                    )}
                    {countsWiqlData.open !== 135 && countsWiqlData.open && (
                      <span className="ml-2 text-yellow-500">
                        ⚠️ Esperado: 135, recebido: {countsWiqlData.open}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold">Atrasados:</span>{' '}
                    <span className={countsWiqlData.overdue ? 'text-green-600' : 'text-red-500'}>
                      {countsWiqlData.overdue ?? 'null'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Próximos do Prazo:</span>{' '}
                    <span className={countsWiqlData.near_deadline ? 'text-green-600' : 'text-red-500'}>
                      {countsWiqlData.near_deadline ?? 'null'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Source:</span> {countsWiqlData.source || 'N/A'}
                  </div>
                </div>
              ) : (
                <div className="text-yellow-500">Sem dados WIQL</div>
              )}
            </div>

            {/* Features Abertas via WIQL */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-blue-600 dark:text-blue-400">
                📋 Features Abertas via WIQL
              </h3>
              {openFeaturesWiqlData ? (
                <div className="space-y-2 font-mono text-sm">
                  <div>
                    <span className="font-semibold">Count:</span>{' '}
                    <span className="text-green-600">{openFeaturesWiqlData.count ?? 0}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Items Length:</span>{' '}
                    <span className="text-green-600">
                      {openFeaturesWiqlData.items?.length ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Source:</span> {openFeaturesWiqlData.source || 'N/A'}
                  </div>
                  {openFeaturesWiqlData.items && openFeaturesWiqlData.items.length > 0 && (
                    <div className="mt-2">
                      <span className="font-semibold">Primeiros 5 IDs:</span>
                      <div className="ml-4 text-xs">
                        {openFeaturesWiqlData.items.slice(0, 5).map(item => (
                          <div key={item.id}>ID: {item.id} - {item.title?.substring(0, 50)}...</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-yellow-500">Sem dados</div>
              )}
            </div>

            {/* Dados do Banco */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-orange-600 dark:text-orange-400">
                💾 Dados do Banco de Dados
              </h3>
              {featuresData ? (
                <div className="space-y-2 font-mono text-sm">
                  <div>
                    <span className="font-semibold">Total Features:</span>{' '}
                    <span className="text-orange-600">{featuresFromDb.length}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Em Aberto (calculado):</span>{' '}
                    <span className="text-orange-600">{openFromDb}</span>
                    {openFromDb !== 135 && (
                      <span className="ml-2 text-yellow-500">
                        ⚠️ Diferente do esperado (135)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold">Fechadas:</span>{' '}
                    <span className="text-orange-600">
                      {featuresFromDb.filter(item =>
                        ['Closed', 'Resolved', 'Done', 'Fechado', 'Concluído'].includes(item.state || '')
                      ).length}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-yellow-500">Sem dados do banco</div>
              )}
            </div>

            {/* Clientes Válidos */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-purple-600 dark:text-purple-400">
                🏢 Clientes Válidos (Epics)
              </h3>
              {validClientsData ? (
                <div className="space-y-2 font-mono text-sm">
                  <div>
                    <span className="font-semibold">Total Clientes:</span>{' '}
                    <span className="text-purple-600">
                      {validClientsData.clients?.length ?? 0}
                    </span>
                  </div>
                  {validClientsData.clients && validClientsData.clients.length > 0 && (
                    <div className="mt-2">
                      <span className="font-semibold">Clientes:</span>
                      <div className="ml-4 text-xs max-h-40 overflow-y-auto">
                        {validClientsData.clients.slice(0, 20).map((client: string, idx: number) => (
                          <div key={idx}>• {client}</div>
                        ))}
                        {validClientsData.clients.length > 20 && (
                          <div>... e mais {validClientsData.clients.length - 20} clientes</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-yellow-500">Sem dados de clientes</div>
              )}
            </div>

            {/* Comparação */}
            <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
              <h3 className="font-bold text-lg mb-3 text-yellow-600 dark:text-yellow-400">
                ⚖️ Comparação
              </h3>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <span className="font-semibold">WIQL Em Aberto:</span>{' '}
                  <span className="text-green-600">{countsWiqlData?.open ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold">Banco Em Aberto:</span>{' '}
                  <span className="text-orange-600">{openFromDb}</span>
                </div>
                <div>
                  <span className="font-semibold">Diferença:</span>{' '}
                  <span
                    className={
                      countsWiqlData?.open && openFromDb
                        ? countsWiqlData.open === openFromDb
                          ? 'text-green-600'
                          : 'text-red-600'
                        : 'text-gray-500'
                    }
                  >
                    {countsWiqlData?.open && openFromDb
                      ? Math.abs(countsWiqlData.open - openFromDb)
                      : 'N/A'}
                  </span>
                </div>
                {countsWiqlData?.open && countsWiqlData.open !== openFromDb && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-300">
                    ⚠️ ATENÇÃO: Os dados estão diferentes! O frontend deve usar dados WIQL, não do banco.
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3">🔧 Ações</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    window.location.reload()
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  🔄 Recarregar Página
                </button>
                <button
                  onClick={() => {
                    localStorage.clear()
                    sessionStorage.clear()
                    window.location.reload()
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-2"
                >
                  🗑️ Limpar Cache e Recarregar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

