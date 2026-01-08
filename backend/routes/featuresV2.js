/**
 * Rotas v2 para Features - Arquitetura limpa
 * Convertido do Python para Node.js
 */
import express from 'express';
import { WIQLClient } from '../utils/wiqlClient.js';
import { getFeaturesQuery, getEpicsQuery } from '../utils/wiql.js';
import { extractClientName } from '../utils/normalization.js';
import { getUserClientFilter } from '../utils/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const project = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';

/**
 * GET /api/v2/clients
 * Lista de clientes válidos extraídos dos Epics
 */
router.get('/clients', async (req, res) => {
  try {
    const wiql = new WIQLClient();
    const query = getEpicsQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ clients: [], count: 0, source: 'wiql' });
    }

    const fields = ['System.AreaPath', 'System.IterationPath'];
    const epics = await wiql.getWorkItems(workItemIds, fields);

    const clientsSet = new Set();
    for (const epic of epics) {
      const fields = epic.fields || {};
      const clientName = extractClientName(fields['System.AreaPath'], fields['System.IterationPath']);
      if (clientName) {
        clientsSet.add(clientName);
      }
    }

    const clients = Array.from(clientsSet).sort();
    res.json({ clients, count: clients.length, source: 'wiql' });
  } catch (error) {
    console.error('[ERROR] /api/v2/clients:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar clientes' });
  }
});

/**
 * GET /api/v2/features
 * Lista Features em aberto
 */
router.get('/features', async (req, res) => {
  try {
    const { client, token } = req.query;

    const wiql = new WIQLClient();
    const query = getFeaturesQuery(null, false);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ items: [], count: 0, source: 'wiql' });
    }

    const fields = [
      'System.Id', 'System.Title', 'System.State', 'System.CreatedDate',
      'System.ChangedDate', 'System.AreaPath', 'System.IterationPath',
      'System.AssignedTo', 'System.Tags', 'Microsoft.VSTS.Scheduling.TargetDate',
      'System.BoardColumn', 'Custom.StatusProjeto', 'Custom.ResponsavelCliente'
    ];

    const workItems = await wiql.getWorkItems(workItemIds, fields);

    // Determinar filtro de cliente
    const userClient = getUserClientFilter(token);
    const filterClient = client || userClient;

    // Transformar e filtrar
    let items = workItems.map(item => {
      const fields = item.fields || {};
      const clientName = extractClientName(fields['System.AreaPath'], fields['System.IterationPath']);
      
      return {
        id: item.id,
        title: fields['System.Title'] || '',
        state: fields['System.State'] || '',
        normalized_state: fields['System.State'] || '',
        client: clientName,
        pmo: fields['System.AssignedTo']?.displayName || null,
        target_date: fields['Microsoft.VSTS.Scheduling.TargetDate'] || null,
        board_column: fields['System.BoardColumn'] || '',
        farol_status: fields['Custom.StatusProjeto'] || null,
        changed_date: fields['System.ChangedDate'] || '',
        created_date: fields['System.CreatedDate'] || '',
        tags: fields['System.Tags'] ? fields['System.Tags'].split(';').filter(t => t.trim()) : [],
      };
    });

    // Aplicar filtro de cliente
    if (filterClient) {
      items = items.filter(item => 
        item.client && item.client.toLowerCase() === filterClient.toLowerCase()
      );
    }

    res.json({ items, count: items.length, source: 'wiql' });
  } catch (error) {
    console.error('[ERROR] /api/v2/features:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar features' });
  }
});

/**
 * GET /api/v2/features/counts
 * Contagens de Features
 */
router.get('/features/counts', async (req, res) => {
  try {
    const { token } = req.query;

    const wiql = new WIQLClient();
    const query = getFeaturesQuery(null, false);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ total: 0, open: 0, source: 'wiql' });
    }

    // Se houver filtro de cliente, precisa hidratar
    const userClient = getUserClientFilter(token);
    if (userClient) {
      const fields = ['System.AreaPath', 'System.IterationPath'];
      const workItems = await wiql.getWorkItems(workItemIds, fields);
      const filtered = workItems.filter(item => {
        const fields = item.fields || {};
        const clientName = extractClientName(fields['System.AreaPath'], fields['System.IterationPath']);
        return clientName && clientName.toLowerCase() === userClient.toLowerCase();
      });
      return res.json({ total: filtered.length, open: filtered.length, source: 'wiql' });
    }

    res.json({ total: workItemIds.length, open: workItemIds.length, source: 'wiql' });
  } catch (error) {
    console.error('[ERROR] /api/v2/features/counts:', error);
    res.status(500).json({ error: error.message || 'Erro ao contar features' });
  }
});

export default router;
