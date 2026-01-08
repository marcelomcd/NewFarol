import { useState, useEffect } from 'react';

interface CausaRaizItem {
  sistemaImpactado: string;
  servico: string;
  tipo: string;
  status: string;
  problema: string;
  solucao: string;
  mediaMes: string;
}

const SlideCausaRaizMelhoriasSetembro = () => {
  const [dados, setDados] = useState<CausaRaizItem[]>([]);
  const [dadosConcluidos, setDadosConcluidos] = useState<CausaRaizItem[]>([]);
  const [dadosEmAndamento, setDadosEmAndamento] = useState<CausaRaizItem[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'concluidos' | 'em-andamento'>('concluidos');
  const [loading, setLoading] = useState(true);

  // Função para processar dados de uma aba
  const processarAba = (worksheet: any, XLSX: any): CausaRaizItem[] => {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
      blankrows: false
    });

    return jsonData
      .filter((row: any, index: number) => {
        if (index === 0) {
          const firstValue = String(Object.values(row)[0] || '').toLowerCase().trim();
          const headerKeywords = ['sistema impactado', 'serviço', 'tipo', 'status', 'problema', 'solução', 'média mês', 'média mes'];
          if (headerKeywords.includes(firstValue)) {
            return false;
          }
        }

        const rowKeys = Object.keys(row);
        if (rowKeys.length === 0) return false;

        const values = rowKeys.map((key: string) => String(row[key] || '').trim());
        const nonEmptyValues = values.filter((val: string) => val !== '');

        if (nonEmptyValues.length === 0) {
          return false;
        }

        const headerKeywords = ['sistema impactado', 'serviço', 'tipo', 'status', 'problema', 'solução', 'média mês', 'média mes'];
        const allAreHeaders = nonEmptyValues.every((val: string) => headerKeywords.includes(val.toLowerCase()));
        if (allAreHeaders && nonEmptyValues.length >= 3) {
          return false;
        }

        return true;
      })
      .map((row: any) => {
        const getValue = (keys: string[]): string => {
          for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
              return String(row[key]).trim();
            }
          }
          return '';
        };

        const rowKeys = Object.keys(row);

        return {
          sistemaImpactado: getValue(['Sistema Impactado', 'Sistema', 'SISTEMA', 'sistema', 'Sistema Impactado', rowKeys[0] || '']),
          servico: getValue(['Serviço', 'Servico', 'SERVIÇO', 'Ticket', 'TICKET', 'ticket', '#', rowKeys[1] || '']),
          tipo: getValue(['Tipo', 'TIPO', 'tipo', rowKeys[2] || '']),
          status: getValue(['Status', 'STATUS', 'status', rowKeys[3] || '']),
          problema: getValue(['Problema', 'PROBLEMA', 'problema', 'Descrição', 'DESCRIÇÃO', 'Descricao', 'descricao', rowKeys[4] || '']),
          solucao: getValue(['Solução', 'SOLUÇÃO', 'Solucao', 'solucao', rowKeys[5] || '']),
          mediaMes: getValue(['Média mês', 'Média mes', 'Media mes', 'MÉDIA MÊS', 'mediaMes', rowKeys[6] || ''])
        };
      })
      .filter((item: CausaRaizItem) => {
        return (item.sistemaImpactado && item.sistemaImpactado.trim() !== '') ||
          (item.servico && item.servico.trim() !== '');
      });
  };

  useEffect(() => {
    // Carregar dados do Excel - Setembro 2025
    const carregarDados = async () => {
      try {
        setLoading(true);
        const XLSX = await import('xlsx');

        // Tentar carregar arquivo de Setembro 2025
        const response = await fetch('/dados/Chamados Causa Raiz Combio - Setembro 2025.xlsx');

        if (!response.ok) {
          // Se não encontrar, tentar o arquivo padrão
          const fallbackResponse = await fetch('/dados/Chamados Causa Raiz Combio - Outubro 2025.xlsx');
          if (!fallbackResponse.ok) {
            throw new Error(`Erro ao carregar arquivo: ${response.status}`);
          }
          const arrayBuffer = await fallbackResponse.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          processarWorkbook(workbook, XLSX);
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        processarWorkbook(workbook, XLSX);
      } catch (err) {
        console.error('Erro ao carregar dados do Excel:', err);
        setDados([]);
        setDadosConcluidos([]);
        setDadosEmAndamento([]);
        setLoading(false);
      }
    };

    const processarWorkbook = (workbook: any, XLSX: any) => {
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setDados([]);
        setDadosConcluidos([]);
        setDadosEmAndamento([]);
        setLoading(false);
        return;
      }

      // Procurar pelas abas
      let abaConcluidos: string | null = null;
      let abaEmAndamento: string | null = null;

      workbook.SheetNames.forEach((sheetName: string) => {
        const nameLower = sheetName.toLowerCase();
        if (nameLower.includes('conclu') || nameLower.includes('finalizado') || nameLower.includes('resolvido')) {
          abaConcluidos = sheetName;
        } else if (nameLower.includes('andamento') || nameLower.includes('em andamento') || nameLower.includes('pendente')) {
          abaEmAndamento = sheetName;
        }
      });

      if (!abaConcluidos && !abaEmAndamento) {
        abaConcluidos = workbook.SheetNames[0];
        if (workbook.SheetNames.length > 1) {
          abaEmAndamento = workbook.SheetNames[1];
        }
      } else if (!abaConcluidos) {
        abaConcluidos = workbook.SheetNames.find((name: string) => name !== abaEmAndamento) || workbook.SheetNames[0];
      } else if (!abaEmAndamento) {
        abaEmAndamento = workbook.SheetNames.find((name: string) => name !== abaConcluidos) || null;
      }

      // Processar aba de concluídos
      if (abaConcluidos) {
        const worksheetConcluidos = workbook.Sheets[abaConcluidos];
        const dadosConcluidosProcessados = processarAba(worksheetConcluidos, XLSX);
        setDadosConcluidos(dadosConcluidosProcessados);
      }

      // Processar aba de em andamento
      if (abaEmAndamento) {
        const worksheetEmAndamento = workbook.Sheets[abaEmAndamento];
        const dadosEmAndamentoProcessados = processarAba(worksheetEmAndamento, XLSX);
        setDadosEmAndamento(dadosEmAndamentoProcessados);
      }

      // Definir dados iniciais como concluídos (default)
      if (abaConcluidos) {
        const worksheetConcluidos = workbook.Sheets[abaConcluidos];
        const dadosIniciais = processarAba(worksheetConcluidos, XLSX);
        setDados(dadosIniciais);
      } else if (abaEmAndamento) {
        const worksheetEmAndamento = workbook.Sheets[abaEmAndamento];
        const dadosIniciais = processarAba(worksheetEmAndamento, XLSX);
        setDados(dadosIniciais);
      }

      setLoading(false);
    };

    carregarDados();
  }, []);

  // Atualizar dados quando a aba ativa mudar
  useEffect(() => {
    if (abaAtiva === 'concluidos') {
      setDados(dadosConcluidos);
    } else {
      setDados(dadosEmAndamento);
    }
  }, [abaAtiva, dadosConcluidos, dadosEmAndamento]);

  // Calcular totais
  const total = dados.length;
  const causaRaiz = dados.filter(item => item.tipo && item.tipo.toLowerCase().includes('causa raiz')).length;
  const melhoria = dados.filter(item => item.tipo && item.tipo.toLowerCase().includes('melhoria')).length;

  // Função para obter cor do status
  const getStatusColor = (status: string): string => {
    if (!status) return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('finalizado')) {
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    }
    if (statusLower.includes('liberado') || statusLower.includes('teste')) {
      return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
    }
    if (statusLower.includes('resolvido')) {
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    }
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  // Função para obter cor do tipo
  const getTipoColor = (tipo: string): string => {
    if (!tipo) return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('causa raiz')) {
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    }
    if (tipoLower.includes('melhoria')) {
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    }
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tabs para alternar entre Concluídos e Em Andamento */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setAbaAtiva('concluidos')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            abaAtiva === 'concluidos'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Concluídos
        </button>
        <button
          onClick={() => setAbaAtiva('em-andamento')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            abaAtiva === 'em-andamento'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Em Andamento
        </button>
      </div>

      <div className="mb-6">
        {/* Cards de Resumo - No Topo */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-white mb-2">Total</h3>
            <p className="text-5xl font-bold text-white">{total}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg p-6 shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-white mb-2">Causa Raiz</h3>
            <p className="text-5xl font-bold text-white">{causaRaiz}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-white mb-2">Melhoria</h3>
            <p className="text-5xl font-bold text-white">{melhoria}</p>
          </div>
        </div>
      </div>

      {/* Tabela - Ocupa toda a largura */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32 border-r border-blue-500">
                  Sistema Impactado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-24 border-r border-blue-500">
                  Serviço
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32 border-r border-blue-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-36 border-r border-blue-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[300px] border-r border-blue-500">
                  Problema
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[300px] border-r border-blue-500">
                  Solução
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider w-24">
                  Média mês
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhum dado encontrado
                  </td>
                </tr>
              ) : (
                dados.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">
                      {item.sistemaImpactado}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col gap-1">
                        {String(item.servico || '').split(',').map((serv, idx) => (
                          <span key={idx} className="whitespace-nowrap">
                            {serv.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm border-r border-gray-200 dark:border-gray-700">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getTipoColor(item.tipo)}`}>
                        {item.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-r border-gray-200 dark:border-gray-700">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 min-w-[300px] border-r border-gray-200 dark:border-gray-700">
                      {item.problema}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 min-w-[300px] border-r border-gray-200 dark:border-gray-700">
                      {item.solucao}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-center">
                      {item.mediaMes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SlideCausaRaizMelhoriasSetembro;

