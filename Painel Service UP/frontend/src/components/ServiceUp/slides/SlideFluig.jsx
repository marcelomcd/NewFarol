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

const SlideFluig = () => {
  const { month, year, startDate, endDate, analistaFilter, analistasSelecionados } = useDateFilterContext();

  // Query para dados do backend (inclui dados mockados para novembro 2025)
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['chamados', 'fluig', month, year, startDate, endDate, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      try {
        const response = await chamadosApi.getFluig(month, year, startDate, endDate, analistaFilter, analistasSelecionados);
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
    ? safeData.reduce((sum, item) => sum + (Number(item.valor) || 0), 0)
    : 0;

  const valores = safeData.map(item => Number(item.valor) || 0);
  const maxValor = valores.length > 0 ? Math.max(...valores) * 1.2 : 100;

  const chartData = {
    labels: safeData.length > 0
      ? safeData.map(item => String(item.nome || ''))
      : ['Sem dados'],
    datasets: [
      {
        label: 'Chamados',
        data: safeData.length > 0
          ? safeData.map(item => Number(item.valor) || 0)
          : [0],
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, '#14b8a6');
          gradient.addColorStop(1, '#0d9488');
          return gradient;
        },
        borderRadius: 12,
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
      mode: 'index'
    },
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        display: true,
        color: '#000000',
        font: {
          size: 11,
          weight: 'bold'
        },
        anchor: 'end',
        align: 'top',
        offset: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 4,
        padding: {
          top: 4,
          bottom: 4,
          left: 6,
          right: 6
        },
        borderColor: '#e5e7eb',
        borderWidth: 1,
        formatter: (value) => value || '0'
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
        borderColor: '#14b8a6',
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
      y: {
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
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: '600'
          },
          padding: 8,
          maxRotation: 35,
          minRotation: 35
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
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl pt-6 pb-4 px-4 mb-4 shadow-lg">
        <h2 className="text-lg font-bold text-white text-center mb-1">
          Classificação por Serviço – Fluig
        </h2>
        <p className="text-3xl font-bold text-white text-center">{total}</p>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="h-64">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Carregando dados...</p>
            </div>
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SlideFluig;
