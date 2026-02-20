/**
 * Rotas para gerenciamento de features
 * Mantém o padrão: WIQL -> IDs -> Hidratação
 * Convertido do Python para Node.js
 */
import express from 'express';
import { WIQLClient } from '../utils/wiqlClient.js';
import { getFeaturesQuery, getTasksOpenQuery, getTasksClosedQuery } from '../utils/wiql.js';
import { extractClientName, extractPmoName, extractResponsavelCliente, normalizeFarolStatus } from '../utils/normalization.js';
import { getUserClientFilter } from '../utils/auth.js';
import { formatWorkItemFieldsFlat, formatWorkItemFields, filterRawFields } from '../utils/fieldFormatter.js';
import cache from '../utils/ttlCache.js';
import { organizeChecklistByTransition } from '../utils/checklistOrganizer.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const project = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';

/** Extrai ID do parent das relations do work item (mesmo padrão de workItems.js) */
function extractParentId(relations) {
  if (!relations || !Array.isArray(relations)) return null;
  const parentRel = relations.find(
    (r) =>
      r?.rel?.includes('Hierarchy-Reverse') ||
      (r?.attributes?.name && String(r.attributes.name).toLowerCase() === 'parent')
  );
  if (!parentRel?.url) return null;
  const match = parentRel.url.match(/workItems\/(\d+)(?:\?|$)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * GET /api/features
 * Lista features com filtros e paginação
 * Usa padrão: WIQL -> IDs -> Hidratação
 */
router.get('/', async (req, res) => {
  try {
    const {
      project_id,
      state,
      client,
      pmo,
      responsible,
      search,
      page = 1,
      limit = 100,
      token
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 100;

    // Aplicar filtro de cliente baseado no email do usuário
    let userClientFilter = getUserClientFilter(token);
    if (userClientFilter) {
      // Se o usuário tem um cliente específico, forçar filtro por esse cliente
      client = userClientFilter;
    }

    const wiql = new WIQLClient();

    // Gerar query WIQL
    const includeClosed = state === 'Closed' || state === 'All';
    const wiqlQuery = getFeaturesQuery(null, includeClosed);

    // Executar WIQL para obter IDs
    const wiqlResult = await wiql.executeWiql(project, wiqlQuery);
    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({
        items: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0
        }
      });
    }

    // Campos essenciais para o frontend
    const fields = [
      'System.Id',
      'System.Title',
      'System.State',
      'System.WorkItemType',
      'System.CreatedDate',
      'System.ChangedDate',
      'System.CreatedBy',
      'System.ChangedBy',
      'System.AreaPath',
      'System.AssignedTo',
      'System.Tags',
      'Microsoft.VSTS.Scheduling.TargetDate',
      'Microsoft.VSTS.Scheduling.StartDate',
      'System.BoardColumn',
      'System.IterationPath',
      'System.Description',
      'Custom.ResponsavelCliente',
      'Custom.StatusProjeto'
    ];

    // Hidratação: buscar detalhes dos work items
    const workItems = await wiql.getWorkItems(workItemIds, fields);

    // Transformar para formato esperado pelo frontend
    let items = workItems.map(item => {
      const fields = item.fields || {};
      
      // Extrair cliente do AreaPath
      let clientName = null;
      if (fields['System.AreaPath']) {
        clientName = extractClientName(
          fields['System.AreaPath'],
          fields['System.IterationPath']
        );
      }

      // Extrair PMO do AssignedTo
      let pmoName = null;
      if (fields['System.AssignedTo']) {
        pmoName = extractPmoName(fields['System.AssignedTo']);
      }

      // Extrair responsible
      let responsibleName = null;
      if (fields['Custom.ResponsavelCliente']) {
        const resp = fields['Custom.ResponsavelCliente'];
        if (typeof resp === 'object' && resp !== null) {
          responsibleName = resp.displayName || null;
        } else if (typeof resp === 'string') {
          responsibleName = resp;
        }
      }

      // Calcular farol status
      const statusProjeto = fields['Custom.StatusProjeto'] || '';
      const farolStatus = normalizeFarolStatus(statusProjeto);

      // Calcular dias até target date (para farol)
      let daysUntilTarget = null;
      const targetDate = fields['Microsoft.VSTS.Scheduling.TargetDate'];
      if (targetDate) {
        try {
          const target = new Date(targetDate);
          const now = new Date();
          const diffTime = target - now;
          daysUntilTarget = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (e) {
          // Ignora erro
        }
      }

      return {
        id: item.id,
        project_id: fields['System.TeamProject'] || project,
        title: fields['System.Title'] || '',
        state: fields['System.State'] || '',
        work_item_type: fields['System.WorkItemType'] || 'Feature',
        changed_date: fields['System.ChangedDate'] || '',
        created_date: fields['System.CreatedDate'] || '',
        created_by: fields['System.CreatedBy']?.displayName || fields['System.CreatedBy']?.uniqueName || '',
        changed_by: fields['System.ChangedBy']?.displayName || fields['System.ChangedBy']?.uniqueName || '',
        area_path: fields['System.AreaPath'] || '',
        iteration_path: fields['System.IterationPath'] || '',
        assigned_to: pmoName || '',
        tags: fields['System.Tags'] ? fields['System.Tags'].split(';').filter(t => t.trim()) : [],
        client: clientName,
        pmo: pmoName,
        responsible: responsibleName,
        farol_status: farolStatus,
        board_column: fields['System.BoardColumn'] || null,
        target_date: targetDate || null,
        start_date: fields['Microsoft.VSTS.Scheduling.StartDate'] || null,
        raw_fields_json: filterRawFields(fields) // Campos brutos filtrados (sem campos formatados)
      };
    });

    // Aplicar filtros adicionais (após buscar do Azure DevOps)
    if (client) {
      items = items.filter(item => item.client && item.client.toLowerCase() === client.toLowerCase());
    }

    if (pmo) {
      items = items.filter(item => item.pmo && item.pmo.toLowerCase() === pmo.toLowerCase());
    }

    if (responsible) {
      items = items.filter(item => item.responsible && item.responsible.toLowerCase() === responsible.toLowerCase());
    }

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Paginação
    const total = items.length;
    const pages = total > 0 ? Math.ceil(total / limitNum) : 0;
    const offset = (pageNum - 1) * limitNum;
    const paginatedItems = items.slice(offset, offset + limitNum);

    res.json({
      items: paginatedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });

  } catch (error) {
    console.error('[ERROR] /api/features:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao buscar features',
      ...(process.env.DEBUG === 'true' && { stack: error.stack })
    });
  }
});

/**
 * GET /api/features/:id
 * Busca detalhes de uma feature específica
 * Usa padrão: Busca direta do Azure DevOps (sem WIQL, pois já temos o ID)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    const featureId = parseInt(id);

    if (isNaN(featureId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const wiql = new WIQLClient();

    // Buscar work item com todos os campos
    const workItems = await wiql.getWorkItems([featureId]);

    if (workItems.length === 0) {
      return res.status(404).json({ error: 'Feature não encontrada' });
    }

    const item = workItems[0];
    const fields = item.fields || {};

    // Extrair cliente
    let clientName = null;
    if (fields['System.AreaPath']) {
      clientName = extractClientName(
        fields['System.AreaPath'],
        fields['System.IterationPath']
      );
    }

    // Verificar se o usuário tem acesso a esta feature
    const userClient = getUserClientFilter(token);
    if (userClient) {
      // Usuário não é admin - verificar se a feature pertence ao cliente dele
      if (!clientName || clientName.toLowerCase() !== userClient.toLowerCase()) {
        return res.status(403).json({
          error: 'Você não tem permissão para acessar esta feature. Apenas features do seu cliente estão disponíveis.'
        });
      }
    }

    // Extrair PMO
    let pmoName = null;
    if (fields['System.AssignedTo']) {
      pmoName = extractPmoName(fields['System.AssignedTo']);
    }

    // Extrair responsible
    let responsibleName = null;
    if (fields['Custom.ResponsavelCliente']) {
      const resp = fields['Custom.ResponsavelCliente'];
      if (typeof resp === 'object' && resp !== null) {
        responsibleName = resp.displayName || null;
      } else if (typeof resp === 'string') {
        responsibleName = resp;
      }
    }

    // Calcular farol status
    const statusProjeto = fields['Custom.StatusProjeto'] || '';
    const farolStatus = normalizeFarolStatus(statusProjeto);

    // Formatar campos brutos para campos legíveis
    const formattedFields = formatWorkItemFieldsFlat(fields);
    const formattedFieldsByCategory = formatWorkItemFields(fields);
    // Filtrar campos brutos removendo campos já formatados
    const filteredRawFields = filterRawFields(fields);
    // Organizar checklist por transição de estado (usa formattedFields e fields originais)
    const checklistByTransition = organizeChecklistByTransition(formattedFields, fields);

    const featureDetail = {
      id: item.id,
      project_id: fields['System.TeamProject'] || project,
      title: fields['System.Title'] || '',
      state: fields['System.State'] || '',
      work_item_type: fields['System.WorkItemType'] || 'Feature',
      changed_date: fields['System.ChangedDate'] || '',
      created_date: fields['System.CreatedDate'] || '',
      created_by: fields['System.CreatedBy']?.displayName || fields['System.CreatedBy']?.uniqueName || '',
      changed_by: fields['System.ChangedBy']?.displayName || fields['System.ChangedBy']?.uniqueName || '',
      area_path: fields['System.AreaPath'] || '',
      iteration_path: fields['System.IterationPath'] || '',
      assigned_to: pmoName || '',
      tags: fields['System.Tags'] ? fields['System.Tags'].split(';').filter(t => t.trim()) : [],
      client: clientName,
      pmo: pmoName,
      responsible: responsibleName,
      farol_status: farolStatus,
      board_column: fields['System.BoardColumn'] || null,
      target_date: fields['Microsoft.VSTS.Scheduling.TargetDate'] || null,
      start_date: fields['Microsoft.VSTS.Scheduling.StartDate'] || null,
      description: fields['System.Description'] || '',
      fields_formatted: formattedFields,
      fields_formatted_by_category: formattedFieldsByCategory,
      checklist_by_transition: checklistByTransition,
      raw_fields_json: filteredRawFields
    };

    res.json(featureDetail);

  } catch (error) {
    console.error(`[ERROR] /api/features/${req.params.id}:`, error);
    
    // Tratar rate limit especificamente
    if (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('rate limit'))) {
      return res.status(429).json({
        error: `Rate limit do Azure DevOps atingido. Tente novamente em alguns segundos.`
      });
    }

    res.status(500).json({ 
      error: error.message || 'Erro ao buscar feature',
      ...(process.env.DEBUG === 'true' && { stack: error.stack })
    });
  }
});

/**
 * GET /api/features/:id/fields
 * Busca campos formatados de uma feature específica
 */
router.get('/:id/fields', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    const { category } = req.query; // Opcional: 'flat' ou 'category'
    const featureId = parseInt(id);

    if (isNaN(featureId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const wiql = new WIQLClient();

    // Buscar work item com todos os campos
    const workItems = await wiql.getWorkItems([featureId]);

    if (workItems.length === 0) {
      return res.status(404).json({ error: 'Feature não encontrada' });
    }

    const item = workItems[0];
    const fields = item.fields || {};

    // Extrair cliente para verificação de acesso
    let clientName = null;
    if (fields['System.AreaPath']) {
      clientName = extractClientName(
        fields['System.AreaPath'],
        fields['System.IterationPath']
      );
    }

    // Verificar se o usuário tem acesso a esta feature
    const userClient = getUserClientFilter(token);
    if (userClient) {
      if (!clientName || clientName.toLowerCase() !== userClient.toLowerCase()) {
        return res.status(403).json({
          error: 'Você não tem permissão para acessar esta feature. Apenas features do seu cliente estão disponíveis.'
        });
      }
    }

    // Formatar campos
    const formattedFields = formatWorkItemFieldsFlat(fields);
    const formattedFieldsByCategory = formatWorkItemFields(fields);

    // Retornar formato solicitado
    if (category === 'flat') {
      res.json({
        feature_id: featureId,
        fields: formattedFields
      });
    } else if (category === 'category') {
      res.json({
        feature_id: featureId,
        fields: formattedFieldsByCategory
      });
    } else {
      // Por padrão, retorna ambos
      res.json({
        feature_id: featureId,
        fields_flat: formattedFields,
        fields_by_category: formattedFieldsByCategory
      });
    }

  } catch (error) {
    console.error(`[ERROR] /api/features/${req.params.id}/fields:`, error);
    
    if (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('rate limit'))) {
      return res.status(429).json({
        error: 'Rate limit do Azure DevOps atingido. Tente novamente em alguns segundos.'
      });
    }

    res.status(500).json({ 
      error: error.message || 'Erro ao buscar campos formatados',
      ...(process.env.DEBUG === 'true' && { stack: error.stack })
    });
  }
});

