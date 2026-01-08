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
import { useDateFilterContext } from '../../contexts/ServiceUpDateFilterContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const SlideSLAAnalista = () => {
  const { month, year, startDate, endDate, analistaFilter, analistasSelecionados } = useDateFilterContext();

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['chamados', 'sla-analista', month, year, startDate, endDate, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      try {
        const response = await chamadosApi.getSLAAnalista(month, year, startDate, endDate, analistaFilter, analistasSelecionados);
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

  const chartData = {
    labels: safeData.length > 0
      ? safeData.map((item: any) => String(item.analista || ''))
      : ['Sem dados'],
    datasets: [
      {
        label: 'Dentro do SLA',
        data: safeData.length > 0
          ? safeData.map((item: any) => Number(item.dentroSLA) || 0)
          : [0],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(1, '#059669');
          return gradient;
        },
        borderRadius: {
          topLeft: 12,
          topRight: 12,
          bottomLeft: 12,
          bottomRight: 12
        },
        borderSkipped: false,
        borderWidth: 0
      },
      {
        label: 'Fora do SLA',
        data: safeData.length > 0
          ? safeData.map((item: any) => Number(item.foraSLA) || 0)
          : [0],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, '#ef4444');
          gradient.addColorStop(1, '#dc2626');
          return gradient;
        },
        borderRadius: {
          topLeft: 12,
          topRight: 12,
          bottomLeft: 12,
          bottomRight: 12
        },
        borderSkipped: false,
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
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
        display: (context: any) => context.datasetIndex === 1,
        color: '#000000',
        font: {
          size: 11,
          weight: 'bold'
        },
        anchor: 'end' as const,
        align: 'top' as const,
        offset: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 4,
        padding: 4,
        borderColor: '#e5e7eb',
        borderWidth: 1,
        formatter: (value: any, context: any) => {
          if (!context || !context.chart || !context.chart.data || !context.chart.data.datasets) {
            return '0.0%';
          }
          const dentroSLA = Number(context.chart.data.datasets[0]?.data[context.dataIndex]) || 0;
          const foraSLA = Number(context.chart.data.datasets[1]?.data[context.dataIndex]) || 0;
          const total = dentroSLA + foraSLA;
          if (total === 0) return '0.0%';
          const percentual = (dentroSLA / total) * 100;
          return (isNaN(percentual) ? 0 : percentual).toFixed(1) + '%';
        }
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
        caretSize: 8
      }
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: '600'
          },
          padding: 8
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b',
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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300 text-center mb-4">SLA por Analista</h3>

        <div className="flex justify-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
            <span className="text-slate-700 dark:text-gray-300 font-semibold text-sm">Dentro do SLA</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-rose-500 rounded-full"></div>
            <span className="text-slate-700 dark:text-gray-300 font-semibold text-sm">Fora do SLA</span>
          </div>
        </div>

        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default SlideSLAAnalista;

