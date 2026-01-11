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

const SlideAnalistas = () => {
    const { month, year, startDate, endDate, analistaFilter, analistasSelecionados } = useDateFilterContext();

    const { data = [], isLoading, isError, error } = useQuery({
        queryKey: ['chamados', 'analistas', month, year, startDate, endDate, analistaFilter, analistasSelecionados],
        queryFn: async () => {
            try {
                const response = await chamadosApi.getAnalistas(month, year, startDate, endDate, analistaFilter, analistasSelecionados);
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
    const maxValor = valores.length > 0 ? Math.max(...valores) + 20 : 100;

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
                    const gradient = ctx.createLinearGradient(0, 0, 400, 0);
                    gradient.addColorStop(0, '#8b5cf6');
                    gradient.addColorStop(1, '#7c3aed');
                    return gradient;
                },
                borderRadius: 12,
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
                display: false
            },
            datalabels: {
                display: true,
                color: '#000000',
                font: {
                    size: 12,
                    weight: 'bold'
                },
                anchor: 'center',
                align: 'right',
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
            easing: 'easeInOutQuart'
        }
    };

    return (
        <div className="w-full">
            <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-5 mb-5 shadow-lg">
                <h2 className="text-xl font-bold text-white text-center mb-2">
                    Atendimento por Analista
                </h2>
                <p className="text-4xl font-bold text-white text-center">{total}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-700 text-center mb-4">
                    Qtde Chamados Por Analista
                </h3>
                <div className="h-80">
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
};

export default SlideAnalistas;
