import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chamadosService } from '../services/api';

const AnalistaFilterContext = createContext(null);

export const AnalistaFilterProvider = ({ children }) => {
    // Lista fixa dos 16 analistas QualiIT
    const analistasQualiIT = [
        'Adriano Santos',
        'Alessandra Pardin',
        'Arthur Nagae',
        'Diego Moraes Leal',
        'João Carlos Ribeiro',
        'Juliana Jesus de Oliveira',
        'Leonardo Dos Santos Caetano',
        'Lucas Algarve da Silva',
        'Lucas Mendes',
        'Luiz Alberto Duarte de Sousa',
        'Qualiit - Adriano Santos',
        'Qualiit - Jefferson Vieira',
        'Qualiit - Luiz Fernando',
        'Quallit - Adriano Santos',
        'Roberto Leandro',
        'Rosiléa Pereira de Toledo Campo'
    ];

    // Buscar todos os analistas do banco
    const { data: todosAnalistas = [] } = useQuery({
        queryKey: ['lista-analistas'],
        queryFn: async () => {
            try {
                const response = await chamadosService.getListaAnalistas();
                return response.data || [];
            } catch (err) {
                console.error('Erro ao buscar lista de analistas:', err);
                return [];
            }
        },
        staleTime: 30 * 60 * 1000, // Cache por 30 minutos
        retry: false,
    });

    // Ler da URL
    const getUrlParams = () => {
        const params = new URLSearchParams(window.location.search);
        const analistaFilterParam = params.get('analistaFilter') || 'todos';
        const analistasParam = params.get('analistas');
        const analistasSelecionados = analistasParam ? JSON.parse(decodeURIComponent(analistasParam)) : [];
        
        return {
            analistaFilter: analistaFilterParam,
            analistasSelecionados
        };
    };

    const urlParams = getUrlParams();
    const [analistaFilter, setAnalistaFilter] = useState(urlParams.analistaFilter);
    const [analistasSelecionados, setAnalistasSelecionados] = useState(urlParams.analistasSelecionados);

    // Atualizar URL quando filtros mudarem
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        
        if (analistaFilter && analistaFilter !== 'todos') {
            params.set('analistaFilter', analistaFilter);
        } else {
            params.delete('analistaFilter');
        }

        if (analistasSelecionados && analistasSelecionados.length > 0) {
            params.set('analistas', encodeURIComponent(JSON.stringify(analistasSelecionados)));
        } else {
            params.delete('analistas');
        }

        const newUrl = params.toString() 
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;
        
        window.history.replaceState({}, '', newUrl);
    }, [analistaFilter, analistasSelecionados]);

    return (
        <AnalistaFilterContext.Provider value={{
            analistaFilter,
            setAnalistaFilter,
            analistasSelecionados,
            setAnalistasSelecionados,
            analistasQualiIT,
            todosAnalistas: todosAnalistas || []
        }}>
            {children}
        </AnalistaFilterContext.Provider>
    );
};

export const useAnalistaFilterContext = () => {
    const context = useContext(AnalistaFilterContext);
    return context || { 
        analistaFilter: 'todos', 
        analistasSelecionados: [],
        setAnalistaFilter: () => {},
        setAnalistasSelecionados: () => {},
        analistasQualiIT: [],
        todosAnalistas: []
    };
};

