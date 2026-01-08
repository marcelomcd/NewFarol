/**
 * Rotas para webhooks do Azure DevOps
 */
import express from 'express';

const router = express.Router();

/**
 * POST /webhooks/azdo
 * Recebe webhooks do Azure DevOps
 */
router.post('/azdo', async (req, res) => {
  try {
    // Por enquanto, apenas logar
    console.log('[WEBHOOK] Azure DevOps:', req.body);
    res.json({ received: true });

  } catch (error) {
    console.error('[ERROR] /webhooks/azdo:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao processar webhook',
      ...(process.env.DEBUG === 'true' && { stack: error.stack })
    });
  }
});

export default router;
