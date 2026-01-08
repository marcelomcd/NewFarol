import axios from 'axios';

// Em produção, usar URL relativa se não especificado
// Isso permite que funcione quando servido pelo mesmo servidor Express
// IMPORTANTE: Quando rodando dentro de iframe, sempre usar URL absoluta para o backend
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos de timeout
});

// Interceptor para tratar erros de CORS e conexão
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.error('Erro de CORS ou conexão. Verifique se o backend está rodando na porta 3000.');
    }
    return Promise.reject(error);
  }
);

export const chamadosApi = {
  getAtendidos: async (month, year, startDate, endDate, analistaFilter, analistas) => {
    const params = {};
    if (month !== null && month !== undefined) params.month = month;
    if (year !== null && year !== undefined) params.year = year;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/atendidos', { params });
  },

  getAbertoFechado: async (month, year, startDate, endDate, analistaFilter, analistas) => {
    const params = {};
    if (month !== null && month !== undefined) params.month = month;
    if (year !== null && year !== undefined) params.year = year;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/aberto-fechado', { params });
  },

  getDominio: async (month, year, startDate, endDate, analistaFilter, analistas) => {
    const params = {};
    if (month !== null && month !== undefined) params.month = month;
    if (year !== null && year !== undefined) params.year = year;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/dominio', { params });
  },

  getDatasul: async (month, year, startDate, endDate, analistaFilter, analistas) => {
    const params = {};
    if (month !== null && month !== undefined) params.month = month;
    if (year !== null && year !== undefined) params.year = year;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/datasul', { params });
  },

  getFluig: async (month, year, startDate, endDate, analistaFilter, analistas) => {
    const params = {};
    if (month !== null && month !== undefined) params.month = month;
    if (year !== null && year !== undefined) params.year = year;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/fluig', { params });
  },

  getAnalistas: async (month, year, startDate, endDate, analistaFilter, analistas) => {
    const params = {};
    if (month !== null && month !== undefined) params.month = month;
    if (year !== null && year !== undefined) params.year = year;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/analistas', { params });
  },

  getSLA: async (month, year, startDate, endDate, analistaFilter, analistas) => {
    const params = {};
    if (month !== null && month !== undefined) params.month = month;
    if (year !== null && year !== undefined) params.year = year;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/sla', { params });
  },

  getSLAAnalista: async (month, year, startDate, endDate, analistaFilter, analistas) => {
    const params = {};
    if (month !== null && month !== undefined) params.month = month;
    if (year !== null && year !== undefined) params.year = year;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/sla-analista', { params });
  },

  getSatisfacao: async (month, year, startDate, endDate, analistaFilter, analistas) => {
    const params = {};
    if (month !== null && month !== undefined) params.month = month;
    if (year !== null && year !== undefined) params.year = year;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/satisfacao', { params });
  },

  getSatisfacaoClassificacao: async (month, year, startDate, endDate, analistaFilter, analistas) => {
    const params = {};
    if (month !== null && month !== undefined) params.month = month;
    if (year !== null && year !== undefined) params.year = year;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/satisfacao-classificacao', { params });
  },

  getTop20Usuarios: async (month, year, startDate, endDate) => {
    const params = {};
    if (month !== null && month !== undefined) params.month = month;
    if (year !== null && year !== undefined) params.year = year;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return api.get('/chamados/top-20-usuarios', { params });
  },

  getListaAnalistas: async () => {
    return api.get('/chamados/lista-analistas');
  },

  // Dashboard de Chamados
  getDashboardStatus: async (ticket, analistaFilter, analistas) => {
    const params = {};
    if (ticket) params.ticket = ticket;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/dashboard/status', { params });
  },

  getDashboardTempoAberto: async (ticket, analistaFilter, analistas) => {
    const params = {};
    if (ticket) params.ticket = ticket;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/dashboard/tempo-aberto', { params });
  },

  getDashboardUltimaAtualizacao: async (ticket, analistaFilter, analistas) => {
    const params = {};
    if (ticket) params.ticket = ticket;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/dashboard/ultima-atualizacao', { params });
  },

  getDashboardDetalhes: async (status, tempoAberto, ultimaAtualizacao, responsavel, ticket, analistaFilter, analistas) => {
    const params = {};
    if (status) params.status = status;
    if (tempoAberto) params.tempoAberto = tempoAberto;
    if (ultimaAtualizacao) params.ultimaAtualizacao = ultimaAtualizacao;
    if (responsavel) params.responsavel = responsavel;
    if (ticket) params.ticket = ticket;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/dashboard/detalhes', { params });
  },

  getDashboardCausaRaiz: async (ticket, analistaFilter, analistas) => {
    const params = {};
    if (ticket) params.ticket = ticket;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/dashboard/causa-raiz', { params });
  },

  getDashboardEmAndamento: async (ticket, analistaFilter, analistas) => {
    const params = {};
    if (ticket) params.ticket = ticket;
    if (analistaFilter) params.analistaFilter = analistaFilter;
    if (analistas) params.analistas = JSON.stringify(analistas);
    return api.get('/chamados/dashboard/em-andamento', { params });
  },
};

export default api;

