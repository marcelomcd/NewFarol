import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chamadosService } from '../../services/api';
import { useAnalistaFilterContext } from '../../contexts/AnalistaFilterContext';

const SlideDashboardChamados = () => {
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [filtroTempoAberto, setFiltroTempoAberto] = useState(null);
  const [filtroUltimaAtualizacao, setFiltroUltimaAtualizacao] = useState(null);
  const [filtroResponsavel, setFiltroResponsavel] = useState(null);
  const [filtroTicket, setFiltroTicket] = useState(null);

  // Obter filtro de analista do contexto
  const { analistaFilter, analistasSelecionados } = useAnalistaFilterContext();

  // Buscar dados dos dashboards (com suporte a filtro por ticket e analista)
  const { data: statusDataOriginal = [] } = useQuery({
    queryKey: ['dashboard-status', filtroTicket, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      const response = await chamadosService.getDashboardStatus(filtroTicket, analistaFilter, analistasSelecionados);
      return response.data || [];
    },
  });

  const { data: tempoAbertoDataOriginal = [] } = useQuery({
    queryKey: ['dashboard-tempo-aberto', filtroTicket, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      const response = await chamadosService.getDashboardTempoAberto(filtroTicket, analistaFilter, analistasSelecionados);
      return response.data || [];
    },
  });

  const { data: ultimaAtualizacaoDataOriginal = [] } = useQuery({
    queryKey: ['dashboard-ultima-atualizacao', filtroTicket, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      const response = await chamadosService.getDashboardUltimaAtualizacao(filtroTicket, analistaFilter, analistasSelecionados);
      return response.data || [];
    },
  });

  // Detalhes filtra por todos os filtros, incluindo ticket e analista quando selecionado
  const { data: detalhesData = { dados: [], total: 0 } } = useQuery({
    queryKey: ['dashboard-detalhes', filtroStatus, filtroTempoAberto, filtroUltimaAtualizacao, filtroResponsavel, filtroTicket, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      const response = await chamadosService.getDashboardDetalhes(
        filtroStatus,
        filtroTempoAberto,
        filtroUltimaAtualizacao,
        filtroResponsavel,
        filtroTicket,
        analistaFilter,
        analistasSelecionados
      );
      return response.data || { dados: [], total: 0 };
    },
  });

  // Buscar dados do ticket específico quando há filtroTicket (para recalcular outros dashboards)
  const { data: detalhesTicketData = { dados: [], total: 0 } } = useQuery({
    queryKey: ['dashboard-detalhes-ticket', filtroTicket, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      if (!filtroTicket) return { dados: [], total: 0 };
      const response = await chamadosService.getDashboardDetalhes(
        null,
        null,
        null,
        null,
        filtroTicket,
        analistaFilter,
        analistasSelecionados
      );
      return response.data || { dados: [], total: 0 };
    },
    enabled: !!filtroTicket, // Só busca se houver filtroTicket
  });

  const { data: causaRaizData = { dados: [], total: 0 } } = useQuery({
    queryKey: ['dashboard-causa-raiz', analistaFilter, analistasSelecionados],
    queryFn: async () => {
      const response = await chamadosService.getDashboardCausaRaiz(null, analistaFilter, analistasSelecionados);
      return response.data || { dados: [], total: 0 };
    },
  });

  const { data: emAndamentoData = { total: 0, dados: [] } } = useQuery({
    queryKey: ['dashboard-em-andamento', analistaFilter, analistasSelecionados],
    queryFn: async () => {
      const response = await chamadosService.getDashboardEmAndamento(null, analistaFilter, analistasSelecionados);
      return response.data || { total: 0, dados: [] };
    },
  });

  // Função auxiliar para calcular categoria de tempo aberto
  const calcularCategoriaTempoAberto = (dataCriacao) => {
    if (!dataCriacao) return null;
    const dias = Math.floor((new Date() - new Date(dataCriacao)) / (1000 * 60 * 60 * 24));
    if (dias <= 1) return 'Até 1 dia';
    if (dias >= 2 && dias <= 5) return 'De 2 a 5 dias';
    if (dias >= 6 && dias <= 10) return 'De 6 a 10 dias';
    if (dias >= 11 && dias <= 20) return 'De 11 a 20 dias';
    if (dias >= 21 && dias <= 30) return 'De 21 a 30 dias';
    return 'Mais de 30 dias';
  };

  // Função auxiliar para obter cor baseada na categoria
  const getCorPorCategoria = (categoria) => {
    if (!categoria) return 'gray';
    if (categoria === 'Até 1 dia') return 'verde';
    if (categoria === 'De 2 a 5 dias') return 'amarelo';
    if (categoria === 'De 6 a 10 dias') return 'amarelo';
    if (categoria === 'De 11 a 20 dias') return 'vermelho';
    if (categoria === 'De 21 a 30 dias') return 'vermelho';
    if (categoria === 'Mais de 30 dias') return 'vermelho';
    return 'gray';
  };

  // Função auxiliar para calcular categoria de última atualização
  const calcularCategoriaUltimaAtualizacao = (dataAlteracao) => {
    if (!dataAlteracao) return null;
    const dias = Math.floor((new Date() - new Date(dataAlteracao)) / (1000 * 60 * 60 * 24));
    if (dias <= 1) return 'Até 1 dia';
    if (dias >= 2 && dias <= 5) return 'De 2 a 5 dias';
    if (dias >= 6 && dias <= 10) return 'De 6 a 10 dias';
    if (dias >= 11 && dias <= 20) return 'De 11 a 20 dias';
    if (dias >= 21 && dias <= 30) return 'De 21 a 30 dias';
    return 'Mais de 30 dias';
  };

  // Filtrar dados baseado nos filtros ativos
  // Quando há filtro por ticket, usa os dados do ticket específico para recalcular
  const statusDataFiltrado = useMemo(() => {
    // Se há filtro por ticket, recalcular baseado nos dados do ticket específico
    if (filtroTicket && detalhesTicketData.dados?.length > 0) {
      const statusCount = {};
      detalhesTicketData.dados?.forEach(item => {
        if (item.status) {
          statusCount[item.status] = (statusCount[item.status] || 0) + 1;
        }
      });

      return statusDataOriginal.map(item => ({
        ...item,
        quantidade: statusCount[item.status] || 0
      })).filter(item => item.quantidade > 0);
    }

    // Se não há outros filtros, retornar dados originais (com filtro de status se houver)
    if (!filtroTempoAberto && !filtroUltimaAtualizacao && !filtroResponsavel) {
      if (filtroStatus) {
        return statusDataOriginal.filter(item => item.status === filtroStatus);
      }
      return statusDataOriginal;
    }

    // Recalcular baseado nos detalhes quando há outros filtros
    const statusCount = {};
    detalhesData.dados?.forEach(item => {
      if (item.status) {
        statusCount[item.status] = (statusCount[item.status] || 0) + 1;
      }
    });

    return statusDataOriginal.map(item => ({
      ...item,
      quantidade: statusCount[item.status] || 0
    })).filter(item => item.quantidade > 0);
  }, [statusDataOriginal, detalhesData.dados, detalhesTicketData.dados, filtroStatus, filtroTempoAberto, filtroUltimaAtualizacao, filtroResponsavel, filtroTicket]);

  const tempoAbertoDataFiltrado = useMemo(() => {
    // Se há filtro por ticket, recalcular baseado nos dados do ticket específico
    if (filtroTicket && detalhesTicketData.dados?.length > 0) {
      const categoriaCount = {};
      detalhesTicketData.dados?.forEach(item => {
        const categoria = calcularCategoriaTempoAberto(item.data_criacao);
        if (categoria) {
          categoriaCount[categoria] = (categoriaCount[categoria] || 0) + 1;
        }
      });

      return tempoAbertoDataOriginal.map(item => ({
        ...item,
        quantidade: categoriaCount[item.categoria] || 0,
        cor: getCorPorCategoria(item.categoria)
      }));
    }

    // Se não há outros filtros, retornar dados originais
    if (!filtroStatus && !filtroUltimaAtualizacao && !filtroResponsavel) {
      return tempoAbertoDataOriginal;
    }

    // Recalcular baseado nos detalhes quando há outros filtros
    const categoriaCount = {};
    detalhesData.dados?.forEach(item => {
      const categoria = calcularCategoriaTempoAberto(item.data_criacao);
      if (categoria) {
        categoriaCount[categoria] = (categoriaCount[categoria] || 0) + 1;
      }
    });

    return tempoAbertoDataOriginal.map(item => ({
      ...item,
      quantidade: categoriaCount[item.categoria] || 0,
      cor: getCorPorCategoria(item.categoria)
    }));
  }, [tempoAbertoDataOriginal, detalhesData.dados, detalhesTicketData.dados, filtroStatus, filtroUltimaAtualizacao, filtroResponsavel, filtroTicket]);

  const ultimaAtualizacaoDataFiltrado = useMemo(() => {
    // Se há filtro por ticket, recalcular baseado nos dados do ticket específico
    if (filtroTicket && detalhesTicketData.dados?.length > 0) {
      const categoriaCount = {};
      detalhesTicketData.dados?.forEach(item => {
        const categoria = calcularCategoriaUltimaAtualizacao(item.data_alteracao);
        if (categoria) {
          categoriaCount[categoria] = (categoriaCount[categoria] || 0) + 1;
        }
      });

      return ultimaAtualizacaoDataOriginal.map(item => ({
        ...item,
        quantidade: categoriaCount[item.categoria] || 0
      }));
    }

    // Se não há outros filtros internos, retornar dados originais (já filtrados por analista no backend)
    if (!filtroStatus && !filtroTempoAberto && !filtroResponsavel) {
      return ultimaAtualizacaoDataOriginal;
    }

    // Recalcular baseado nos detalhes quando há outros filtros
    const categoriaCount = {};
    detalhesData.dados?.forEach(item => {
      const categoria = calcularCategoriaUltimaAtualizacao(item.data_alteracao);
      if (categoria) {
        categoriaCount[categoria] = (categoriaCount[categoria] || 0) + 1;
      }
    });

    return ultimaAtualizacaoDataOriginal.map(item => ({
      ...item,
      quantidade: categoriaCount[item.categoria] || 0
    }));
  }, [ultimaAtualizacaoDataOriginal, detalhesData.dados, detalhesTicketData.dados, filtroStatus, filtroTempoAberto, filtroResponsavel, filtroTicket, analistaFilter, analistasSelecionados]);

  // Causa Raiz e Em Andamento sempre mostram a lista completa
  // Apenas aplicam filtros de status/tempo/responsável, mas não filtram por ticket
  // O ticket selecionado é apenas destacado visualmente
  // Os dados já vêm filtrados por analista do backend
  const causaRaizDataFiltrado = useMemo(() => {
    // Se não há filtros internos, retornar dados originais (já filtrados por analista no backend)
    if (!filtroStatus && !filtroTempoAberto && !filtroUltimaAtualizacao && !filtroResponsavel && !filtroTicket) {
      return causaRaizData;
    }

    // Recalcular baseado nos detalhes quando há filtros (incluindo ticket)
    const ticketsFiltrados = new Set(detalhesData.dados?.map(item => item.ticket) || []);
    const dadosFiltrados = causaRaizData.dados?.filter(item => ticketsFiltrados.has(item.ticket)) || [];

    return {
      dados: dadosFiltrados,
      total: dadosFiltrados.length
    };
  }, [causaRaizData, detalhesData.dados, filtroStatus, filtroTempoAberto, filtroUltimaAtualizacao, filtroResponsavel, filtroTicket, analistaFilter, analistasSelecionados]);

  const emAndamentoDataFiltrado = useMemo(() => {
    // Se não há filtros internos, retornar dados originais (já filtrados por analista no backend)
    if (!filtroStatus && !filtroTempoAberto && !filtroUltimaAtualizacao && !filtroResponsavel && !filtroTicket) {
      return emAndamentoData;
    }

    // Recalcular baseado nos detalhes quando há filtros (incluindo ticket)
    const ticketsFiltrados = new Set(detalhesData.dados?.map(item => item.ticket) || []);
    const dadosFiltrados = emAndamentoData.dados?.filter(item => ticketsFiltrados.has(item.ticket)) || [];

    return {
      dados: dadosFiltrados,
      total: dadosFiltrados.length
    };
  }, [emAndamentoData, detalhesData.dados, filtroStatus, filtroTempoAberto, filtroUltimaAtualizacao, filtroResponsavel, filtroTicket, analistaFilter, analistasSelecionados]);

  // Função para obter cor do semáforo
  const getCorSemafaro = (cor) => {
    switch (cor) {
      case 'verde':
        return 'bg-green-500';
      case 'amarelo':
        return 'bg-yellow-500';
      case 'vermelho':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Função para formatar data
  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const data = new Date(dataStr);
    return data.toLocaleString('pt-BR', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltroStatus(null);
    setFiltroTempoAberto(null);
    setFiltroUltimaAtualizacao(null);
    setFiltroResponsavel(null);
    setFiltroTicket(null);
  };

  // Verificar se há filtros ativos
  const temFiltros = filtroStatus || filtroTempoAberto || filtroUltimaAtualizacao || filtroResponsavel || filtroTicket;

  // Função para lidar com clique em status
  const handleClickStatus = (status) => {
    if (filtroStatus === status) {
      limparFiltros();
    } else {
      setFiltroStatus(status);
      setFiltroTempoAberto(null);
      setFiltroUltimaAtualizacao(null);
      setFiltroResponsavel(null);
      setFiltroTicket(null);
    }
  };

  // Função para lidar com clique em tempo aberto
  const handleClickTempoAberto = (categoria) => {
    if (filtroTempoAberto === categoria) {
      limparFiltros();
    } else {
      setFiltroTempoAberto(categoria);
      setFiltroStatus(null);
      setFiltroUltimaAtualizacao(null);
      setFiltroResponsavel(null);
      setFiltroTicket(null);
    }
  };

  // Função para lidar com clique em última atualização
  const handleClickUltimaAtualizacao = (categoria) => {
    if (filtroUltimaAtualizacao === categoria) {
      limparFiltros();
    } else {
      setFiltroUltimaAtualizacao(categoria);
      setFiltroStatus(null);
      setFiltroTempoAberto(null);
      setFiltroResponsavel(null);
      setFiltroTicket(null);
    }
  };

  // Função para lidar com clique em responsável
  const handleClickResponsavel = (responsavel) => {
    if (filtroResponsavel === responsavel) {
      limparFiltros();
    } else {
      setFiltroResponsavel(responsavel);
      setFiltroStatus(null);
      setFiltroTempoAberto(null);
      setFiltroUltimaAtualizacao(null);
      setFiltroTicket(null);
    }
  };

  // Função para lidar com clique em ticket
  const handleClickTicket = (ticket) => {
    if (filtroTicket === ticket) {
      limparFiltros();
    } else {
      setFiltroTicket(ticket);
      setFiltroStatus(null);
      setFiltroTempoAberto(null);
      setFiltroUltimaAtualizacao(null);
      setFiltroResponsavel(null);
    }
  };

  return (
    <div className="w-full h-full p-2 bg-gray-50 flex flex-col">
      <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
        {/* LADO ESQUERDO - 3 Dashboards + Detalhes */}
        <div className="col-span-9 flex flex-col min-h-0">
          {/* PRIMEIRA LINHA - 3 Dashboards finos */}
          <div className="grid grid-cols-3 gap-2 flex-shrink-0 mb-4" style={{ height: '350px' }}>
            {/* 1. Chamados por Status */}
            <div className="bg-white rounded-lg shadow-md p-2 flex flex-col" style={{ height: '350px', maxHeight: '350px' }}>
              <h3 className="text-sm font-bold text-gray-800 mb-1">Chamados por Status</h3>
              <div className="overflow-y-auto flex-1 min-h-0 scrollbar-thin-hover" style={{ maxHeight: 'calc(350px - 50px)' }}>
                {statusDataFiltrado.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-1 px-1 font-semibold text-gray-700">Status</th>
                        <th className="text-right py-1 px-1 font-semibold text-gray-700">Qtd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusDataFiltrado.map((item, index) => (
                        <tr
                          key={index}
                          className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${filtroStatus === item.status ? 'bg-blue-100' : ''
                            }`}
                          onClick={() => handleClickStatus(item.status)}
                        >
                          <td className="py-1 px-1 text-gray-800 text-sm">{item.status}</td>
                          <td className="py-1 px-1 text-right font-semibold text-gray-800 text-sm">
                            {item.quantidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    Nada para exibir aqui
                  </div>
                )}
              </div>
            </div>

            {/* 2. Tempo de chamados (Aberto) */}
            <div className="bg-white rounded-lg shadow-md p-2 flex flex-col" style={{ height: '350px', maxHeight: '350px' }}>
              <h3 className="text-sm font-bold text-gray-800 mb-1">Tempo de chamados (Aberto)</h3>
              <div className="overflow-y-auto flex-1 min-h-0 scrollbar-thin-hover" style={{ maxHeight: 'calc(350px - 50px)' }}>
                {tempoAbertoDataFiltrado.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-1 px-1 font-semibold text-gray-700">Criado</th>
                        <th className="text-center py-1 px-1 font-semibold text-gray-700 w-2"></th>
                        <th className="text-right py-1 px-1 font-semibold text-gray-700">Qtd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempoAbertoDataFiltrado.map((item, index) => (
                        <tr
                          key={index}
                          className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${filtroTempoAberto === item.categoria ? 'bg-blue-100' : ''
                            }`}
                          onClick={() => handleClickTempoAberto(item.categoria)}
                        >
                          <td className="py-1 px-1 text-gray-800 text-sm">{item.categoria}</td>
                          <td className="py-1 px-1 text-center">
                            <div className={`w-2 h-2 rounded-full ${getCorSemafaro(item.cor)} mx-auto`}></div>
                          </td>
                          <td className="py-1 px-1 text-right font-semibold text-gray-800 text-sm">
                            {item.quantidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    Nada para exibir aqui
                  </div>
                )}
              </div>
            </div>

            {/* 3. Última atualização */}
            <div className="bg-white rounded-lg shadow-md p-2 flex flex-col" style={{ height: '350px', maxHeight: '350px' }}>
              <h3 className="text-sm font-bold text-gray-800 mb-1">Última atualização</h3>
              <div className="overflow-y-auto flex-1 min-h-0 scrollbar-thin-hover" style={{ maxHeight: 'calc(350px - 50px)' }}>
                {ultimaAtualizacaoDataFiltrado.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-1 px-1 font-semibold text-gray-700">Atualização</th>
                        <th className="text-center py-1 px-1 font-semibold text-gray-700 w-2"></th>
                        <th className="text-right py-1 px-1 font-semibold text-gray-700">Qtd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ultimaAtualizacaoDataFiltrado.map((item, index) => (
                        <tr
                          key={index}
                          className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${filtroUltimaAtualizacao === item.categoria ? 'bg-blue-100' : ''
                            }`}
                          onClick={() => handleClickUltimaAtualizacao(item.categoria)}
                        >
                          <td className="py-1 px-1 text-gray-800 text-sm">{item.categoria}</td>
                          <td className="py-1 px-1 text-center">
                            <div className={`w-2 h-2 rounded-full ${getCorSemafaro(item.cor)} mx-auto`}></div>
                          </td>
                          <td className="py-1 px-1 text-right font-semibold text-gray-800 text-sm">
                            {item.quantidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    Nada para exibir aqui
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEGUNDA LINHA - Detalhes dos Chamados */}
          <div className="bg-white rounded-lg shadow-md p-2 flex flex-col" style={{ height: '350px', maxHeight: '350px' }}>
            <div className="flex justify-between items-center mb-1 flex-shrink-0">
              <h3 className="text-sm font-bold text-gray-800">Detalhes dos Chamados</h3>
              {temFiltros && (
                <button
                  onClick={limparFiltros}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 scrollbar-thin-hover" style={{ maxHeight: 'calc(350px - 50px)' }}>
              {detalhesData.dados?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-1 px-1 font-semibold text-gray-700">Ticket</th>
                      <th className="text-left py-1 px-1 font-semibold text-gray-700">Responsável</th>
                      <th className="text-left py-1 px-1 font-semibold text-gray-700">Data Criação</th>
                      <th className="text-left py-1 px-1 font-semibold text-gray-700">Data Alteração</th>
                      <th className="text-center py-1 px-1 font-semibold text-gray-700">Atualização</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalhesData.dados?.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${filtroTicket === item.ticket ? 'bg-blue-100' : ''
                          } ${filtroResponsavel === item.responsavel ? 'bg-blue-50' : ''}`}
                      >
                        <td
                          className="py-1 px-1 text-gray-800"
                          onClick={() => handleClickTicket(item.ticket)}
                        >
                          {item.ticket}
                        </td>
                        <td
                          className="py-1 px-1 text-gray-800"
                          onClick={() => handleClickResponsavel(item.responsavel)}
                        >
                          {item.responsavel}
                        </td>
                        <td className="py-1 px-1 text-gray-800">{formatarData(item.data_criacao)}</td>
                        <td className="py-1 px-1 text-gray-800">{formatarData(item.data_alteracao)}</td>
                        <td className="py-1 px-1 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${getCorSemafaro(item.cor_atualizacao)}`}
                            ></div>
                            <span className="text-gray-800">{item.atualizacao}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 sticky bottom-0 z-10">
                    <tr>
                      <td colSpan="4" className="py-1 px-1 font-bold text-gray-800">
                        Total
                      </td>
                      <td className="py-1 px-1 text-center font-bold text-gray-800">
                        {detalhesData.total || 0} registros
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  Nada para exibir aqui
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LADO DIREITO - Causa Raiz e Em Andamento SEPARADOS com padding */}
        <div className="col-span-3 flex flex-col gap-2">
          {/* Causa Raiz - EM CIMA */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-2 flex flex-col" style={{ height: '350px', maxHeight: '350px' }}>
            <h3 className="text-sm font-bold text-white mb-1">Causa Raiz</h3>
            <div className="text-center mb-1">
              <div className="text-2xl font-bold text-white mb-0.5">{causaRaizDataFiltrado.total || 0}</div>
              <div className="text-white text-sm font-semibold">Resolvido</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-1 overflow-y-auto scrollbar-thin-hover" style={{ maxHeight: 'calc(350px - 80px)' }}>
              {causaRaizDataFiltrado.dados?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-green-600 bg-opacity-50 z-10">
                    <tr className="border-b border-white border-opacity-30">
                      <th className="text-left py-1 px-1 font-semibold text-white">Ticket</th>
                      <th className="text-left py-1 px-1 font-semibold text-white">Responsável</th>
                    </tr>
                  </thead>
                  <tbody>
                    {causaRaizDataFiltrado.dados?.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-b border-white border-opacity-20 cursor-pointer hover:bg-white hover:bg-opacity-30 transition-colors ${filtroTicket === item.ticket ? 'bg-white bg-opacity-30' : ''
                          }`}
                        onClick={() => handleClickTicket(item.ticket)}
                      >
                        <td className="py-1 px-1 text-white text-sm">{item.ticket}</td>
                        <td className="py-1 px-1 text-white text-sm">{item.responsavel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full text-white text-sm opacity-75">
                  Nada para exibir aqui
                </div>
              )}
            </div>
          </div>

          {/* Em Andamento - EM BAIXO */}
          <div className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg shadow-md p-2 flex flex-col" style={{ height: '350px', maxHeight: '350px' }}>
            <h3 className="text-sm font-bold text-white mb-1">Em Andamento</h3>
            <div className="text-center mb-1">
              <div className="text-2xl font-bold text-white mb-0.5">{emAndamentoDataFiltrado.total || 0}</div>
              <div className="text-white text-sm font-semibold">Em Andamento</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-1 overflow-y-auto scrollbar-thin-hover" style={{ maxHeight: 'calc(350px - 80px)' }}>
              {emAndamentoDataFiltrado.dados?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-teal-500 bg-opacity-50 z-10">
                    <tr className="border-b border-white border-opacity-30">
                      <th className="text-left py-1 px-1 font-semibold text-white">Ticket</th>
                      <th className="text-left py-1 px-1 font-semibold text-white">Nome</th>
                      <th className="text-left py-1 px-1 font-semibold text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emAndamentoDataFiltrado.dados?.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-b border-white border-opacity-20 cursor-pointer hover:bg-white hover:bg-opacity-30 transition-colors ${filtroTicket === item.ticket ? 'bg-white bg-opacity-30' : ''
                          }`}
                        onClick={() => handleClickTicket(item.ticket)}
                      >
                        <td className="py-1 px-1 text-white text-sm">{item.ticket}</td>
                        <td className="py-1 px-1 text-white text-sm">{item.nome}</td>
                        <td className="py-1 px-1 text-white text-sm">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full text-white text-sm opacity-75">
                  Nada para exibir aqui
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideDashboardChamados;