/**
 * GET /api/features/:id/revisions
 * Busca revisões (histórico) de uma feature
 */
router.get('/:id/revisions', async (req, res) => {
  try {
    const { id } = req.params;
    const featureId = parseInt(id);

    if (isNaN(featureId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { AzureDevOpsClientExtended } = await import('../utils/azureDevOpsClientExtended.js');
    const azureClient = new AzureDevOpsClientExtended();

    // Buscar revisões
    const revisions = await azureClient.getWorkItemRevisions(featureId);

    // Processar comentários das revisões
    const comments = [];
    for (const revision of revisions) {
      const fields = revision.fields || {};
      const history = fields['System.History'] || '';
      
      if (history) {
        const changedBy = fields['System.ChangedBy'] || {};
        const changedByName = changedBy.displayName || changedBy.uniqueName || 'Desconhecido';
        const changedDate = fields['System.ChangedDate'] || '';

        comments.push({
          data: changedDate,
          data_formatada: changedDate ? new Date(changedDate).toLocaleDateString('pt-BR') : '',
          conteudo: history,
          responsavel: changedByName,
        });
      }
    }

    // Ordenar por data (mais recente primeiro)
    comments.sort((a, b) => new Date(b.data) - new Date(a.data));

    res.json({
      feature_id: featureId,
      revisions_count: revisions.length,
      comments: comments,
    });

  } catch (error) {
    console.error(`[ERROR] /api/features/${req.params.id}/revisions:`, error);
    
    if (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('rate limit'))) {
      return res.status(429).json({
        error: 'Rate limit do Azure DevOps atingido. Tente novamente em alguns segundos.'
      });
    }

    res.status(500).json({ 
      error: error.message || 'Erro ao buscar revisões',
      ...(process.env.DEBUG === 'true' && { stack: error.stack })
    });
  }
});

/**
 * GET /api/features/:id/relations
 * Busca relacionamentos parent/child de uma feature
 */
router.get('/:id/relations', async (req, res) => {
  try {
    const { id } = req.params;
    const featureId = parseInt(id);

    if (isNaN(featureId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { AzureDevOpsClientExtended } = await import('../utils/azureDevOpsClientExtended.js');
    const azureClient = new AzureDevOpsClientExtended();

    const relationsData = await azureClient.getWorkItemRelations(featureId);

    res.json({
      feature_id: featureId,
      children: relationsData.children,
      children_count: relationsData.children.length,
      parents: relationsData.parents,
      parent_ids: relationsData.parent_ids,
      child_ids: relationsData.child_ids,
    });

  } catch (error) {
    console.error(`[ERROR] /api/features/${req.params.id}/relations:`, error);
    
    if (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('rate limit'))) {
      return res.status(429).json({
        error: 'Rate limit do Azure DevOps atingido. Tente novamente em alguns segundos.'
      });
    }

    res.status(500).json({ 
      error: error.message || 'Erro ao buscar relacionamentos',
      ...(process.env.DEBUG === 'true' && { stack: error.stack })
    });
  }
});

/**
 * GET /api/features/:id/children
 * Busca User Stories e Tasks vinculadas a uma Feature
 */
router.get('/:id/children', async (req, res) => {
  try {
    const { id } = req.params;
    const featureId = parseInt(id);

    if (isNaN(featureId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { AzureDevOpsClientExtended } = await import('../utils/azureDevOpsClientExtended.js');
    const azureClient = new AzureDevOpsClientExtended();

    // Buscar work item da feature para obter relações
    const workItem = await azureClient.getWorkItem(featureId, 'all');
    const relations = workItem.relations || [];

    // Extrair IDs dos children
    const childIds = [];
    for (const relation of relations) {
      const relType = relation.rel || '';
      const url = relation.url || '';

      if ((relType.includes('System.LinkTypes.Hierarchy-Forward') || relType.toLowerCase().includes('child')) && url) {
        try {
          const childId = parseInt(url.split('/workitems/')[1]?.split('?')[0]);
          if (!isNaN(childId)) {
            childIds.push(childId);
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Buscar work items dos children
    const userStories = [];
    const tasks = [];

    if (childIds.length > 0) {
      const childItems = await azureClient.getWorkItems(childIds, 'all');

      for (const item of childItems) {
        const fields = item.fields || {};
        const workItemType = fields['System.WorkItemType'] || '';

        const childData = {
          id: item.id,
          title: fields['System.Title'] || '',
          work_item_type: workItemType,
          state: fields['System.State'] || '',
          created_date: fields['System.CreatedDate'] || '',
          changed_date: fields['System.ChangedDate'] || '',
          created_by: fields['System.CreatedBy']?.displayName || fields['System.CreatedBy']?.uniqueName || '',
          changed_by: fields['System.ChangedBy']?.displayName || fields['System.ChangedBy']?.uniqueName || '',
          assigned_to: fields['System.AssignedTo']?.displayName || fields['System.AssignedTo']?.uniqueName || '',
          area_path: fields['System.AreaPath'] || '',
          iteration_path: fields['System.IterationPath'] || '',
          description: fields['System.Description'] || '',
          tags: fields['System.Tags'] ? fields['System.Tags'].split(';').filter(t => t.trim()) : [],
          url: item.url || '',
          web_url: item._links?.html?.href || '',
          raw_fields_json: fields,
        };

        if (workItemType === 'User Story') {
          childData.story_points = fields['Microsoft.VSTS.Scheduling.StoryPoints'] || null;
          childData.priority = fields['Microsoft.VSTS.Common.Priority'] || null;
          childData.effort = fields['Microsoft.VSTS.Scheduling.Effort'] || null;
          userStories.push(childData);
        } else if (workItemType === 'Task') {
          childData.activity = fields['Microsoft.VSTS.Common.Activity'] || '';
          childData.remaining_work = fields['Microsoft.VSTS.Scheduling.RemainingWork'] || null;
          childData.completed_work = fields['Microsoft.VSTS.Scheduling.CompletedWork'] || null;
          childData.original_estimate = fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || null;
          tasks.push(childData);
        }
      }
    }

    res.json({
      feature_id: featureId,
      user_stories: userStories,
      tasks: tasks,
      user_stories_count: userStories.length,
      tasks_count: tasks.length,
      total_count: userStories.length + tasks.length,
    });

  } catch (error) {
    console.error(`[ERROR] /api/features/${req.params.id}/children:`, error);
    res.status(500).json({ 
      error: error.message || 'Erro ao buscar User Stories e Tasks',
      ...(process.env.DEBUG === 'true' && { stack: error.stack })
    });
  }
});

/**
 * GET /api/features/:id/attachments
 * Busca anexos de uma feature
 */
router.get('/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const featureId = parseInt(id);

    if (isNaN(featureId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { AzureDevOpsClientExtended } = await import('../utils/azureDevOpsClientExtended.js');
    const azureClient = new AzureDevOpsClientExtended();

    const attachments = await azureClient.getWorkItemAttachments(featureId);

    res.json({
      feature_id: featureId,
      attachments: attachments,
    });

  } catch (error) {
    console.error(`[ERROR] /api/features/${req.params.id}/attachments:`, error);
    res.status(500).json({ 
      error: error.message || 'Erro ao buscar anexos',
      ...(process.env.DEBUG === 'true' && { stack: error.stack })
    });
  }
});

/**
 * GET /api/features/:id/links
 * Busca links relacionados de uma feature
 */
router.get('/:id/links', async (req, res) => {
  try {
    const { id } = req.params;
    const featureId = parseInt(id);

    if (isNaN(featureId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { AzureDevOpsClientExtended } = await import('../utils/azureDevOpsClientExtended.js');
    const azureClient = new AzureDevOpsClientExtended();

    const links = await azureClient.getWorkItemLinks(featureId);

    res.json({
      feature_id: featureId,
      links: links,
    });

  } catch (error) {
    console.error(`[ERROR] /api/features/${req.params.id}/links:`, error);
    res.status(500).json({ 
      error: error.message || 'Erro ao buscar links',
      ...(process.env.DEBUG === 'true' && { stack: error.stack })
    });
  }
});

/**
 * GET /api/features/open/wiql
 * Features abertas (State <> Closed)
 */
router.get('/open/wiql', async (req, res) => {
  try {
    const { token } = req.query;

    const wiql = new WIQLClient();
    const query = getFeaturesQuery(null, false); // Não incluir fechadas
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ items: [], count: 0, source: 'wiql' });
    }

    const fields = [
      'System.Id', 'System.Title', 'System.State', 'System.WorkItemType',
      'System.CreatedDate', 'System.ChangedDate', 'System.AreaPath',
      'System.AssignedTo', 'System.Tags', 'Microsoft.VSTS.Scheduling.TargetDate',
      'System.BoardColumn', 'Custom.StatusProjeto', 'Custom.ResponsavelCliente'
    ];

    const workItems = await wiql.getWorkItems(workItemIds, fields);

    // Aplicar filtro de cliente
    const userClient = getUserClientFilter(token);
    let items = workItems.map(item => {
      const fields = item.fields || {};
      const clientName = extractClientName(fields['System.AreaPath'], fields['System.IterationPath']);
      return {
        id: item.id,
        title: fields['System.Title'] || '',
        state: fields['System.State'] || '',
        client: clientName,
        pmo: extractPmoName(fields['System.AssignedTo']),
        farol_status: normalizeFarolStatus(fields['Custom.StatusProjeto']),
        target_date: fields['Microsoft.VSTS.Scheduling.TargetDate'] || null,
        board_column: fields['System.BoardColumn'] || '',
        raw_fields_json: filterRawFields(fields),
      };
    });

    if (userClient) {
      items = items.filter(item => item.client && item.client.toLowerCase() === userClient.toLowerCase());
    }

    res.json({ items, count: items.length, source: 'wiql' });
  } catch (error) {
    console.error('[ERROR] /api/features/open/wiql:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar features abertas' });
  }
});

/**
 * GET /api/features/closed/wiql
 * Features fechadas (State = Closed)
 */
router.get('/closed/wiql', async (req, res) => {
  try {
    const { token } = req.query;

    const wiql = new WIQLClient();
    const query = getFeaturesQuery(null, true); // Incluir fechadas
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ items: [], count: 0, source: 'wiql' });
    }

    const fields = [
      'System.Id', 'System.Title', 'System.State', 'System.WorkItemType',
      'System.CreatedDate', 'System.ChangedDate', 'System.AreaPath',
      'System.AssignedTo', 'System.Tags', 'Microsoft.VSTS.Scheduling.TargetDate',
      'System.BoardColumn', 'Custom.StatusProjeto'
    ];

    const workItems = await wiql.getWorkItems(workItemIds, fields);

    // Filtrar apenas fechadas
    let items = workItems
      .filter(item => (item.fields || {})['System.State'] === 'Closed')
      .map(item => {
        const fields = item.fields || {};
        const clientName = extractClientName(fields['System.AreaPath'], fields['System.IterationPath']);
        return {
          id: item.id,
          title: fields['System.Title'] || '',
          state: fields['System.State'] || '',
          client: clientName,
          pmo: extractPmoName(fields['System.AssignedTo']),
          farol_status: normalizeFarolStatus(fields['Custom.StatusProjeto']),
          target_date: fields['Microsoft.VSTS.Scheduling.TargetDate'] || null,
          raw_fields_json: fields,
        };
      });

    // Aplicar filtro de cliente
    const userClient = getUserClientFilter(token);
    if (userClient) {
      items = items.filter(item => item.client && item.client.toLowerCase() === userClient.toLowerCase());
    }

    res.json({ items, count: items.length, source: 'wiql' });
  } catch (error) {
    console.error('[ERROR] /api/features/closed/wiql:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar features fechadas' });
  }
});

const TASKS_CACHE_TTL = 60; // 60 segundos - reduz chamadas ao Azure

/**
 * GET /api/features/tasks/open/wiql
 * Tasks abertas (New, Active) - mesmo padrão de Features: client e assigned_to do Parent
 */
router.get('/tasks/open/wiql', async (req, res) => {
  try {
    const cacheKey = 'features:tasks:open';
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const wiql = new WIQLClient();
    const query = getTasksOpenQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);
    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ items: [], count: 0, source: 'wiql' });
    }

    // Tasks: $expand=all para obter relations (parent)
    const tasksData = await wiql.getWorkItems(workItemIds);
    const taskToParentId = new Map();
    for (const t of tasksData) {
      const pid = extractParentId(t.relations);
      if (pid) taskToParentId.set(t.id, pid);
    }

    const uniqueParentIds = [...new Set(taskToParentId.values())];
    const parentDataMap = new Map();
    if (uniqueParentIds.length > 0) {
      const parentsData = await wiql.getWorkItems(uniqueParentIds);
      const featureParentIds = [];
      for (const parent of parentsData) {
        const fields = parent.fields || {};
        const client = extractClientName(fields['System.AreaPath'], fields['System.IterationPath']);
        let responsible = extractResponsavelCliente(fields['Custom.ResponsavelCliente']);
        const workItemType = fields['System.WorkItemType'] || '';
        if (!responsible && workItemType === 'User Story') {
          const gpId = extractParentId(parent.relations);
          if (gpId) featureParentIds.push({ parentId: parent.id, featureId: gpId });
        }
        parentDataMap.set(parent.id, { client: client || null, responsible: responsible || null });
      }
      if (featureParentIds.length > 0) {
        const featureIds = [...new Set(featureParentIds.map(p => p.featureId))];
        const featuresData = await wiql.getWorkItems(featureIds);
        for (const f of featuresData) {
          const resp = extractResponsavelCliente(f.fields?.['Custom.ResponsavelCliente']);
          if (resp) {
            for (const { parentId } of featureParentIds.filter(p => p.featureId === f.id)) {
              const existing = parentDataMap.get(parentId);
              if (existing) parentDataMap.set(parentId, { ...existing, responsible: resp });
            }
          }
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = tasksData.map(task => {
      const fields = task.fields || {};
      const pid = taskToParentId.get(task.id);
      const parentData = pid && parentDataMap.has(pid) ? parentDataMap.get(pid) : { client: null, responsible: null };
      const targetDateStr = fields['Microsoft.VSTS.Scheduling.TargetDate'] || null;
      let daysOverdue = null;
      if (targetDateStr) {
        try {
          const target = new Date(targetDateStr);
          target.setHours(0, 0, 0, 0);
          if (target < today) {
            daysOverdue = Math.floor((today - target) / (1000 * 60 * 60 * 24));
          }
        } catch (e) { /* ignora */ }
      }
      return {
        id: task.id,
        title: fields['System.Title'] || '',
        state: fields['System.State'] || '',
        assigned_to: extractPmoName(fields['System.AssignedTo']) || null,
        client: parentData.client,
        responsible: parentData.responsible,
        target_date: targetDateStr,
        days_overdue: daysOverdue,
        created_date: fields['System.CreatedDate'] || '',
        changed_date: fields['System.ChangedDate'] || '',
        web_url: task._links?.html?.href || '',
        raw_fields_json: {
          ...fields,
          work_item_type: 'Task',
          web_url: task._links?.html?.href || '',
        },
      };
    });

    const result = { items, count: items.length, source: 'wiql' };
    cache.set(cacheKey, result, TASKS_CACHE_TTL);
    res.json(result);
  } catch (error) {
    console.error('[ERROR] /api/features/tasks/open/wiql:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar tasks abertas' });
  }
});

