import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalistaFilterContext } from '../contexts/AnalistaFilterContext';

const AnalistaFilter = () => {
    const {
        analistaFilter,
        setAnalistaFilter,
        analistasSelecionados,
        setAnalistasSelecionados,
        analistasQualiIT,
        todosAnalistas
    } = useAnalistaFilterContext();

    const [showMenu, setShowMenu] = useState(false);

    const handleFilterChange = (filter) => {
        setAnalistaFilter(filter);
        if (filter === 'qualiit') {
            // Quando selecionar QualiIT, selecionar automaticamente todos os analistas QualiIT
            setAnalistasSelecionados([...analistasQualiIT]);
        } else if (filter !== 'analistas') {
            setAnalistasSelecionados([]);
        }
        setShowMenu(false);
    };

    const handleAnalistaToggle = (analista) => {
        setAnalistaFilter('analistas');
        if (analistasSelecionados.includes(analista)) {
            setAnalistasSelecionados(analistasSelecionados.filter(a => a !== analista));
        } else {
            setAnalistasSelecionados([...analistasSelecionados, analista]);
        }
    };

    const getButtonText = () => {
        if (analistaFilter === 'todos') return 'Analista: Todos';
        if (analistaFilter === 'qualiit') return 'Analista: QualiIT';
        if (analistaFilter === 'analistas' && analistasSelecionados.length > 0) {
            return `Analista: ${analistasSelecionados.length} selecionado(s)`;
        }
        return 'Analista';
    };

    // Separar analistas em QualiIT e não-QualiIT
    const analistasNaoQualiIT = todosAnalistas.filter(a => !analistasQualiIT.includes(a));
    const analistasQualiITOrdenados = analistasQualiIT.filter(a => todosAnalistas.includes(a));

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${analistaFilter !== 'todos'
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
            >
                <i className="fas fa-user-friends"></i>
                <span>{getButtonText()}</span>
                <i className={`fas fa-chevron-${showMenu ? 'up' : 'down'} text-xs`}></i>
            </button>

            <AnimatePresence>
                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setShowMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] max-h-96 overflow-y-auto"
                        >
                            <div className="p-2">
                                {/* Opção Todos */}
                                <button
                                    onClick={() => handleFilterChange('todos')}
                                    className={`w-full px-4 py-2 text-left text-sm rounded-lg transition-all ${analistaFilter === 'todos'
                                        ? 'bg-purple-100 text-purple-700 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <i className="fas fa-check-circle mr-2"></i>
                                    Todos
                                </button>

                                {/* Opção QualiIT */}
                                <button
                                    onClick={() => handleFilterChange('qualiit')}
                                    className={`w-full px-4 py-2 text-left text-sm rounded-lg transition-all ${analistaFilter === 'qualiit'
                                        ? 'bg-purple-100 text-purple-700 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <i className="fas fa-check-circle mr-2"></i>
                                    QualiIT
                                </button>

                                {/* Divisor */}
                                <div className="h-px bg-gray-200 my-2"></div>

                                {/* Analistas não-QualiIT */}
                                {analistasNaoQualiIT.length > 0 && (
                                    <div className="px-2 py-1">
                                        <div className="text-xs font-semibold text-gray-500 mb-2">Analistas Individuais:</div>
                                        {analistasNaoQualiIT.map((analista) => (
                                            <label
                                                key={analista}
                                                className="flex items-center px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={analistasSelecionados.includes(analista)}
                                                    onChange={() => handleAnalistaToggle(analista)}
                                                    className="mr-2 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                />
                                                <span className="text-sm text-gray-700">{analista}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* Divisor antes de QualiIT */}
                                {analistasQualiITOrdenados.length > 0 && (
                                    <>
                                        <div className="h-px bg-gray-200 my-2"></div>
                                        <div className="px-2 py-1">
                                            <div className="text-xs font-semibold text-purple-600 mb-2">QualiIT:</div>
                                            {analistasQualiITOrdenados.map((analista) => (
                                                <label
                                                    key={analista}
                                                    className="flex items-center px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={analistasSelecionados.includes(analista)}
                                                        onChange={() => handleAnalistaToggle(analista)}
                                                        className="mr-2 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{analista}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnalistaFilter;

