import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServiceUpDateFilter } from './hooks/useServiceUpDateFilter.js';
import { DateFilterProvider } from './contexts/ServiceUpDateFilterContext.jsx';
import { AnalistaFilterProvider, useAnalistaFilterContext } from './contexts/ServiceUpAnalistaFilterContext.jsx';
import { AbaControlProvider } from './contexts/AbaControlContext.jsx';
import QuickDateFilters from './components/ServiceUp/QuickDateFilters.tsx';
import ServiceUpAnalistaFilter from './components/ServiceUp/ServiceUpAnalistaFilter.tsx';
import DashboardCard from './components/ServiceUp/DashboardCard.tsx';
import PresentationMode from './components/ServiceUp/PresentationMode.tsx';

// Importar todos os slides
import SlideChamadosAtendidos from './components/ServiceUp/slides/SlideChamadosAtendidos.tsx';
import SlideTop20Usuarios from './components/ServiceUp/slides/SlideTop20Usuarios.tsx';
import SlideAbertoFechado from './components/ServiceUp/slides/SlideAbertoFechado.tsx';
import SlideDominio from './components/ServiceUp/slides/SlideDominio.tsx';
import SlideDatasul from './components/ServiceUp/slides/SlideDatasul.tsx';
import SlideFluig from './components/ServiceUp/slides/SlideFluig.tsx';
import SlideAnalistas from './components/ServiceUp/slides/SlideAnalistas.tsx';
import SlideSLA from './components/ServiceUp/slides/SlideSLA.tsx';
import SlideSLAAnalista from './components/ServiceUp/slides/SlideSLAAnalista.tsx';
import SlideSatisfacaoTabela from './components/ServiceUp/slides/SlideSatisfacaoTabela.tsx';
import SlideSatisfacaoGrafico from './components/ServiceUp/slides/SlideSatisfacaoGrafico.tsx';
import SlideCausaRaizMelhoriasSetembro from './components/ServiceUp/slides/SlideCausaRaizMelhoriasSetembro.tsx';
import SlideCausaRaizMelhorias from './components/ServiceUp/slides/SlideCausaRaizMelhorias.tsx';
import SlideCausaRaizMelhoriasNovembro from './components/ServiceUp/slides/SlideCausaRaizMelhoriasNovembro.tsx';
import SlideDashboardChamados from './components/ServiceUp/slides/SlideDashboardChamados.tsx';

interface Slide {
  id: number;
  title: string;
  component: React.ReactNode;
  description: string;
  icon: string;
  size: 'small' | 'medium' | 'large';
  color: 'purple' | 'blue' | 'green' | 'orange' | 'teal' | 'indigo' | 'red' | 'pink' | 'yellow' | 'cyan';
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Chamados Atendidos',
    component: <SlideChamadosAtendidos />,
    description: 'Evolução mensal',
    icon: 'chart-line',
    size: 'large',
    color: 'purple'
  },
  {
    id: 2,
    title: 'Top 20 Usuários',
    component: <SlideTop20Usuarios />,
    description: 'Usuários que mais abriram chamados',
    icon: 'users',
    size: 'large',
    color: 'green'
  },
  {
    id: 3,
    title: 'Aberto vs Fechado',
    component: <SlideAbertoFechado />,
    description: 'Status dos chamados',
    icon: 'balance-scale',
    size: 'small',
    color: 'blue'
  },
  {
    id: 4,
    title: 'Por Domínio',
    component: <SlideDominio />,
    description: 'Distribuição por área',
    icon: 'sitemap',
    size: 'small',
    color: 'green'
  },
  {
    id: 5,
    title: 'Datasul',
    component: <SlideDatasul />,
    description: 'Análise Datasul',
    icon: 'database',
    size: 'large',
    color: 'orange'
  },
  {
    id: 6,
    title: 'Fluig',
    component: <SlideFluig />,
    description: 'Análise Fluig',
    icon: 'cloud',
    size: 'small',
    color: 'teal'
  },
  {
    id: 7,
    title: 'Analistas',
    component: <SlideAnalistas />,
    description: 'Performance individual',
    icon: 'users',
    size: 'large',
    color: 'indigo'
  },
  {
    id: 8,
    title: 'SLA Mensal',
    component: <SlideSLA />,
    description: 'Indicadores SLA',
    icon: 'clock',
    size: 'large',
    color: 'red'
  },
  {
    id: 9,
    title: 'SLA Analista',
    component: <SlideSLAAnalista />,
    description: 'SLA por analista',
    icon: 'user-clock',
    size: 'large',
    color: 'pink'
  },
  {
    id: 10,
    title: 'Satisfação',
    component: <SlideSatisfacaoTabela />,
    description: 'Classificação',
    icon: 'star',
    size: 'medium',
    color: 'yellow'
  },
  {
    id: 11,
    title: 'Satisfação Detalhada',
    component: <SlideSatisfacaoGrafico />,
    description: 'Por analista',
    icon: 'chart-bar',
    size: 'medium',
    color: 'cyan'
  },
  {
    id: 12,
    title: 'Soluções de Causa Raiz e Melhorias – Resolvido – Setembro/2025',
    component: <SlideCausaRaizMelhoriasSetembro />,
    description: 'Soluções resolvidas',
    icon: 'wrench',
    size: 'large',
    color: 'blue'
  },
  {
    id: 13,
    title: 'Soluções de Causa Raiz e Melhorias – Resolvido – Outubro/2025',
    component: <SlideCausaRaizMelhorias />,
    description: 'Soluções resolvidas',
    icon: 'wrench',
    size: 'large',
    color: 'blue'
  },
  {
    id: 14,
    title: 'Soluções de Causa Raiz e Melhorias – Resolvido – Novembro/2025',
    component: <SlideCausaRaizMelhoriasNovembro />,
    description: 'Soluções resolvidas',
    icon: 'wrench',
    size: 'large',
    color: 'blue'
  },
  {
    id: 15,
    title: 'Dashboard de Chamados',
    component: <SlideDashboardChamados />,
    description: 'Visão geral dos chamados',
    icon: 'dashboard',
    size: 'large',
    color: 'indigo'
  },
];

const ServiceUpContent = () => {
  const {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    dateFilter,
    months,
    years,
  } = useServiceUpDateFilter();

  const { analistaFilter, analistasSelecionados, setAnalistaFilter, setAnalistasSelecionados } = useAnalistaFilterContext();

  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);

  const handleClearFilters = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  const handleClearAllFilters = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
    setAnalistaFilter('todos');
    setAnalistasSelecionados([]);
  };

  const openPresentation = () => {
    setPresentationMode(true);
    setPresentationIndex(0);
  };

  const closePresentation = async () => {
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
    return 'col-span-1';
  };

  return (
    <DateFilterProvider
      month={dateFilter.month}
      year={dateFilter.year}
      startDate={dateFilter.startDate}
      endDate={dateFilter.endDate}
      analistaFilter={analistaFilter}
      analistasSelecionados={analistasSelecionados}
    >
      <AbaControlProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Filtros no topo */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="max-w-[1600px] mx-auto">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Painel Service Up</h1>
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro de Analista */}
                <ServiceUpAnalistaFilter />
                
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
                  <i className="fas fa-tv text-sm"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="overflow-auto bg-gray-50 dark:bg-gray-900">
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
};

const App = () => {
  return (
    <AnalistaFilterProvider>
      <ServiceUpContent />
    </AnalistaFilterProvider>
  );
};

export default App;