/**
 * GET /api/features/tasks/closed/wiql
 * Tasks fechadas (Closed) - mesmo padrão de Features
 */
router.get('/tasks/closed/wiql', async (req, res) => {
  try {
    const cacheKey = 'features:tasks:closed';
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const wiql = new WIQLClient();
    const query = getTasksClosedQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);
    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ items: [], count: 0, source: 'wiql' });
    }

    const tasksData = await wiql.getWorkItems(workItemIds);
    const taskToParentId = new Map();
    for (const t of tasksData) {
      const pid = extractParentId(t.relations);
      if (pid) taskToParentId.set(t.id, pid);
    }

    const uniqueParentIds = [...new Set(taskToParentId.values())];
    const parentDataMap = new Map();
    if (uniqueParentIds.length > 0) {
      const parentsData = await wiql.getWorkItems(uniqueParentIds);
      const featureParentIds = [];
      for (const parent of parentsData) {
        const fields = parent.fields || {};
        const client = extractClientName(fields['System.AreaPath'], fields['System.IterationPath']);
        let responsible = extractResponsavelCliente(fields['Custom.ResponsavelCliente']);
        const workItemType = fields['System.WorkItemType'] || '';
        if (!responsible && workItemType === 'User Story') {
          const gpId = extractParentId(parent.relations);
          if (gpId) featureParentIds.push({ parentId: parent.id, featureId: gpId });
        }
        parentDataMap.set(parent.id, { client: client || null, responsible: responsible || null });
      }
      if (featureParentIds.length > 0) {
        const featureIds = [...new Set(featureParentIds.map(p => p.featureId))];
        const featuresData = await wiql.getWorkItems(featureIds);
        for (const f of featuresData) {
          const resp = extractResponsavelCliente(f.fields?.['Custom.ResponsavelCliente']);
          if (resp) {
            for (const { parentId } of featureParentIds.filter(p => p.featureId === f.id)) {
              const existing = parentDataMap.get(parentId);
              if (existing) parentDataMap.set(parentId, { ...existing, responsible: resp });
            }
          }
        }
      }
    }

    const items = tasksData.map(task => {
      const fields = task.fields || {};
      const pid = taskToParentId.get(task.id);
      const parentData = pid && parentDataMap.has(pid) ? parentDataMap.get(pid) : { client: null, responsible: null };
      return {
        id: task.id,
        title: fields['System.Title'] || '',
        state: fields['System.State'] || '',
        assigned_to: extractPmoName(fields['System.AssignedTo']) || null,
        client: parentData.client,
        responsible: parentData.responsible,
        target_date: fields['Microsoft.VSTS.Scheduling.TargetDate'] || null,
        created_date: fields['System.CreatedDate'] || '',
        changed_date: fields['System.ChangedDate'] || '',
        web_url: task._links?.html?.href || '',
        raw_fields_json: {
          ...fields,
          work_item_type: 'Task',
          web_url: task._links?.html?.href || '',
        },
      };
    });

    const result = { items, count: items.length, source: 'wiql' };
    cache.set(cacheKey, result, TASKS_CACHE_TTL);
    res.json(result);
  } catch (error) {
    console.error('[ERROR] /api/features/tasks/closed/wiql:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar tasks fechadas' });
  }
});

