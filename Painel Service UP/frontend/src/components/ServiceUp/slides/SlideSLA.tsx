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
import { chamadosApi } from '../../../services/api';
import { useDateFilterContext } from '../../../contexts/ServiceUpDateFilterContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const SlideSLA = () => {
  const { month, year, startDate, endDate, analistaFilter, analistasSelecionados } = useDateFilterContext();

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['chamados', 'sla', month, year, startDate, endDate, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      try {
        const response = await chamadosApi.getSLA(month, year, startDate, endDate, analistaFilter, analistasSelecionados);
        return response.data || [];
      } catch (err) {
        console.error('Erro ao buscar dados SLA:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const safeData = (!isError && !isLoading && data && Array.isArray(data) && data.length > 0) ? data : [];
  const mediaAnual = safeData.length > 0
    ? safeData.reduce((sum: number, item: any) => sum + (Number(item.dentroSLA) || 0), 0) / safeData.length
    : 0;
  const ultimoMes = safeData[safeData.length - 1] || { dentroSLA: 0, foraSLA: 0 };
  const penultimoMes = safeData[safeData.length - 2] || { dentroSLA: 0, foraSLA: 0 };
  const variacao = (Number(ultimoMes.dentroSLA) || 0) - (Number(penultimoMes.dentroSLA) || 0);

  const chartData = {
    labels: safeData.length > 0
      ? safeData.map((item: any) => String(item.mes || ''))
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
          size: 10,
          weight: 'bold'
        },
        anchor: 'center' as const,
        align: 'right' as const,
        offset: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 4,
        padding: 4,
        borderColor: '#e5e7eb',
        borderWidth: 1,
        formatter: (value: any) => {
          const numValue = Number(value);
          return (isNaN(numValue) ? 0 : numValue).toFixed(1) + '%';
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
        max: 100,
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
          padding: 8,
          callback: (value: any) => value + '%'
        }
      },
      y: {
        stacked: true,
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
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900 dark:to-cyan-800 rounded-xl p-5 shadow-md border-2 border-cyan-300 dark:border-cyan-600">
          <div className="bg-cyan-200 dark:bg-cyan-700 rounded-lg p-2 -m-5 mb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 text-center">Meta</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-gray-200 text-center">90%</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 rounded-xl p-5 shadow-md border-2 border-emerald-300 dark:border-emerald-600">
          <div className="bg-emerald-200 dark:bg-emerald-700 rounded-lg p-2 -m-5 mb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 text-center">Média</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-300 text-center">
            {isNaN(mediaAnual) ? '0.00' : mediaAnual.toFixed(2)}%
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-xl p-5 shadow-md border-2 border-orange-300 dark:border-orange-600">
          <div className="bg-orange-200 dark:bg-orange-700 rounded-lg p-2 -m-5 mb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 text-center">Variação</h3>
          </div>
          <p className="text-3xl font-bold text-orange-800 dark:text-orange-300 text-center">
            {variacao > 0 ? '+' : ''}{isNaN(variacao) ? '0.0' : variacao.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300 text-center mb-4">
          SLA por Mês
        </h3>

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

        <div className="h-72">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default SlideSLA;

