import { createContext, useContext, useState, ReactNode } from 'react';

interface AbaControlContextType {
  abaAtiva: string;
  setAbaAtiva: (aba: string) => void;
  hasAbaControl: boolean;
  setHasAbaControl: (has: boolean) => void;
}

const AbaControlContext = createContext<AbaControlContextType | undefined>(undefined);

export const AbaControlProvider = ({ children }: { children: ReactNode }) => {
  const [abaAtiva, setAbaAtiva] = useState<string>('concluidos');
  const [hasAbaControl, setHasAbaControl] = useState<boolean>(false);

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

