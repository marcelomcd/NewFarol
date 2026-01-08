import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Month {
  value: number;
  label: string;
}

interface QuickDateFiltersProps {
  selectedMonth: number | null;
  selectedYear: number | null;
  months: Month[];
  years: number[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onClear: () => void;
}

const QuickDateFilters = ({ 
  selectedMonth, 
  selectedYear, 
  months, 
  years, 
  onMonthChange, 
  onYearChange, 
  onClear 
}: QuickDateFiltersProps) => {
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);

  const handleClear = () => {
    onClear();
    setShowYearMenu(false);
    setShowMonthMenu(false);
  };

  const handleYearToggle = (year: number) => {
    onYearChange(year);
    setShowYearMenu(false);
  };

  const handleMonthToggle = (month: number) => {
    onMonthChange(month);
    setShowMonthMenu(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Botão Ano */}
      <div className="relative">
        <button
          onClick={() => {
            setShowYearMenu(!showYearMenu);
            setShowMonthMenu(false);
          }}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
            selectedYear
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
          }`}
        >
          <i className="fas fa-calendar-alt"></i>
          <span>{selectedYear || 'Ano'}</span>
          <i className={`fas fa-chevron-${showYearMenu ? 'up' : 'down'} text-xs`}></i>
        </button>

        <AnimatePresence>
          {showYearMenu && (
            <>
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setShowYearMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] max-h-64 overflow-y-auto"
              >
                <div className="p-2">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearToggle(year)}
                      className={`w-full px-4 py-2 text-left text-sm rounded-lg transition-all ${
                        selectedYear === year
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Botão Mês */}
      <div className="relative">
        <button
          onClick={() => {
            setShowMonthMenu(!showMonthMenu);
            setShowYearMenu(false);
          }}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
            selectedMonth && selectedMonth !== 0
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : selectedMonth === 0
              ? 'bg-indigo-500 text-white hover:bg-indigo-600'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
          }`}
        >
          <i className="fas fa-calendar"></i>
          <span>{selectedMonth ? months.find(m => m.value === selectedMonth)?.label || 'Mês' : 'Mês'}</span>
          <i className={`fas fa-chevron-${showMonthMenu ? 'up' : 'down'} text-xs`}></i>
        </button>

        <AnimatePresence>
          {showMonthMenu && (
            <>
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setShowMonthMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] max-h-64 overflow-y-auto"
              >
                <div className="p-2">
                  {months.map((month) => (
                    <button
                      key={month.value}
                      onClick={() => handleMonthToggle(month.value)}
                      className={`w-full px-4 py-2 text-left text-sm rounded-lg transition-all ${
                        selectedMonth === month.value
                          ? month.value === 0
                            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {month.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Botão Limpar */}
      {(selectedMonth !== (new Date().getMonth() + 1) || selectedYear !== new Date().getFullYear()) && (
        <button
          onClick={handleClear}
          className="w-10 h-10 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
          title="Limpar Filtros"
        >
          <i className="fas fa-times-circle text-base"></i>
        </button>
      )}
    </div>
  );
};

export default QuickDateFilters;