/**
 * GET /api/features/open/count
 * Contagem de features abertas
 */
router.get('/open/count', async (req, res) => {
  try {
    const { token } = req.query;

    const wiql = new WIQLClient();
    const query = getFeaturesQuery(null, false);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ count: 0, source: 'wiql' });
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
      return res.json({ count: filtered.length, source: 'wiql' });
    }

    res.json({ count: workItemIds.length, source: 'wiql' });
  } catch (error) {
    console.error('[ERROR] /api/features/open/count:', error);
    res.status(500).json({ error: error.message || 'Erro ao contar features abertas' });
  }
});

/**
 * GET /api/features/counts/wiql
 * Contagens agregadas (total, abertas, atrasadas, próximas do prazo)
 */
router.get('/counts/wiql', async (req, res) => {
  try {
    const { token } = req.query;

    const wiql = new WIQLClient();
    
    // Buscar todas as features abertas
    const query = getFeaturesQuery(null, false);
    const wiqlResult = await wiql.executeWiql(project, query);
    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({
        total: 0,
        open: 0,
        overdue: 0,
        near_deadline: 0,
        source: 'wiql'
      });
    }

    const fields = [
      'System.State', 'Microsoft.VSTS.Scheduling.TargetDate',
      'System.AreaPath', 'System.IterationPath'
    ];
    const workItems = await wiql.getWorkItems(workItemIds, fields);

    // Aplicar filtro de cliente
    const userClient = getUserClientFilter(token);
    let filtered = workItems;
    if (userClient) {
      filtered = workItems.filter(item => {
        const fields = item.fields || {};
        const clientName = extractClientName(fields['System.AreaPath'], fields['System.IterationPath']);
        return clientName && clientName.toLowerCase() === userClient.toLowerCase();
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdue = 0;
    let nearDeadline = 0;

    for (const item of filtered) {
      const fields = item.fields || {};
      const targetDateStr = fields['Microsoft.VSTS.Scheduling.TargetDate'];
      if (targetDateStr) {
        try {
          const targetDate = new Date(targetDateStr);
          targetDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysDiff < 0) {
            overdue++;
          } else if (daysDiff <= 7) {
            nearDeadline++;
          }
        } catch (e) {
          // Ignora erro de parsing
        }
      }
    }

    res.json({
      total: filtered.length,
      open: filtered.length,
      overdue,
      near_deadline: nearDeadline,
      source: 'wiql'
    });
  } catch (error) {
    console.error('[ERROR] /api/features/counts/wiql:', error);
    res.status(500).json({ error: error.message || 'Erro ao contar features' });
  }
});

/**
 * GET /api/features/near-deadline/wiql
 * Features próximas do prazo
 */
router.get('/near-deadline/wiql', async (req, res) => {
  try {
    const { days = 7, token } = req.query;
    const daysNum = parseInt(days) || 7;

    const wiql = new WIQLClient();
    const query = getFeaturesQuery(null, false);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ items: [], count: 0, source: 'wiql', days: daysNum });
    }

    const fields = [
      'System.Id', 'System.Title', 'System.State', 'System.AreaPath',
      'System.IterationPath', 'Microsoft.VSTS.Scheduling.TargetDate',
      'System.BoardColumn', 'Custom.StatusProjeto'
    ];

    const workItems = await wiql.getWorkItems(workItemIds, fields);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aplicar filtro de cliente
    const userClient = getUserClientFilter(token);
    let items = workItems
      .filter(item => {
        const fields = item.fields || {};
        const targetDateStr = fields['Microsoft.VSTS.Scheduling.TargetDate'];
        if (!targetDateStr) return false;

        try {
          const targetDate = new Date(targetDateStr);
          targetDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));
          return daysDiff >= 0 && daysDiff <= daysNum;
        } catch (e) {
          return false;
        }
      })
      .map(item => {
        const fields = item.fields || {};
        const clientName = extractClientName(fields['System.AreaPath'], fields['System.IterationPath']);
        return {
          id: item.id,
          title: fields['System.Title'] || '',
          state: fields['System.State'] || '',
          client: clientName,
          farol_status: normalizeFarolStatus(fields['Custom.StatusProjeto']),
          target_date: fields['Microsoft.VSTS.Scheduling.TargetDate'] || null,
          raw_fields_json: fields,
        };
      });

    if (userClient) {
      items = items.filter(item => item.client && item.client.toLowerCase() === userClient.toLowerCase());
    }

    res.json({ items, count: items.length, source: 'wiql', days: daysNum });
  } catch (error) {
    console.error('[ERROR] /api/features/near-deadline/wiql:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar features próximas do prazo' });
  }
});

