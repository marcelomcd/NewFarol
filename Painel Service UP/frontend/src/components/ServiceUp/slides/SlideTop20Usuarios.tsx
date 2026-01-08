import { useQuery } from '@tanstack/react-query';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { chamadosApi } from '../../services/api';
import { useDateFilterContext } from '../../contexts/ServiceUpDateFilterContext.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const SlideTop20Usuarios = () => {
  const { month, year, startDate, endDate } = useDateFilterContext();

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['chamados', 'top-20-usuarios', month, year, startDate, endDate],
    queryFn: async () => {
      try {
        const response = await chamadosApi.getTop20Usuarios(month, year, startDate, endDate);
        return response.data || [];
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const safeData = (!isError && !isLoading && data && Array.isArray(data) && data.length > 0) ? data : [];

  const total = safeData.length > 0
    ? safeData.reduce((sum: number, item: any) => sum + (Number(item.quantidade) || 0), 0)
    : 0;

  const valores = safeData.map((item: any) => Number(item.quantidade) || 0);
  const maxValor = valores.length > 0 ? Math.max(...valores) + 20 : 100;

  // Função para determinar o texto do período filtrado
  const getPeriodoTexto = () => {
    if (month && month !== 0 && year) {
      const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      return `${meses[month]}/${year}`;
    } else if (year && (!month || month === 0)) {
      return `${year}`;
    } else if (month && month !== 0 && !year) {
      const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const currentYear = new Date().getFullYear();
      return `${meses[month]}/${currentYear}`;
    }
    return 'Período Atual';
  };

  const chartData = {
    labels: safeData.length > 0
      ? safeData.map((item: any) => String(item.usuario || 'Sem Usuário'))
      : ['Sem dados'],
    datasets: [
      {
        label: 'Chamados',
        data: safeData.length > 0
          ? safeData.map((item: any) => Number(item.quantidade) || 0)
          : [0],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 400, 0);
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(1, '#059669');
          return gradient;
        },
        borderRadius: 12,
        borderSkipped: false,
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        display: true,
        color: '#000000',
        font: {
          size: 12,
          weight: 'bold'
        },
        anchor: 'center' as const,
        align: 'right' as const,
        offset: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 4,
        padding: 4,
        borderColor: '#e5e7eb',
        borderWidth: 1
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
        borderColor: '#10b981',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        position: 'nearest' as const,
        yAlign: 'bottom' as const,
        xAlign: 'center' as const,
        caretPadding: 10,
        caretSize: 8,
        callbacks: {
          label: (context: any) => `Chamados: ${context.parsed.x}`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: maxValor,
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: '500'
          },
          padding: 8
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: '600'
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
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-2xl p-5 mb-5 shadow-lg">
        <h2 className="text-xl font-bold text-white text-center mb-2">
          Top 20 Usuários que Mais Abriram Chamados
        </h2>
        <p className="text-4xl font-bold text-white text-center">{total}</p>
        <p className="text-sm text-white/90 text-center mt-2">
          Período: {getPeriodoTexto()}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300 text-center mb-4">
          Ranking de Usuários
        </h3>
        <div className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500">Erro ao carregar dados</div>
            </div>
          ) : safeData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400">Nenhum dado disponível</div>
            </div>
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SlideTop20Usuarios;

