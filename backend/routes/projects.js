/**
 * Rotas para gerenciamento de projetos
 * Convertido do Python para Node.js
 */
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * GET /api/projects
 * Lista todos os projetos disponíveis
 */
router.get('/', async (req, res) => {
  try {
    const pat = process.env.AZDO_PAT;
    const baseUrl = process.env.AZDO_BASE_URL || 'https://dev.azure.com/qualiit/';
    const apiVersion = process.env.AZDO_API_VERSION || '7.0';

    if (!pat || !pat.trim()) {
      return res.status(500).json({ 
        error: 'Azure DevOps Client não configurado. Configure AZDO_PAT no .env' 
      });
    }

    // Criar header de autenticação
    const patEncoded = Buffer.from(`:${pat}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${patEncoded}`,
      'Content-Type': 'application/json',
    };

    const url = `${baseUrl}_apis/projects?api-version=${apiVersion}`;
    const response = await axios.get(url, { headers });

    const projects = response.data.value || [];
    
    const projectsList = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      state: p.state || 'wellFormed',
      url: p.url
    }));

    res.json({ projects: projectsList });

  } catch (error) {
    console.error('[ERROR] /api/projects:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao buscar projetos',
      ...(process.env.DEBUG === 'true' && { stack: error.stack })
    });
  }
});

export default router;