/**
 * GET /api/features/by-state/wiql
 * Features agrupadas por estado
 */
router.get('/by-state/wiql', async (req, res) => {
  try {
    const { token } = req.query;

    const wiql = new WIQLClient();
    const query = getFeaturesQuery(null, false);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ items: [], count_by_state: {}, source: 'wiql' });
    }

    const fields = ['System.State', 'System.AreaPath', 'System.IterationPath'];
    const workItems = await wiql.getWorkItems(workItemIds, fields);

    // Aplicar filtro de cliente
    const userClient = getUserClientFilter(token);
    let filtered = workItems;
    if (userClient) {
      filtered = workItems.filter(item => {
        const fields = item.fields || {};
        const clientName = extractClientName(fields['System.AreaPath'], fields['System.IterationPath']);
        return clientName && clientName.toLowerCase() === userClient.toLowerCase();
      });
    }

    const countByState = {};
    const items = filtered.map(item => {
      const fields = item.fields || {};
      const state = fields['System.State'] || 'Sem Estado';
      countByState[state] = (countByState[state] || 0) + 1;
      return {
        id: item.id,
        state,
        raw_fields_json: filterRawFields(fields),
      };
    });

    res.json({ items, count_by_state: countByState, source: 'wiql' });
  } catch (error) {
    console.error('[ERROR] /api/features/by-state/wiql:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar features por estado' });
  }
});

