import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Importar rotas
import authRoutes from './routes/auth.js';
import featuresRoutes from './routes/features.js';
import projectsRoutes from './routes/projects.js';
import reportsRoutes from './routes/reports.js';
import exportRoutes from './routes/export.js';
import webhooksRoutes from './routes/webhooks.js';
import workItemsRoutes from './routes/workItems.js';
import azdoRoutes from './routes/azdo.js';
import clientsRoutes from './routes/clients.js';
import featuresAnalyticsRoutes from './routes/featuresAnalytics.js';
import featuresV2Routes from './routes/featuresV2.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Obter o diretório atual do módulo (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware CORS
const corsOptions = {
  origin: [
    'http://localhost:5173', // Frontend New Farol (desenvolvimento)
    'http://localhost:5174', // Frontend ServiceUp standalone (desenvolvimento)
    process.env.FRONTEND_URL, // URL configurável via variável de ambiente
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    app: process.env.APP_NAME || 'NewFarol',
    version: '1.0.0'
  });
});

// Rota raiz da API - listar rotas disponíveis
app.get('/api', (req, res) => {
  res.json({
    message: 'New Farol API',
    version: '1.0.0',
    status: '✅ Backend funcionando corretamente',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      features: '/api/features',
      projects: '/api/projects',
      reports: '/api/reports',
      export: '/api/export',
      webhooks: '/webhooks',
      workItems: '/api/work-items',
      azdo: '/api/azdo',
      clients: '/api/clients',
      featuresAnalytics: '/api/features'
    }
  });
});

// Registrar rotas
// IMPORTANTE: Registrar featuresAnalytics ANTES de features para evitar conflitos
// As rotas de analytics são específicas (/criadas, /abertas-fechadas) e não conflitam com /:id
app.use('/api/features', featuresAnalyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/export', exportRoutes);
app.use('/webhooks', webhooksRoutes);
app.use('/api/work-items', workItemsRoutes);
app.use('/api/azdo', azdoRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/v2', featuresV2Routes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.DEBUG === 'true' && { stack: err.stack })
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 New Farol Backend rodando em http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API info: http://localhost:${PORT}/api\n`);
});
