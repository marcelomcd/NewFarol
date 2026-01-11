import { createContext, useContext } from 'react';

const DateFilterContext = createContext(null);

export const DateFilterProvider = ({ children, month, year, startDate, endDate, analistaFilter, analistasSelecionados }) => {
  return (
    <DateFilterContext.Provider value={{ month, year, startDate, endDate, analistaFilter, analistasSelecionados }}>
      {children}
    </DateFilterContext.Provider>
  );
};

export const useDateFilterContext = () => {
  const context = useContext(DateFilterContext);
  return context || { month: null, year: null, startDate: null, endDate: null, analistaFilter: null, analistasSelecionados: [] };
};

