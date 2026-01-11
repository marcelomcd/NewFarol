import { useState, useMemo, useEffect } from 'react';

export const useDateFilter = () => {
  const now = new Date();
  
  // Função para ler parâmetros da URL
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const monthParam = params.get('month');
    const yearParam = params.get('year');
    
    return {
      month: monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1,
      year: yearParam ? parseInt(yearParam, 10) : now.getFullYear(),
    };
  };

  // Inicializar com valores da URL ou padrão
  const urlParams = getUrlParams();
  const [selectedMonth, setSelectedMonth] = useState(urlParams.month);
  const [selectedYear, setSelectedYear] = useState(urlParams.year);

  // Função para atualizar a URL sem recarregar a página
  const updateUrl = (month, year) => {
    const params = new URLSearchParams(window.location.search);
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Atualizar ou remover parâmetros
    // Incluir month na URL se for diferente do padrão (incluindo month=0 para "Todos")
    if (month !== undefined && month !== null && month !== currentMonth) {
      params.set('month', month.toString());
    } else if (month === currentMonth) {
      params.delete('month');
    }
    
    // Incluir year na URL se for diferente do padrão
    if (year && year !== currentYear) {
      params.set('year', year.toString());
    } else if (year === currentYear) {
      params.delete('year');
    }

    // Atualizar URL sem recarregar
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    
    window.history.replaceState({}, '', newUrl);
  };

  // Sincronizar URL quando os filtros mudarem
  useEffect(() => {
    updateUrl(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const dateFilter = useMemo(() => {
    let startDate, endDate, monthYear;
    
    // Se selectedMonth for 0, significa "Todos"
    const isAllMonths = selectedMonth === 0;
    
    if (isAllMonths && selectedYear) {
      // "Todos" os meses do ano selecionado
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
      monthYear = `${selectedYear}`;
    } else if (isAllMonths && !selectedYear) {
      // "Todos" os meses do ano atual
      const currentYear = new Date().getFullYear();
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);
      monthYear = `${currentYear}`;
    } else if (selectedMonth && selectedYear) {
      // Ambos selecionados (mês específico)
      startDate = new Date(selectedYear, selectedMonth - 1, 1);
      endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
      monthYear = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    } else if (selectedYear) {
      // Apenas ano selecionado
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
      monthYear = `${selectedYear}`;
    } else if (selectedMonth && !isAllMonths) {
      // Apenas mês selecionado (usa ano atual)
      const currentYear = new Date().getFullYear();
      startDate = new Date(currentYear, selectedMonth - 1, 1);
      endDate = new Date(currentYear, selectedMonth, 0, 23, 59, 59);
      monthYear = `${currentYear}-${String(selectedMonth).padStart(2, '0')}`;
    } else {
      // Nenhum selecionado (padrão: mês atual)
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    
    return {
      month: isAllMonths ? null : selectedMonth,
      year: selectedYear,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      monthYear,
    };
  }, [selectedMonth, selectedYear]);

  const months = [
    { value: 0, label: 'Todos' },
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  return {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    dateFilter,
    months,
    years,
  };
};