/**
 * GET /api/features/by-farol/wiql
 * Features agrupadas por farol
 */
router.get('/by-farol/wiql', async (req, res) => {
  try {
    const { token } = req.query;

    const wiql = new WIQLClient();
    const query = getFeaturesQuery(null, false);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ items: [], count_by_farol: {}, source: 'wiql' });
    }

    const fields = ['Custom.StatusProjeto', 'System.AreaPath', 'System.IterationPath'];
    const workItems = await wiql.getWorkItems(workItemIds, fields);

    // Aplicar filtro de cliente
    const userClient = getUserClientFilter(token);
    let filtered = workItems;
    if (userClient) {
      filtered = workItems.filter(item => {
        const fields = item.fields || {};
        const clientName = extractClientName(fields['System.AreaPath'], fields['System.IterationPath']);
        return clientName && clientName.toLowerCase() === userClient.toLowerCase();
      });
    }

    const countByFarol = {};
    const items = filtered.map(item => {
      const fields = item.fields || {};
      const farolStatus = normalizeFarolStatus(fields['Custom.StatusProjeto']);
      countByFarol[farolStatus] = (countByFarol[farolStatus] || 0) + 1;
      return {
        id: item.id,
        farol_status: farolStatus,
        raw_fields_json: fields,
      };
    });

    res.json({ items, count_by_farol: countByFarol, source: 'wiql' });
  } catch (error) {
    console.error('[ERROR] /api/features/by-farol/wiql:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar features por farol' });
  }
});

