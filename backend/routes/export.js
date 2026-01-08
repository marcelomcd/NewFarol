/**
 * Rotas para exportação de dados
 * Versão simplificada - sem Excel por enquanto
 * Convertido do Python para Node.js
 */
import express from 'express';

const router = express.Router();

/**
 * POST /api/features/export
 * Exporta features (placeholder - retorna JSON)
 */
router.post('/features/export', async (req, res) => {
  try {
    // Por enquanto, retorna mensagem informando que exportação Excel será implementada
    res.status(501).json({
      error: 'Exportação para Excel ainda não implementada no backend Node.js',
      message: 'Use o endpoint GET /api/features para obter os dados em JSON',
      suggestion: 'O frontend pode implementar a exportação Excel usando bibliotecas como xlsx ou exceljs'
    });
  } catch (error) {
    console.error('[ERROR] /api/export/features/export:', error);
    res.status(500).json({
      error: error.message || 'Erro ao exportar features',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

export default router;
