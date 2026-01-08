import { createContext, useContext, useState } from 'react';

const AbaControlContext = createContext(undefined);

export const AbaControlProvider = ({ children }) => {
  const [abaAtiva, setAbaAtiva] = useState('concluidos');
  const [hasAbaControl, setHasAbaControl] = useState(false);

  return (
    <AbaControlContext.Provider value={{ abaAtiva, setAbaAtiva, hasAbaControl, setHasAbaControl }}>
      {children}
    </AbaControlContext.Provider>
  );
};

export const useAbaControl = () => {
  const context = useContext(AbaControlContext);
  if (!context) {
    return { abaAtiva: 'concluidos', setAbaAtiva: () => {}, hasAbaControl: false, setHasAbaControl: () => {} };
  }
  return context;
};
