/**
 * Rotas para analytics e relatórios de Features
 * Versão simplificada - sem banco de dados, usando apenas Azure DevOps
 * Convertido do Python para Node.js
 */
import express from 'express';
import { WIQLClient } from '../utils/wiqlClient.js';
import { getFeaturesQuery } from '../utils/wiql.js';
import { extractClientName, extractPmoName } from '../utils/normalization.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const project = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';

/**
 * GET /api/features/criadas
 * Features criadas por período
 */
router.get('/criadas', async (req, res) => {
  try {
    const { month, year, startDate, endDate, clientFilter, clients, pmoFilter, pmo } = req.query;

    // Por enquanto, retorna mensagem informando que analytics será implementado
    res.status(501).json({
      error: 'Analytics de features ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/criadas:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar features criadas',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/abertas-fechadas
 * Features abertas vs fechadas
 */
router.get('/abertas-fechadas', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de features ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/abertas-fechadas:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar features abertas/fechadas',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/tempo-aberto
 * Tempo médio que features ficam abertas
 */
router.get('/tempo-aberto', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de features ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/tempo-aberto:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar tempo aberto',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/ultima-atualizacao
 * Última atualização de features
 */
router.get('/ultima-atualizacao', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de features ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/ultima-atualizacao:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar última atualização',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/por-cliente
 * Features agrupadas por cliente
 */
router.get('/por-cliente', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de features ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/por-cliente:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar features por cliente',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/por-projeto
 * Features agrupadas por projeto
 */
router.get('/por-projeto', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de features ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/por-projeto:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar features por projeto',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/por-responsavel
 * Features agrupadas por responsável
 */
router.get('/por-responsavel', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de features ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/por-responsavel:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar features por responsável',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/dashboard/status
 * Dashboard - Status
 */
router.get('/dashboard/status', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de dashboard ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/dashboard/status:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar dashboard status',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/dashboard/tempo-aberto
 * Dashboard - Tempo aberto
 */
router.get('/dashboard/tempo-aberto', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de dashboard ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/dashboard/tempo-aberto:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar tempo aberto',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/dashboard/ultima-atualizacao
 * Dashboard - Última atualização
 */
router.get('/dashboard/ultima-atualizacao', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de dashboard ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/dashboard/ultima-atualizacao:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar última atualização',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/dashboard/detalhes
 * Dashboard - Detalhes
 */
router.get('/dashboard/detalhes', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de dashboard ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/dashboard/detalhes:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar detalhes',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/dashboard/causa-raiz
 * Dashboard - Causa raiz
 */
router.get('/dashboard/causa-raiz', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de dashboard ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/dashboard/causa-raiz:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar causa raiz',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/dashboard/em-andamento
 * Dashboard - Em andamento
 */
router.get('/dashboard/em-andamento', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de dashboard ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/dashboard/em-andamento:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar features em andamento',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/sla
 * SLA de features
 */
router.get('/sla', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de SLA ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/sla:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar SLA',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/sla-responsavel
 * SLA por responsável
 */
router.get('/sla-responsavel', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de SLA ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/sla-responsavel:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar SLA por responsável',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/top-20-clientes
 * Top 20 clientes
 */
router.get('/top-20-clientes', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Analytics de top clientes ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/top-20-clientes:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar top 20 clientes',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/features/lista-responsaveis
 * Lista de responsáveis
 */
router.get('/lista-responsaveis', async (req, res) => {
  try {
    res.status(501).json({
      error: 'Lista de responsáveis ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para agregações complexas',
      suggestion: 'Use o endpoint /api/features/responsible/list para obter lista de responsáveis'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/lista-responsaveis:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar lista de responsáveis',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

export default router;