/**
 * GET /api/features/status/list
 * Lista de status únicos
 */
router.get('/status/list', async (req, res) => {
  try {
    const wiql = new WIQLClient();
    const query = getFeaturesQuery(null, false);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ status: [], count: 0 });
    }

    const fields = ['System.State'];
    const workItems = await wiql.getWorkItems(workItemIds, fields);

    const statusSet = new Set();
    for (const item of workItems) {
      const state = (item.fields || {})['System.State'];
      if (state) {
        statusSet.add(state);
      }
    }

    const status = Array.from(statusSet).sort();
    res.json({ status, count: status.length });
  } catch (error) {
    console.error('[ERROR] /api/features/status/list:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar lista de status' });
  }
});

/**
 * GET /api/features/pmo/list
 * Lista de PMOs únicos
 */
router.get('/pmo/list', async (req, res) => {
  try {
    const wiql = new WIQLClient();
    const query = getFeaturesQuery(null, false);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ pmo: [], count: 0 });
    }

    const fields = ['System.AssignedTo'];
    const workItems = await wiql.getWorkItems(workItemIds, fields);

    const pmoSet = new Set();
    for (const item of workItems) {
      const pmo = extractPmoName((item.fields || {})['System.AssignedTo']);
      if (pmo) {
        pmoSet.add(pmo);
      }
    }

    const pmo = Array.from(pmoSet).sort();
    res.json({ pmo, count: pmo.length });
  } catch (error) {
    console.error('[ERROR] /api/features/pmo/list:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar lista de PMOs' });
  }
});

