import { motion } from 'framer-motion';

const DateFilter = ({ selectedMonth, selectedYear, months, years, onMonthChange, onYearChange }) => {
  return (
    <div className="space-y-4">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtros</label>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-600 mb-2 block font-medium">Mês</label>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-xs text-gray-600 mb-2 block font-medium">Ano</label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DateFilter;
