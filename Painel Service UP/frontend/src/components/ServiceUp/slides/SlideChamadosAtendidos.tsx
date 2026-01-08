import { useQuery } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { chamadosApi } from '../../services/api.js';
import { useDateFilterContext } from '../../contexts/ServiceUpDateFilterContext.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

const SlideChamadosAtendidos = () => {
  const { year, month, startDate, endDate, analistaFilter, analistasSelecionados } = useDateFilterContext();

  // Para o gráfico: sempre usar visão anual
  const currentYear = new Date().getFullYear();
  const selectedYear = year || currentYear;
  const yearStartDate = new Date(selectedYear, 0, 1).toISOString().split('T')[0];
  const yearEndDate = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString().split('T')[0];

  // Query para o gráfico (sempre anual)
  const { data: annualData = [], isLoading: isLoadingAnnual, isError: isErrorAnnual } = useQuery({
    queryKey: ['chamados', 'atendidos', 'annual', selectedYear, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      try {
        const response = await chamadosApi.getAtendidos(null, selectedYear, yearStartDate, yearEndDate, analistaFilter, analistasSelecionados);
        return response.data || [];
      } catch (err) {
        console.error('Erro ao buscar dados anuais:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Dados anuais para o gráfico
  const safeAnnualData = (!isErrorAnnual && !isLoadingAnnual && annualData && Array.isArray(annualData) && annualData.length > 0) ? annualData : [];

  // Função auxiliar para determinar o tipo de filtro
  const getFilterType = (): 'month' | 'year' | 'default' => {
    // CASO 1: Filtro por mês específico
    if (month && month !== 0 && year) {
      return 'month';
    }
    // CASO 2: Filtro por ano (todos os meses)
    if ((month === null || month === 0) && year) {
      return 'year';
    }
    return 'default';
  };

  const filterType = getFilterType();

  // Encontrar o mês filtrado nos dados anuais
  const getMesFiltrado = () => {
    const mesesAbrev = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // CASO 1: Filtro por mês específico
    if (filterType === 'month' && month && year) {
      const mesAbrev = mesesAbrev[month];
      const anoAbrev = String(year).slice(-2);
      const mesProcurado = `${mesAbrev}/${anoAbrev}`;
      const mesEncontrado = safeAnnualData.find((item: any) => item.mes === mesProcurado);
      return mesEncontrado || { chamados: 0, n1: 0, n2: 0, mes: mesProcurado };
    }

    // CASO 2: Filtro por ano (somar todos os meses)
    if (filterType === 'year' && year) {
      const totalAnual = safeAnnualData.reduce((acc: any, item: any) => {
        return {
          chamados: acc.chamados + (Number(item.chamados) || 0),
          n1: acc.n1 + (Number(item.n1) || 0),
          n2: acc.n2 + (Number(item.n2) || 0),
          mes: String(year)
        };
      }, { chamados: 0, n1: 0, n2: 0, mes: String(year) });
      return totalAnual;
    }

    // Default: último mês
    return safeAnnualData.length > 0 ? safeAnnualData[safeAnnualData.length - 1] : { chamados: 0, n1: 0, n2: 0, mes: '' };
  };

  const mesFiltrado = getMesFiltrado();

  // Buscar dados do período anterior para comparação
  const getPeriodoAnterior = (): { month: number; year: number; type: 'month' } | { month: null; year: number; type: 'year' } | null => {
    if (filterType === 'month' && month && year) {
      // Buscar mês anterior
      let mesAnterior = month - 1;
      let anoAnterior = year;
      if (mesAnterior === 0) {
        mesAnterior = 12;
        anoAnterior = year - 1;
      }
      return { month: mesAnterior, year: anoAnterior, type: 'month' };
    } else if (filterType === 'year' && year) {
      // Buscar ano anterior
      return { month: null, year: year - 1, type: 'year' };
    }
    return null;
  };

  const periodoAnterior = getPeriodoAnterior();

  // Query para buscar dados do período anterior
  const { data: previousPeriodData = [] } = useQuery({
    queryKey: ['chamados', 'atendidos', 'previous', periodoAnterior?.type, periodoAnterior?.month, periodoAnterior?.year, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      if (!periodoAnterior) return [];
      try {
        if (periodoAnterior.type === 'month') {
          // Buscar mês anterior
          const prevYearStartDate = new Date(periodoAnterior.year, 0, 1).toISOString().split('T')[0];
          const prevYearEndDate = new Date(periodoAnterior.year, 11, 31, 23, 59, 59).toISOString().split('T')[0];
          const response = await chamadosApi.getAtendidos(null, periodoAnterior.year, prevYearStartDate, prevYearEndDate, analistaFilter, analistasSelecionados);
          const data = response.data || [];
          const mesesAbrev = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const mesAbrev = mesesAbrev[periodoAnterior.month];
          const anoAbrev = String(periodoAnterior.year).slice(-2);
          const mesProcurado = `${mesAbrev}/${anoAbrev}`;
          const mesEncontrado = data.find((item: any) => item.mes === mesProcurado);
          return mesEncontrado ? [mesEncontrado] : [];
        } else if (periodoAnterior.type === 'year') {
          // Buscar ano anterior completo
          const prevYearStartDate = new Date(periodoAnterior.year, 0, 1).toISOString().split('T')[0];
          const prevYearEndDate = new Date(periodoAnterior.year, 11, 31, 23, 59, 59).toISOString().split('T')[0];
          const response = await chamadosApi.getAtendidos(null, periodoAnterior.year, prevYearStartDate, prevYearEndDate, analistaFilter, analistasSelecionados);
          return response.data || [];
        }
        return [];
      } catch (err) {
        console.error('Erro ao buscar dados do período anterior:', err);
        return [];
      }
    },
    enabled: !!periodoAnterior,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Calcular diferença baseada no tipo de filtro
  const calcularDiferenca = () => {
    if (!periodoAnterior || previousPeriodData.length === 0) {
      return { diferenca: 0, texto: 'Sem dados para comparação' };
    }

    const chamadosAtual = Number(mesFiltrado.chamados) || 0;

    if (filterType === 'month') {
      // Comparar com mês anterior
      const mesAnterior = previousPeriodData[0] || { chamados: 0 };
      const chamadosAnterior = Number(mesAnterior.chamados) || 0;
      const diferenca = chamadosAtual - chamadosAnterior;
      return {
        diferenca,
        texto: diferenca > 0
          ? `+${diferenca} chamados em relação ao mês anterior`
          : `${diferenca} chamados em relação ao mês anterior`
      };
    } else if (filterType === 'year') {
      // Comparar com ano anterior (somar todos os meses do ano anterior)
      const totalAnoAnterior = previousPeriodData.reduce((acc: number, item: any) => {
        return acc + (Number(item.chamados) || 0);
      }, 0);
      const diferenca = chamadosAtual - totalAnoAnterior;
      return {
        diferenca,
        texto: diferenca > 0
          ? `+${diferenca} chamados em relação ao ano anterior`
          : `${diferenca} chamados em relação ao ano anterior`
      };
    }

    return { diferenca: 0, texto: '' };
  };

  const { diferenca, texto } = calcularDiferenca();

  // Formatar mês/ano para exibição nos cards
  let mesAnoDisplay = '';
  if (filterType === 'month' && month && year) {
    const mesesAbrev = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mesAbrev = mesesAbrev[month];
    const anoAbrev = String(year).slice(-2);
    mesAnoDisplay = `${mesAbrev}/${anoAbrev}`;
  } else if (filterType === 'year' && year) {
    mesAnoDisplay = String(year);
  } else {
    mesAnoDisplay = (mesFiltrado as any).mes || (month && month !== 0 && month !== null && year ? `${String(month).padStart(2, '0')}/${year}` : (year ? `${year}` : ''));
  }

  // Função para identificar quais meses estão filtrados
  const getMesesFiltrados = () => {
    const mesesFiltrados = new Set<string>();
    const mesesAbrev = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // CASO 1: Filtro por mês específico
    if (filterType === 'month' && month && year) {
      const mesAbrev = mesesAbrev[month];
      const anoAbrev = String(year).slice(-2);
      const mesProcurado = `${mesAbrev}/${anoAbrev}`;
      mesesFiltrados.add(mesProcurado);
      return mesesFiltrados;
    }

    // CASO 2: Filtro por ano (todos os meses)
    if (filterType === 'year') {
      safeAnnualData.forEach((item: any) => {
        mesesFiltrados.add(item.mes);
      });
      return mesesFiltrados;
    }

    return mesesFiltrados;
  };

  const mesesFiltrados = getMesesFiltrados();

  // Cores: roxo padrão, laranja/dourado para filtrados
  const corPadrao = '#6366f1'; // Roxo
  const corFiltrado = '#f59e0b'; // Laranja/Amarelo
  const corBordaPadrao = '#ffffff';
  const corBordaFiltrado = '#ffffff';

  const valores = safeAnnualData.map((item: any) => Number(item.chamados) || 0).filter(v => v != null);
  const minValor = valores.length > 0 ? Math.max(0, Math.min(...valores) - 50) : 0;
  const maxValor = valores.length > 0 ? Math.max(...valores) + 50 : 100;

  // Criar arrays de cores para cada ponto baseado no filtro
  const pointBackgroundColors = safeAnnualData.length > 0
    ? safeAnnualData.map((item: any) =>
      mesesFiltrados.has(item.mes) ? corFiltrado : corPadrao
    )
    : [corPadrao];
  const pointBorderColors = safeAnnualData.length > 0
    ? safeAnnualData.map((item: any) =>
      mesesFiltrados.has(item.mes) ? corBordaFiltrado : corBordaPadrao
    )
    : [corBordaPadrao];
  const pointRadii = safeAnnualData.length > 0
    ? safeAnnualData.map((item: any) =>
      mesesFiltrados.has(item.mes) ? 7 : 5 // Pontos filtrados um pouco maiores
    )
    : [5];

  const chartData = {
    labels: safeAnnualData.length > 0
      ? safeAnnualData.map((item: any) => String(item.mes || ''))
      : ['Sem dados'],
    datasets: [
      {
        label: 'Chamados',
        data: safeAnnualData.length > 0
          ? safeAnnualData.map((item: any) => Number(item.chamados) || 0)
          : [0],
        borderColor: '#6366f1',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: pointBackgroundColors,
        pointBorderColor: pointBorderColors,
        pointRadius: pointRadii,
        pointHoverRadius: safeAnnualData.length > 0
          ? safeAnnualData.map((item: any) =>
            mesesFiltrados.has(item.mes) ? 10 : 8
          )
          : [8],
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 30,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        borderColor: '#6366f1',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        position: 'nearest' as const,
        yAlign: 'bottom' as const,
        xAlign: 'center' as const,
        caretPadding: 10,
        caretSize: 8,
        callbacks: {
          label: (context: any) => `Chamados: ${context.parsed.y}`
        }
      },
      datalabels: {
        display: true,
        color: '#000000',
        font: {
          size: 11,
          weight: '600'
        },
        anchor: (context: any) => {
          const index = context.dataIndex;
          const total = context.chart.data.labels.length;
          // Primeiro ponto: alinhar à direita
          if (index === 0) return 'start';
          // Último ponto: alinhar à esquerda
          if (index === total - 1) return 'end';
          // Demais pontos: centralizar
          return 'end';
        },
        align: 'top' as const,
        offset: (context: any) => {
          const index = context.dataIndex;
          const total = context.chart.data.labels.length;
          // Primeiro ponto: mais offset para evitar corte
          if (index === 0) return 15;
          // Último ponto: mais offset para evitar corte
          if (index === total - 1) return 15;
          // Demais pontos: offset padrão
          return 12;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 4,
        padding: 4,
        borderColor: '#e5e7eb',
        borderWidth: 1,
        clamp: false,
        clip: false
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: minValor,
        max: maxValor,
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          color: '#000000',
          font: {
            size: 11,
            weight: '500'
          },
          padding: 8
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#000000',
          font: {
            size: 11,
            weight: '500'
          },
          padding: 8
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-5 mb-5 shadow-lg">
        <h2 className="text-xl font-bold text-white text-center mb-2">
          Total de Chamados – {mesAnoDisplay || 'Carregando...'}
        </h2>
        <p className="text-4xl font-bold text-white text-center">{Number((mesFiltrado as any).chamados) || 0}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 rounded-lg p-5 shadow-md border-2 border-indigo-300 dark:border-indigo-600">
          <h3 className="text-base font-bold text-indigo-700 dark:text-indigo-300 text-center mb-2">N1</h3>
          <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-200 text-center">{Number((mesFiltrado as any).n1) || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-5 shadow-md border-2 border-purple-300 dark:border-purple-600">
          <h3 className="text-base font-bold text-purple-700 dark:text-purple-300 text-center mb-2">N2</h3>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-200 text-center">{Number((mesFiltrado as any).n2) || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900 rounded-lg p-5 border-2 border-indigo-200 dark:border-indigo-700 shadow-lg flex flex-col items-center justify-center">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full p-5 mb-4 shadow-lg">
            <i className="fas fa-chart-line text-white text-3xl"></i>
          </div>
          <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200 text-center leading-tight">
            {texto || 'Sem dados para comparação'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SlideChamadosAtendidos;