/**
 * GET /api/features/responsible/list
 * Lista de responsáveis únicos
 */
router.get('/responsible/list', async (req, res) => {
  try {
    const wiql = new WIQLClient();
    const query = getFeaturesQuery(null, false);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemIds = (wiqlResult.workItems || []).map(wi => parseInt(wi.id)).filter(id => !isNaN(id));

    if (workItemIds.length === 0) {
      return res.json({ responsible: [], count: 0 });
    }

    const fields = ['Custom.ResponsavelCliente', 'System.AssignedTo'];
    const workItems = await wiql.getWorkItems(workItemIds, fields);

    const responsibleSet = new Set();
    for (const item of workItems) {
      const fields = item.fields || {};
      const responsavel = fields['Custom.ResponsavelCliente'];
      if (responsavel) {
        const name = typeof responsavel === 'object' ? responsavel.displayName : responsavel;
        if (name) {
          responsibleSet.add(name);
        }
      }
      // Fallback para AssignedTo
      const assignedTo = fields['System.AssignedTo'];
      if (assignedTo && typeof assignedTo === 'object') {
        const name = assignedTo.displayName;
        if (name) {
          responsibleSet.add(name);
        }
      }
    }

    const responsible = Array.from(responsibleSet).sort();
    res.json({ responsible, count: responsible.length });
  } catch (error) {
    console.error('[ERROR] /api/features/responsible/list:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar lista de responsáveis' });
  }
});

export default router;
