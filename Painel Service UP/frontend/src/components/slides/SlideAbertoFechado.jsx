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
import { chamadosService } from '../../services/api';
import { useDateFilterContext } from '../../contexts/DateFilterContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const SlideAbertoFechado = () => {
  const { year, analistaFilter, analistasSelecionados } = useDateFilterContext();

  // Ano atual como padrão quando não há filtros
  const currentYear = new Date().getFullYear();
  const effectiveYear = year || currentYear;

  // Sempre usar filtro por ano (ignorar mês)
  const monthToUse = null;
  const yearToUse = effectiveYear;
  const startDateToUse = null;
  const endDateToUse = null;

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['chamados', 'aberto-fechado', monthToUse, yearToUse, startDateToUse, endDateToUse, analistaFilter, analistasSelecionados],
    queryFn: async () => {
      try {
        const response = await chamadosService.getAbertoFechado(monthToUse, yearToUse, startDateToUse, endDateToUse, analistaFilter, analistasSelecionados);
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

  // Calcular totais por ano (somar todos os meses)
  const totalAnual = safeData.reduce((acc, item) => {
    return {
      fechado: acc.fechado + (Number(item.fechado) || 0),
      aberto: acc.aberto + (Number(item.aberto) || 0)
    };
  }, { fechado: 0, aberto: 0 });

  const fechado = totalAnual.fechado;
  const aberto = totalAnual.aberto;
  const titulo = String(effectiveYear);

  // Formatar labels dos meses (2025-01 -> Jan/25)
  const formatMonthLabel = (mesStr) => {
    if (!mesStr) return '';
    const mesesAbrev = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = mesStr.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const month = parseInt(parts[1]);
      const yearShort = year.length === 4 ? year.slice(-2) : year;
      return `${mesesAbrev[month - 1]}/${yearShort}`;
    }
    return mesStr;
  };

  const chartData = {
    labels: safeData.length > 0
      ? safeData.map(item => formatMonthLabel(String(item.mes || '')))
      : ['Sem dados'],
    datasets: [
      {
        label: 'Fechado',
        data: safeData.length > 0
          ? safeData.map(item => Number(item.fechado) || 0)
          : [0],
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(1, '#059669');
          return gradient;
        },
        borderRadius: 12,
        borderSkipped: false,
        borderWidth: 0
      },
      {
        label: 'Aberto',
        data: safeData.length > 0
          ? safeData.map(item => Number(item.aberto) || 0)
          : [0],
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, '#ef4444');
          gradient.addColorStop(1, '#dc2626');
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
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600'
          },
          color: '#475569'
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
        offset: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 4,
        padding: 4,
        borderColor: '#e5e7eb',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
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
      easing: 'easeInOutQuart'
    }
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-5 mb-5 shadow-lg">
        <h2 className="text-xl font-bold text-white text-center mb-2">
          Total de Chamados – {titulo}
        </h2>
        <p className="text-2xl font-bold text-white text-center">
          Fechados: {fechado} | Abertos: {aberto}
        </p>
      </div>

      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
        <div className="h-56">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default SlideAbertoFechado;
