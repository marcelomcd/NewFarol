import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useAbaControl } from '../../contexts/AbaControlContext';

interface Slide {
  id: number;
  title: string;
  component: React.ReactNode;
  description: string;
  icon: string;
  size: string;
  color: string;
}

interface PresentationModeProps {
  slides: Slide[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PresentationMode = ({ slides, currentIndex, onClose, onNext, onPrevious }: PresentationModeProps) => {
  const { abaAtiva, setAbaAtiva, hasAbaControl } = useAbaControl();

  // Verificar se é um slide de Causa Raiz (IDs 12, 13, 14)
  const isCausaRaizSlide = slides[currentIndex]?.id >= 12 && slides[currentIndex]?.id <= 14;

  // Entrar em fullscreen quando o componente montar
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen();
        }
      } catch (err) {
        console.log('Erro ao entrar em fullscreen:', err);
      }
    };

    enterFullscreen();

    // Sair do fullscreen quando o componente desmontar
    return () => {
      const exitFullscreen = async () => {
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
          }
        } catch (err) {
          console.log('Erro ao sair do fullscreen:', err);
        }
      };
      exitFullscreen();
    };
  }, []);

  // Listener para ESC e navegação
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrevious]);

  // Listener para detectar saída do fullscreen pelo usuário
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement && !(document as any).msFullscreenElement) {
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center p-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-auto relative flex flex-col"
        >
          <div className="sticky top-0 bg-white p-4 flex items-center justify-between z-10 shadow-md border-b border-gray-200 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <img
                src="/logo-qualiit.png"
                alt="QualiIT"
                className="h-8 w-auto object-contain"
              />
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-teal-600">
                  {slides[currentIndex]?.title || `Slide ${currentIndex + 1}`}
                </h2>
                {isCausaRaizSlide && (
                  <p className="text-sm text-gray-500">Soluções resolvidas</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isCausaRaizSlide && hasAbaControl && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAbaAtiva('concluidos')}
                    className={`p-2 rounded-lg transition-all ${abaAtiva === 'concluidos'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    title="Concluídos"
                  >
                    <i className="fas fa-check-circle text-lg"></i>
                  </button>
                  <button
                    onClick={() => setAbaAtiva('emAndamento')}
                    className={`p-2 rounded-lg transition-all ${abaAtiva === 'emAndamento'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    title="Em Andamento"
                  >
                    <i className="fas fa-clock text-lg"></i>
                  </button>
                </div>
              )}
              <span className="text-teal-600 text-sm font-medium bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                {currentIndex + 1} / {slides.length}
              </span>
              <button
                onClick={onClose}
                className="text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                title="Fechar (ESC)"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
          </div>

          <div className="flex-1 p-12 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="scale-125 origin-top"
              >
                {slides[currentIndex]?.component}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="sticky bottom-0 bg-gray-100 p-4 flex items-center justify-between border-t border-gray-200">
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700 transition-colors font-semibold flex items-center gap-2"
            >
              <i className="fas fa-chevron-left"></i>
              Anterior
            </button>
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const diff = index - currentIndex;
                    if (diff > 0) {
                      for (let i = 0; i < diff; i++) onNext();
                    } else if (diff < 0) {
                      for (let i = 0; i < Math.abs(diff); i++) onPrevious();
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-teal-600 w-8' : 'bg-gray-300'
                    }`}
                />
              ))}
            </div>
            <button
              onClick={onNext}
              disabled={currentIndex === slides.length - 1}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700 transition-colors font-semibold flex items-center gap-2"
            >
              Próximo
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PresentationMode;

