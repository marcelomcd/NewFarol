import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useDateFilter } from './hooks/useDateFilter';
import { DateFilterProvider } from './contexts/DateFilterContext';
import { AnalistaFilterProvider, useAnalistaFilterContext } from './contexts/AnalistaFilterContext';
import { AbaControlProvider } from './contexts/AbaControlContext';
import QuickDateFilters from './components/QuickDateFilters';
import AnalistaFilter from './components/AnalistaFilter';
import DashboardCard from './components/DashboardCard';
import PresentationMode from './components/PresentationMode';

// Importar todos os slides
import SlideChamadosAtendidos from './components/slides/SlideChamadosAtendidos';
import SlideTop20Usuarios from './components/slides/SlideTop20Usuarios';
import SlideAbertoFechado from './components/slides/SlideAbertoFechado';
import SlideDominio from './components/slides/SlideDominio';
import SlideDatasul from './components/slides/SlideDatasul';
import SlideFluig from './components/slides/SlideFluig';
import SlideAnalistas from './components/slides/SlideAnalistas';
import SlideSLA from './components/slides/SlideSLA';
import SlideSLAAnalista from './components/slides/SlideSLAAnalista';
import SlideSatisfacaoTabela from './components/slides/SlideSatisfacaoTabela';
import SlideSatisfacaoGrafico from './components/slides/SlideSatisfacaoGrafico';
import SlideCausaRaizMelhorias from './components/slides/SlideCausaRaizMelhorias';
import SlideCausaRaizMelhoriasNovembro from './components/slides/SlideCausaRaizMelhoriasNovembro';
import SlideCausaRaizMelhoriasDezembro from './components/slides/SlideCausaRaizMelhoriasDezembro';
import SlideDashboardChamados from './components/slides/SlideDashboardChamados';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnReconnect: true,
    },
  },
});

const slides = [
  {
    id: 1,
    title: 'Chamados Atendidos',
    component: <SlideChamadosAtendidos />,
    description: 'Evolução mensal',
    icon: 'chart-line',
    size: 'large', // Grande
    color: 'purple'
  },
  {
    id: 2,
    title: 'Top 20 Usuários',
    component: <SlideTop20Usuarios />,
    description: 'Usuários que mais abriram chamados',
    icon: 'users',
    size: 'large', // Grande
    color: 'green'
  },
  {
    id: 3,
    title: 'Aberto vs Fechado',
    component: <SlideAbertoFechado />,
    description: 'Status dos chamados',
    icon: 'balance-scale',
    size: 'small', // Pequeno
    color: 'blue'
  },
  {
    id: 4,
    title: 'Por Domínio',
    component: <SlideDominio />,
    description: 'Distribuição por área',
    icon: 'sitemap',
    size: 'small', // Pequeno
    color: 'green'
  },
  {
    id: 5,
    title: 'Datasul',
    component: <SlideDatasul />,
    description: 'Análise Datasul',
    icon: 'database',
    size: 'large', // Grande
    color: 'orange'
  },
  {
    id: 6,
    title: 'Fluig',
    component: <SlideFluig />,
    description: 'Análise Fluig',
    icon: 'cloud',
    size: 'small', // Pequeno
    color: 'teal'
  },
  {
    id: 7,
    title: 'Analistas',
    component: <SlideAnalistas />,
    description: 'Performance individual',
    icon: 'users',
    size: 'large', // Grande
    color: 'indigo'
  },
  {
    id: 8,
    title: 'SLA Mensal',
    component: <SlideSLA />,
    description: 'Indicadores SLA',
    icon: 'clock',
    size: 'large', // Grande
    color: 'red'
  },
  {
    id: 9,
    title: 'SLA Analista',
    component: <SlideSLAAnalista />,
    description: 'SLA por analista',
    icon: 'user-clock',
    size: 'large', // Grande
    color: 'pink'
  },
  {
    id: 10,
    title: 'Satisfação',
    component: <SlideSatisfacaoTabela />,
    description: 'Classificação',
    icon: 'star',
    size: 'medium', // Médio
    color: 'yellow'
  },
  {
    id: 11,
    title: 'Satisfação Detalhada',
    component: <SlideSatisfacaoGrafico />,
    description: 'Por analista',
    icon: 'chart-bar',
    size: 'medium', // Médio
    color: 'cyan'
  },
  {
    id: 12,
    title: 'Soluções de Causa Raiz e Melhorias – Resolvido – Outubro/2025',
    component: <SlideCausaRaizMelhorias />,
    description: 'Soluções resolvidas',
    icon: 'wrench',
    size: 'large', // Grande
    color: 'blue'
  },
  {
    id: 13,
    title: 'Soluções de Causa Raiz e Melhorias – Resolvido – Novembro/2025',
    component: <SlideCausaRaizMelhoriasNovembro />,
    description: 'Soluções resolvidas',
    icon: 'wrench',
    size: 'large', // Grande
    color: 'blue'
  },
  {
    id: 14,
    title: 'Soluções de Causa Raiz e Melhorias – Resolvido – Dezembro/2025',
    component: <SlideCausaRaizMelhoriasDezembro />,
    description: 'Soluções resolvidas',
    icon: 'wrench',
    size: 'large', // Grande
    color: 'blue'
  },
  {
    id: 15,
    title: 'Dashboard de Chamados',
    component: <SlideDashboardChamados />,
    description: 'Visão geral dos chamados',
    icon: 'dashboard',
    size: 'large', // Grande
    color: 'indigo'
  },
];

