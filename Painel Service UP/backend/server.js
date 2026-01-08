import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createConnection } from './db/connection.js';
import chamadosRoutes from './routes/chamados.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Obter o diretório atual do módulo (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware CORS - permitir requisições do New Farol e do próprio ServiceUp
const corsOptions = {
  origin: [
    'http://localhost:5173', // Frontend New Farol (desenvolvimento)
    'http://localhost:5174', // Frontend ServiceUp standalone (desenvolvimento - iframe)
    'http://localhost:3000',  // Frontend ServiceUp standalone (desenvolvimento - servido pelo Express)
    process.env.FRONTEND_URL, // URL configurável via variável de ambiente
    process.env.SERVICEUP_FRONTEND_URL, // URL do frontend ServiceUp standalone
  ].filter(Boolean), // Remove valores undefined/null
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando' });
});

// Rota raiz da API - listar rotas disponíveis
app.get('/api', (req, res) => {
  res.json({
    message: 'Painel Service UP API',
    version: '1.0.0',
    status: '✅ Backend funcionando corretamente',
    database: 'dw_combio.bi_chamados_service_up',
    endpoints: {
      health: '/api/health',
      chamados: {
        base: '/api/chamados',
        routes: [
          'GET /api/chamados/lista-analistas',
          'GET /api/chamados/atendidos',
          'GET /api/chamados/aberto-fechado',
          'GET /api/chamados/dominio',
          'GET /api/chamados/datasul',
          'GET /api/chamados/fluig',
          'GET /api/chamados/analistas',
          'GET /api/chamados/sla',
          'GET /api/chamados/sla-analista',
          'GET /api/chamados/satisfacao',
          'GET /api/chamados/satisfacao-classificacao',
          'GET /api/chamados/top-20-usuarios',
          'GET /api/chamados/dashboard/status',
          'GET /api/chamados/dashboard/tempo-aberto',
          'GET /api/chamados/dashboard/ultima-atualizacao',
          'GET /api/chamados/dashboard/detalhes',
          'GET /api/chamados/dashboard/causa-raiz',
          'GET /api/chamados/dashboard/em-andamento'
        ]
      }
    }
  });
});

// Routes
app.use('/api/chamados', chamadosRoutes);

// Servir arquivos estáticos do frontend (apenas em produção)
// Em desenvolvimento, o frontend roda separadamente no Vite (porta 5174)
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

// Verificar se o diretório dist existe (apenas em produção)
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // Rota catch-all: serve o index.html para todas as rotas que não sejam /api/*
  // Isso permite que o React Router funcione corretamente
  app.get('*', (req, res) => {
    // Se a rota começa com /api, não servir o frontend
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Rota não encontrada' });
    }
    // Caso contrário, servir o index.html do frontend
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Em desenvolvimento, apenas retornar erro 404 para rotas não-API
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Rota não encontrada' });
    }
    // Em desenvolvimento, o frontend roda separadamente
    res.status(404).json({ 
      error: 'Rota não encontrada',
      message: 'Em desenvolvimento, o frontend roda separadamente na porta 5174',
      frontendUrl: 'http://localhost:5174'
    });
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Inicializar conexão MySQL
createConnection();

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 API disponível em http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend disponível em http://localhost:${PORT}`);
  console.log(`💾 Database: dw_combio`);
});
