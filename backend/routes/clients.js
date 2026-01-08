/**
 * Rotas para clientes
 * Mantém o padrão: WIQL -> IDs -> Hidratação
 * Convertido do Python para Node.js
 */
import express from 'express';
import { WIQLClient } from '../utils/wiqlClient.js';
import { getEpicsQuery } from '../utils/wiql.js';
import { extractClientName } from '../utils/normalization.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const project = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';

/**
 * GET /api/clients/valid
 * Lista clientes válidos (extraídos de Epics)
 */
router.get('/valid', async (req, res) => {
  try {
    if (!azureClient) {
      return res.status(500).json({ 
        error: 'Azure DevOps Client não configurado. Configure AZDO_PAT no .env' 
      });
    }

    const wiql = new WIQLClient();

    // Executar query WIQL para buscar Epics
    const wiqlQuery = getEpicsQuery(null);
    const wiqlResult = await wiql.executeWiql(project, wiqlQuery);
    const epicIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (epicIds.length === 0) {
      return res.json({ clients: [], count: 0 });
    }

    // Buscar detalhes dos Epics (hidratação)
    const epicFields = ['System.Id', 'System.Title', 'System.AreaPath', 'System.IterationPath'];
    const epics = await wiql.getWorkItems(epicIds, epicFields);

    // Extrair nomes de clientes dos AreaPaths dos Epics
    const clients = new Set();
    epics.forEach(epic => {
      const fields = epic.fields || {};
      const areaPath = fields['System.AreaPath'] || '';
      const iterationPath = fields['System.IterationPath'] || '';
      
      // Usar função de normalização para extrair cliente
      const clientName = extractClientName(areaPath, iterationPath);
      if (clientName) {
        clients.add(clientName);
      }
    });

    const clientsList = Array.from(clients).sort();

    res.json({
      clients: clientsList,
      count: clientsList.length
    });

  } catch (error) {
    console.error('[ERROR] /api/clients/valid:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao buscar clientes válidos',
      ...(process.env.DEBUG === 'true' && { stack: error.stack })
    });
  }
});

export default router;
