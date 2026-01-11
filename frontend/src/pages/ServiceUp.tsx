import React, { useState } from 'react';

/**
 * Página ServiceUp - Exibe o Painel Service UP via iframe
 * 
 * IMPORTANTE: Esta página usa apenas um iframe para exibir o frontend
 * independente do Service UP. Nenhum componente ou código do Service UP
 * está sendo usado diretamente aqui, garantindo total independência.
 * 
 * Qualquer alteração no "Painel Service UP" não requer alterações neste arquivo,
 * desde que a URL do frontend Service UP permaneça acessível.
 */
const ServiceUp = () => {
  // URL do frontend Service UP (pode ser configurada via variável de ambiente)
  const serviceUpUrl = import.meta.env.VITE_SERVICEUP_FRONTEND_URL || 'http://localhost:5174';
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(false);
    // Tentar acessar o conteúdo do iframe pode falhar devido a CORS,
    // mas isso é esperado e não é um problema
    try {
      // Verificação silenciosa - não fazemos nada com o resultado
      // pois o iframe pode estar em outra origem
    } catch (e) {
      // CORS é esperado quando o iframe está em outra origem
      // Não é um erro, apenas uma limitação de segurança do navegador
    }
  };

  const handleIframeError = () => {
    setError(true);
    setIsLoading(false);
    setErrorMessage('Erro ao carregar o Painel Service UP. Verifique se o frontend está rodando.');
  };

  // Timeout para detectar se o iframe não carregou
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        // Se ainda estiver carregando após 10 segundos, pode ser um problema
        // Mas não definimos como erro, pois pode estar apenas lento
        console.warn('Service UP iframe ainda carregando após 10 segundos');
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Conteúdo principal - Iframe (ocupa toda a área) */}
      <div className="flex-grow relative" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-75 z-10">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="font-medium">Carregando Painel Service Up...</p>
              <p className="text-sm mt-1">Aguarde enquanto o sistema independente é carregado</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
            <div className="text-center text-red-500 dark:text-red-400 max-w-md mx-auto p-6">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="font-bold text-lg mb-2">Erro ao carregar o Painel Service Up</p>
              <p className="text-sm mb-4">{errorMessage}</p>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Verifique:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>O frontend do Service UP está rodando em <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{serviceUpUrl}</code></li>
                  <li>O backend do Service UP está rodando na porta 3000</li>
                  <li>Execute <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">start.bat</code> para iniciar todos os serviços</li>
                </ul>
                <p className="mt-4">
                  <a 
                    href={serviceUpUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline font-medium"
                  >
                    Ou acesse o Service UP diretamente aqui
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Iframe - O único ponto de integração */}
        <iframe
          src={serviceUpUrl}
          title="Painel Service Up"
          className={`w-full h-full border-0 transition-opacity duration-300 ${
            isLoading || error ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="fullscreen"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
          // IMPORTANTE: Não usar sandbox para permitir requisições HTTP completas
          // O iframe precisa fazer requisições para localhost:3000 (backend Service UP)
        />
      </div>
    </div>
  );
};

export default ServiceUp;
