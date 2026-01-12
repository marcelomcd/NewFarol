import axios from 'axios';

// Em produção, usar URL relativa se não especificado
// Isso permite que funcione quando servido pelo mesmo servidor Express
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chamadosService = {
  getAtendidos: (month, year, startDate, endDate, analistaFilter, analistas) =>
    api.get('/chamados/atendidos', { params: { month, year, startDate, endDate, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getAbertoFechado: (month, year, startDate, endDate, analistaFilter, analistas) =>
    api.get('/chamados/aberto-fechado', { params: { month, year, startDate, endDate, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getDominio: (month, year, startDate, endDate, analistaFilter, analistas) =>
    api.get('/chamados/dominio', { params: { month, year, startDate, endDate, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getDatasul: (month, year, startDate, endDate, analistaFilter, analistas) =>
    api.get('/chamados/datasul', { params: { month, year, startDate, endDate, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getFluig: (month, year, startDate, endDate, analistaFilter, analistas) =>
    api.get('/chamados/fluig', { params: { month, year, startDate, endDate, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getAnalistas: (month, year, startDate, endDate, analistaFilter, analistas) =>
    api.get('/chamados/analistas', { params: { month, year, startDate, endDate, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getSLA: (month, year, startDate, endDate, analistaFilter, analistas) =>
    api.get('/chamados/sla', { params: { month, year, startDate, endDate, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getSLAAnalista: (month, year, startDate, endDate, analistaFilter, analistas) =>
    api.get('/chamados/sla-analista', { params: { month, year, startDate, endDate, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getSatisfacao: (month, year, startDate, endDate, analistaFilter, analistas) =>
    api.get('/chamados/satisfacao', { params: { month, year, startDate, endDate, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getSatisfacaoClassificacao: (month, year, startDate, endDate, analistaFilter, analistas) =>
    api.get('/chamados/satisfacao-classificacao', { params: { month, year, startDate, endDate, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getTop20Usuarios: (month, year, startDate, endDate) =>
    api.get('/chamados/top-20-usuarios', { params: { month, year, startDate, endDate } }),

  getListaAnalistas: () =>
    api.get('/chamados/lista-analistas'),

  // Dashboard de Chamados
  getDashboardStatus: (ticket, analistaFilter, analistas) =>
    api.get('/chamados/dashboard/status', { params: { ticket, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getDashboardTempoAberto: (ticket, analistaFilter, analistas) =>
    api.get('/chamados/dashboard/tempo-aberto', { params: { ticket, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getDashboardUltimaAtualizacao: (ticket, analistaFilter, analistas) =>
    api.get('/chamados/dashboard/ultima-atualizacao', { params: { ticket, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getDashboardDetalhes: (status, tempoAberto, ultimaAtualizacao, responsavel, ticket, analistaFilter, analistas) =>
    api.get('/chamados/dashboard/detalhes', { params: { status, tempoAberto, ultimaAtualizacao, responsavel, ticket, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getDashboardCausaRaiz: (ticket, analistaFilter, analistas) =>
    api.get('/chamados/dashboard/causa-raiz', { params: { ticket, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),

  getDashboardEmAndamento: (ticket, analistaFilter, analistas) =>
    api.get('/chamados/dashboard/em-andamento', { params: { ticket, analistaFilter, analistas: analistas ? JSON.stringify(analistas) : null } }),
};

export default api;

