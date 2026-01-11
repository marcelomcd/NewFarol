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

const SlideSatisfacaoGrafico = () => {
  const { month, year, startDate, endDate, analistaFilter, analistasSelecionados } = useDateFilterContext();

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['chamados', 'satisfacao', month, year, startDate, endDate, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      try {
        const response = await chamadosApi.getSatisfacao(month, year, startDate, endDate, analistaFilter, analistasSelecionados);
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
      ? safeData.map(item => String(item.analista || ''))
      : ['Sem dados'],
    datasets: [
      {
        label: 'Excelente',
        data: safeData.length > 0
          ? safeData.map(item => Number(item.excelente) || 0)
          : [0],
        backgroundColor: (context) => {
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
        label: 'Bom',
        data: safeData.length > 0
          ? safeData.map(item => Number(item.bom) || 0)
          : [0],
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(1, '#2563eb');
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
        label: 'Regular',
        data: safeData.length > 0
          ? safeData.map(item => Number(item.regular) || 0)
          : [0],
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, '#eab308');
          gradient.addColorStop(1, '#ca8a04');
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
        label: 'Ruim',
        data: safeData.length > 0
          ? safeData.map(item => Number(item.ruim) || 0)
          : [0],
        backgroundColor: (context) => {
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
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '600'
          },
          color: '#475569'
        }
      },
      datalabels: {
        display: (context) => context.datasetIndex === 3,
        color: '#000000',
        font: {
          size: 11,
          weight: 'bold'
        },
        anchor: 'end',
        align: 'top',
        offset: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 4,
        padding: 4,
        borderColor: '#e5e7eb',
        borderWidth: 1,
        formatter: (value, context) => {
          if (!context || !context.chart || !context.chart.data || !context.chart.data.datasets) {
            return '0';
          }
          const excelente = Number(context.chart.data.datasets[0]?.data[context.dataIndex]) || 0;
          const bom = Number(context.chart.data.datasets[1]?.data[context.dataIndex]) || 0;
          const total = excelente + bom;
          return (isNaN(total) ? 0 : total);
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
        position: 'nearest',
        yAlign: 'bottom',
        xAlign: 'center',
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
            weight: '500'
          },
          padding: 8
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
      easing: 'easeInOutQuart'
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm mb-4">
        <h3 className="text-lg font-bold text-slate-700 text-center mb-4">
          Satisfação Por Analista
        </h3>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Analista</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Excelente</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Bom</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Regular</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Ruim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {safeData.length > 0 ? safeData.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {item.analista || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-center">
                    {Number(item.excelente) || 0}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-600 text-center">
                    {Number(item.bom) || 0}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-yellow-600 text-center">
                    {Number(item.regular) || 0}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-red-600 text-center">
                    {Number(item.ruim) || 0}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-center text-slate-500">Nenhum dado disponível</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default SlideSatisfacaoGrafico;