function App() {
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, dateFilter, months, years } = useDateFilter();
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);

  const handleClearFilters = () => {
    const now = new Date();
    // Limpar mês (voltar para padrão: mês atual)
    setSelectedMonth(now.getMonth() + 1);
    // Manter o ano atual (importante para Chamados Atendidos)
    setSelectedYear(now.getFullYear());
  };

  const openPresentation = () => {
    setPresentationMode(true);
    setPresentationIndex(0);
  };

  const closePresentation = async () => {
    // Sair do fullscreen ao fechar
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (err) {
      console.log('Erro ao sair do fullscreen:', err);
    }
    setPresentationMode(false);
  };

  const nextSlide = () => {
    setPresentationIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const previousSlide = () => {
    setPresentationIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const getGridCols = (size) => {
    // Todos os cards ocupam toda a largura (uma coluna)
    return 'col-span-1';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AnalistaFilterProvider>
        <AppContent 
          dateFilter={dateFilter}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          setSelectedMonth={setSelectedMonth}
          setSelectedYear={setSelectedYear}
          months={months}
          years={years}
          handleClearFilters={handleClearFilters}
          openPresentation={openPresentation}
          presentationMode={presentationMode}
          presentationIndex={presentationIndex}
          closePresentation={closePresentation}
          nextSlide={nextSlide}
          previousSlide={previousSlide}
          getGridCols={getGridCols}
          slides={slides}
        />
      </AnalistaFilterProvider>
    </QueryClientProvider>
  );
}

function AppContent({
  dateFilter,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  months,
  years,
  handleClearFilters,
  openPresentation,
  presentationMode,
  presentationIndex,
  closePresentation,
  nextSlide,
  previousSlide,
  getGridCols,
  slides
}) {
  const { analistaFilter, analistasSelecionados, setAnalistaFilter, setAnalistasSelecionados } = useAnalistaFilterContext();

  // Função para limpar todos os filtros (data e analista)
  const handleClearAllFilters = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
    setAnalistaFilter('todos');
    setAnalistasSelecionados([]);
  };

  return (
    <DateFilterProvider
      month={dateFilter.month}
      year={dateFilter.year}
      startDate={null}
      endDate={null}
      analistaFilter={analistaFilter}
      analistasSelecionados={analistasSelecionados}
    >
      <AbaControlProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Header - Oculto no modo apresentação */}
            {!presentationMode && (
              <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-[9999]">
                <div className="px-4 py-2 flex items-center gap-4">
                  {/* Logo */}
                  <img
                    src="/qi_logo.png"
                    alt="QualiIT"
                    className="h-8 w-auto object-contain"
                  />

                  {/* Divisor */}
                  <div className="h-6 w-px bg-gray-300"></div>

                  {/* Título */}
                  <h1 className="text-lg font-bold text-gray-800 flex-1">Painel Service Up</h1>

                  {/* Filtros Rápidos e Botões */}
                  <div className="flex items-center gap-3">
                    {/* Filtro de Analista */}
                    <AnalistaFilter />
                    
                    {/* Filtros Rápidos */}
                    <QuickDateFilters
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                      months={months}
                      years={years}
                      onMonthChange={setSelectedMonth}
                      onYearChange={setSelectedYear}
                      onClear={handleClearAllFilters}
                    />

                    {/* Botão de Apresentação */}
                    <button
                      onClick={openPresentation}
                      className="w-10 h-10 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-full hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                      title="Modo Apresentação"
                    >
                      <i className="fas fa-desktop text-sm"></i>
                    </button>
                  </div>
                </div>
              </header>
            )}

            {/* Main Content - Oculto no modo apresentação */}
            {!presentationMode && (
              <main className="overflow-auto bg-gray-50">

                {/* Dashboard Grid */}
                <div className="p-8">
                  <div className="grid grid-cols-1 gap-12 max-w-[1600px] mx-auto">
                    {slides.map((slide, index) => (
                      <motion.div
                        key={slide.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={getGridCols(slide.size)}
                      >
                        <DashboardCard
                          title={slide.title}
                          description={slide.description}
                          icon={slide.icon}
                          color={slide.color}
                          size={slide.size}
                        >
                          {slide.component}
                        </DashboardCard>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </main>
            )}

            {/* Presentation Mode */}
            <AnimatePresence>
              {presentationMode && (
                <PresentationMode
                  slides={slides}
                  currentIndex={presentationIndex}
                  onClose={closePresentation}
                  onNext={nextSlide}
                  onPrevious={previousSlide}
                />
              )}
            </AnimatePresence>
          </div>
        </AbaControlProvider>
      </DateFilterProvider>
  );
}

export default App;
