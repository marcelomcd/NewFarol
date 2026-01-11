import { useQuery } from '@tanstack/react-query';
import { chamadosService } from '../../services/api';
import { useDateFilterContext } from '../../contexts/DateFilterContext';

const SlideSatisfacaoTabela = () => {
    const { month, year, startDate, endDate, analistaFilter, analistasSelecionados } = useDateFilterContext();

    const { data = [], isLoading, isError, error } = useQuery({
        queryKey: ['chamados', 'satisfacao-classificacao', month, year, startDate, endDate, analistaFilter, analistasSelecionados],
        queryFn: async () => {
            try {
                const response = await chamadosService.getSatisfacaoClassificacao(month, year, startDate, endDate, analistaFilter, analistasSelecionados);
                return response.data || [];
            } catch (err) {
                console.error('Erro ao buscar dados:', err);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    // Sempre usar dados seguros - nunca retornar early
    const safeData = (!isError && !isLoading && data && Array.isArray(data) && data.length > 0) ? data : [];

    const total = safeData.length > 0
        ? safeData.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
        : 0;

    const getColorClass = (classificacao) => {
        switch (classificacao?.toLowerCase()) {
            case 'excelente':
                return 'text-green-600';
            case 'bom':
                return 'text-blue-600';
            case 'regular':
                return 'text-yellow-600';
            case 'ruim':
                return 'text-red-600';
            default:
                return 'text-slate-600';
        }
    };

    const getHoverClass = (classificacao) => {
        switch (classificacao?.toLowerCase()) {
            case 'excelente':
                return 'hover:bg-green-50';
            case 'bom':
                return 'hover:bg-blue-50';
            case 'regular':
                return 'hover:bg-yellow-50';
            case 'ruim':
                return 'hover:bg-red-50';
            default:
                return 'hover:bg-slate-50';
        }
    };

    return (
        <div className="w-full">
            <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-700 text-center mb-4">
                    Classificação de Satisfação
                </h3>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold">Classificação</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold">Total de Chamados</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {safeData.length > 0 ? safeData.map((item, index) => (
                                <tr key={index} className={getHoverClass(item.classificacao)}>
                                    <td className="px-4 py-2 text-sm font-medium text-slate-800">
                                        {item.classificacao || 'N/A'}
                                    </td>
                                    <td className={`px-4 py-2 text-sm font-bold text-center ${getColorClass(item.classificacao)}`}>
                                        {Number(item.total) || 0}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="2" className="px-4 py-2 text-center text-slate-500">Nenhum dado disponível</td>
                                </tr>
                            )}
                            <tr className="bg-slate-100 font-bold">
                                <td className="px-4 py-2 text-sm text-slate-800">TOTAL</td>
                                <td className="px-4 py-2 text-sm text-slate-800">{total}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SlideSatisfacaoTabela;

