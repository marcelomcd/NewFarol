/**
 * Rotas para geração de relatórios
 * Versão simplificada - sem banco de dados
 * Convertido do Python para Node.js
 */
import express from 'express';

const router = express.Router();

/**
 * POST /api/reports/execute
 * Executar relatório (placeholder)
 */
router.post('/execute', async (req, res) => {
  try {
    const { type, days, filters = {} } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Parâmetro "type" é obrigatório' });
    }

    // Por enquanto, retorna mensagem informando que relatórios serão implementados
    res.status(501).json({
      error: 'Relatórios ainda não implementados no backend Node.js',
      message: `Tipo de relatório solicitado: ${type}`,
      suggestion: 'Use os endpoints específicos como /api/work-items/features/overdue, /api/azdo/consolidated, etc.'
    });
  } catch (error) {
    console.error('[ERROR] /api/reports/execute:', error);
    res.status(500).json({
      error: error.message || 'Erro ao executar relatório',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

export default router;
