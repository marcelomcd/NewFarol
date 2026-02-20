/**
 * Rotas para Work Items diversos (Bugs, Tasks, User Stories, Features)
 * Mantém o padrão: WIQL -> IDs -> Hidratação
 * Convertido do Python para Node.js
 */
import express from 'express';
import { WIQLClient } from '../utils/wiqlClient.js';
import {
  getBugsQuery,
  getTasksQuery,
  getOverdueTasksQuery,
  getUserStoriesQuery,
  getAllWorkItemsByTypeQuery,
  getOverdueFeaturesQuery,
  getNearDeadlineFeaturesQuery,
  getPlanningOverdueFeaturesQuery,
  getFeaturesWithHoursAlertsQuery,
  getFeaturesEstouradosQuery,
} from '../utils/wiql.js';
import { extractClientName } from '../utils/normalization.js';
import { getUserClientFilter } from '../utils/auth.js';
import { formatWorkItemFieldsFlat, filterRawFields } from '../utils/fieldFormatter.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const project = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';

/**
 * Extrai ID do parent a partir das relations do work item
 */
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
 * Extrai Responsável Cliente de Custom.ResponsavelCliente
 */
function extractResponsavelCliente(value) {
  if (!value) return null;
  if (typeof value === 'object' && value !== null) {
    return value.displayName || value.name || value.uniqueName || null;
  }
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

/**
 * Extrai displayName de objeto ou email
 */
function extractDisplayName(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'object' && value !== null) {
    const displayName = value.displayName || value.name || value.uniqueName || '';
    if (displayName && displayName.includes('@')) {
      // Se for email, extrair nome
      const emailParts = displayName.split('@')[0].split('.');
      return emailParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    return displayName;
  }

  if (typeof value === 'string') {
    if (value.includes('@')) {
      const emailParts = value.split('@')[0].split('.');
      return emailParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    return value;
  }

  return String(value);
}

/**
 * Filtra features por cliente baseado no email do usuário
 */
function filterFeaturesByClient(features, userClient) {
  if (!userClient) {
    return features; // Admin vê tudo
  }

  return features.filter(feature => {
    const fields = feature.fields || {};
    const areaPath = fields['System.AreaPath'];
    const iterationPath = fields['System.IterationPath'];

    const featureClient = extractClientName(areaPath, iterationPath);

    return featureClient && featureClient.toLowerCase() === userClient.toLowerCase();
  });
}

/**
 * GET /api/work-items/bugs
 * Lista bugs
 */
router.get('/bugs', async (req, res) => {
  try {
    const { state, assigned_to } = req.query;

    const wiql = new WIQLClient();
    const query = getBugsQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemRefs = wiqlResult.workItems || [];
    if (workItemRefs.length === 0) {
      return res.json({ bugs: [], count: 0 });
    }

    const bugIds = workItemRefs.map(ref => parseInt(ref.id)).filter(id => !isNaN(id));
    const bugsData = await wiql.getWorkItems(bugIds);

    const bugs = [];
    for (const bug of bugsData) {
      const fields = bug.fields || {};
      const bugState = fields['System.State'] || '';

      // Aplicar filtros
      if (state && bugState !== state) {
        continue;
      }

      const assignedToField = fields['System.AssignedTo'];
      const assignedName = extractDisplayName(assignedToField);
      if (assigned_to && assignedName.toLowerCase() !== assigned_to.toLowerCase()) {
        continue;
      }

      // Formatar campos brutos para campos legíveis
      const formattedFields = formatWorkItemFieldsFlat(fields);
      // Filtrar campos brutos removendo campos já formatados
      const filteredRawFields = filterRawFields(fields);

      bugs.push({
        id: bug.id,
        title: fields['System.Title'] || '',
        state: bugState,
        assigned_to: assignedName,
        created_date: fields['System.CreatedDate'] || '',
        changed_date: fields['System.ChangedDate'] || '',
        priority: fields['Microsoft.VSTS.Common.Priority'] || null,
        severity: fields['Microsoft.VSTS.Common.Severity'] || '',
        repro_steps: fields['Microsoft.VSTS.TCM.ReproSteps'] || '',
        url: bug.url || '',
        web_url: bug._links?.html?.href || '',
        fields_formatted: formattedFields,
        raw_fields_json: filteredRawFields,
      });
    }

    res.json({
      bugs: bugs,
      count: bugs.length,
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/bugs:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar bugs',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/bugs/summary
 * Resumo de bugs
 */
router.get('/bugs/summary', async (req, res) => {
  try {
    const wiql = new WIQLClient();
    const query = getBugsQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemRefs = wiqlResult.workItems || [];
    if (workItemRefs.length === 0) {
      return res.json({
        total: 0,
        by_state: {},
        by_priority: {},
        by_severity: {},
      });
    }

    const bugIds = workItemRefs.map(ref => parseInt(ref.id)).filter(id => !isNaN(id));
    const bugsData = await wiql.getWorkItems(bugIds);

    const byState = {};
    const byPriority = {};
    const bySeverity = {};

    for (const bug of bugsData) {
      const fields = bug.fields || {};
      const state = fields['System.State'] || 'Sem Estado';
      const priority = fields['Microsoft.VSTS.Common.Priority'] || 'Não Definida';
      const severity = fields['Microsoft.VSTS.Common.Severity'] || 'Não Definida';

      byState[state] = (byState[state] || 0) + 1;
      byPriority[String(priority)] = (byPriority[String(priority)] || 0) + 1;
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    }

    res.json({
      total: bugsData.length,
      by_state: byState,
      by_priority: byPriority,
      by_severity: bySeverity,
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/bugs/summary:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar resumo de bugs',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/tasks/summary
 * Resumo de tasks (deve vir antes de /tasks/:id)
 */
router.get('/tasks/summary', async (req, res) => {
  try {
    const wiql = new WIQLClient();
    const query = getTasksQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemRefs = wiqlResult.workItems || [];
    if (workItemRefs.length === 0) {
      return res.json({
        total: 0,
        by_state: {},
        overdue_count: 0,
        by_assigned_to: {},
      });
    }

    const taskIds = workItemRefs.map(ref => parseInt(ref.id)).filter(id => !isNaN(id));
    const tasksData = await wiql.getWorkItems(taskIds);

    const OPEN_STATES = ['New', 'Active'];
    const byState = {};
    const byAssignedTo = {};
    let openCount = 0;
    let overdueCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const task of tasksData) {
      const fields = task.fields || {};
      const state = fields['System.State'] || 'Sem Estado';
      const assignedTo = extractDisplayName(fields['System.AssignedTo']);
      const isOpen = OPEN_STATES.includes(state);

      byState[state] = (byState[state] || 0) + 1;
      if (assignedTo) {
        byAssignedTo[assignedTo] = (byAssignedTo[assignedTo] || 0) + 1;
      }

      if (isOpen) {
        openCount++;
        const targetDateStr = fields['Microsoft.VSTS.Scheduling.TargetDate'] || '';
        if (targetDateStr) {
          try {
            const target = new Date(targetDateStr);
            target.setHours(0, 0, 0, 0);
            if (target < today) overdueCount++;
          } catch (e) { /* ignora */ }
        }
      }
    }

    res.json({
      total: openCount,
      by_state: byState,
      overdue_count: overdueCount,
      by_assigned_to: byAssignedTo,
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/tasks/summary:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar resumo de tasks',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/tasks/:id
 * Detalhes de uma task específica
 */
router.get('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'ID da task inválido' });
    }

    const wiql = new WIQLClient();
    const workItems = await wiql.getWorkItems([taskId]);

    if (workItems.length === 0) {
      return res.status(404).json({ error: 'Task não encontrada' });
    }

    const task = workItems[0];
    const fields = task.fields || {};
    const workItemType = (fields['System.WorkItemType'] || '').toLowerCase();

    if (workItemType !== 'task') {
      return res.status(404).json({ error: 'Work item não é uma Task' });
    }

    const assignedTo = extractDisplayName(fields['System.AssignedTo']);
    const parentId = extractParentId(task.relations);

    let client = null;
    let responsible = null;

    if (parentId) {
      const parentsData = await wiql.getWorkItems([parentId]);
      if (parentsData.length > 0) {
        const parentFields = parentsData[0].fields || {};
        const areaPath = parentFields['System.AreaPath'];
        const iterationPath = parentFields['System.IterationPath'];
        const parentType = (parentFields['System.WorkItemType'] || '').toLowerCase();
        client = extractClientName(areaPath, iterationPath);
        responsible = extractResponsavelCliente(parentFields['Custom.ResponsavelCliente']);

        if (!responsible && parentType === 'user story') {
          const featureId = extractParentId(parentsData[0].relations);
          if (featureId) {
            const featuresData = await wiql.getWorkItems([featureId]);
            if (featuresData.length > 0) {
              responsible = extractResponsavelCliente(featuresData[0].fields?.['Custom.ResponsavelCliente']);
            }
          }
        }
      }
    }

    const formattedFields = formatWorkItemFieldsFlat(fields);
    const filteredRawFields = filterRawFields(fields);

    const taskDetail = {
      id: task.id,
      title: fields['System.Title'] || '',
      state: fields['System.State'] || '',
      work_item_type: 'Task',
      assigned_to: assignedTo,
      created_date: fields['System.CreatedDate'] || '',
      changed_date: fields['System.ChangedDate'] || '',
      created_by: extractDisplayName(fields['System.CreatedBy']),
      changed_by: extractDisplayName(fields['System.ChangedBy']),
      area_path: fields['System.AreaPath'] || '',
      iteration_path: fields['System.IterationPath'] || '',
      target_date: fields['Microsoft.VSTS.Scheduling.TargetDate'] || null,
      start_date: fields['Microsoft.VSTS.Scheduling.StartDate'] || null,
      remaining_work: fields['Microsoft.VSTS.Scheduling.RemainingWork'] || null,
      completed_work: fields['Microsoft.VSTS.Scheduling.CompletedWork'] || null,
      original_estimate: fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || null,
      activity: fields['Microsoft.VSTS.Common.Activity'] || '',
      description: fields['System.Description'] || '',
      client,
      responsible,
      fields_formatted: formattedFields,
      raw_fields_json: filteredRawFields,
      web_url: task._links?.html?.href || '',
    };

    res.json(taskDetail);
  } catch (error) {
    console.error('[ERROR] /api/work-items/tasks/:id:', error);
    if (error.message?.includes('429') || error.message?.toLowerCase?.()?.includes('rate limit')) {
      return res.status(429).json({ error: 'Rate limit do Azure DevOps atingido. Tente novamente em alguns segundos.' });
    }
    res.status(500).json({
      error: error.message || 'Erro ao buscar task',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/tasks
 * Lista tasks
 */
router.get('/tasks', async (req, res) => {
  try {
    const { state, assigned_to, overdue_only = false } = req.query;
    const overdueOnly = overdue_only === 'true' || overdue_only === true;

    const wiql = new WIQLClient();
    const query = overdueOnly ? getOverdueTasksQuery(null) : getTasksQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemRefs = wiqlResult.workItems || [];
    if (workItemRefs.length === 0) {
      return res.json({ tasks: [], count: 0 });
    }

    const taskIds = workItemRefs.map(ref => parseInt(ref.id)).filter(id => !isNaN(id));
    const tasksData = await wiql.getWorkItems(taskIds);

    const tasks = [];
    const taskToParentId = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const task of tasksData) {
      const fields = task.fields || {};
      const taskState = fields['System.State'] || '';

      const parentId = extractParentId(task.relations);
      if (parentId) taskToParentId.set(task.id, parentId);

      // Aplicar filtros
      if (state && taskState !== state) {
        continue;
      }

      const assignedToField = fields['System.AssignedTo'];
      const assignedName = extractDisplayName(assignedToField);
      if (assigned_to && assignedName.toLowerCase() !== assigned_to.toLowerCase()) {
        continue;
      }

      const targetDateStr = fields['Microsoft.VSTS.Scheduling.TargetDate'] || '';
      let targetDate = null;
      let daysOverdue = null;

      if (targetDateStr) {
        try {
          const target = new Date(targetDateStr);
          target.setHours(0, 0, 0, 0);
          if (target < today && !['Closed', 'Done', 'Resolved'].includes(taskState)) {
            daysOverdue = Math.floor((today - target) / (1000 * 60 * 60 * 24));
          }
        } catch (e) {
          // Ignora erro
        }
      }

      // Formatar campos brutos para campos legíveis
      const formattedFields = formatWorkItemFieldsFlat(fields);
      // Filtrar campos brutos removendo campos já formatados
      const filteredRawFields = filterRawFields(fields);

      tasks.push({
        id: task.id,
        title: fields['System.Title'] || '',
        state: taskState,
        assigned_to: assignedName,
        created_date: fields['System.CreatedDate'] || '',
        changed_date: fields['System.ChangedDate'] || '',
        target_date: targetDateStr,
        days_overdue: daysOverdue,
        remaining_work: fields['Microsoft.VSTS.Scheduling.RemainingWork'] || null,
        completed_work: fields['Microsoft.VSTS.Scheduling.CompletedWork'] || null,
        original_estimate: fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || null,
        activity: fields['Microsoft.VSTS.Common.Activity'] || '',
        url: task.url || '',
        web_url: task._links?.html?.href || '',
        fields_formatted: formattedFields,
        raw_fields_json: filteredRawFields,
        _parentId: parentId,
      });
    }

    // Enriquecer tasks com client e responsible do Parent (Feature/User Story)
    const uniqueParentIds = [...new Set(taskToParentId.values())];
    const parentDataMap = new Map();
    if (uniqueParentIds.length > 0) {
      const parentsData = await wiql.getWorkItems(uniqueParentIds);
      const featureParentIds = [];
      for (const parent of parentsData) {
        const fields = parent.fields || {};
        const areaPath = fields['System.AreaPath'];
        const iterationPath = fields['System.IterationPath'];
        const workItemType = fields['System.WorkItemType'] || '';
        const client = extractClientName(areaPath, iterationPath);
        let responsible = extractResponsavelCliente(fields['Custom.ResponsavelCliente']);
        if (!responsible && workItemType === 'User Story') {
          const grandParentId = extractParentId(parent.relations);
          if (grandParentId) featureParentIds.push({ parentId: parent.id, featureId: grandParentId });
        }
        parentDataMap.set(parent.id, { client: client || null, responsible: responsible || null });
      }
      if (featureParentIds.length > 0) {
        const featureIds = [...new Set(featureParentIds.map((p) => p.featureId))];
        const featuresData = await wiql.getWorkItems(featureIds);
        const featureToResponsible = new Map();
        for (const f of featuresData) {
          const resp = extractResponsavelCliente(f.fields?.['Custom.ResponsavelCliente']);
          if (resp) featureToResponsible.set(f.id, resp);
        }
        for (const { parentId, featureId } of featureParentIds) {
          const resp = featureToResponsible.get(featureId);
          if (resp) {
            const existing = parentDataMap.get(parentId);
            if (existing) parentDataMap.set(parentId, { ...existing, responsible: resp });
          }
        }
      }
    }

    for (const t of tasks) {
      const pid = t._parentId;
      delete t._parentId;
      if (pid && parentDataMap.has(pid)) {
        const { client, responsible } = parentDataMap.get(pid);
        t.client = client;
        t.responsible = responsible;
      } else {
        t.client = null;
        t.responsible = null;
      }
    }

    // Ordenar tasks atrasadas por dias de atraso (maior primeiro)
    if (overdueOnly) {
      tasks.sort((a, b) => (b.days_overdue || 0) - (a.days_overdue || 0));
    }

    res.json({
      tasks: tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/tasks:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar tasks',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/user-stories
 * Lista user stories
 */
router.get('/user-stories', async (req, res) => {
  try {
    const { state, assigned_to } = req.query;

    const wiql = new WIQLClient();
    const query = getUserStoriesQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemRefs = wiqlResult.workItems || [];
    if (workItemRefs.length === 0) {
      return res.json({ user_stories: [], count: 0 });
    }

    const usIds = workItemRefs.map(ref => parseInt(ref.id)).filter(id => !isNaN(id));
    const usData = await wiql.getWorkItems(usIds);

    const userStories = [];
    for (const us of usData) {
      const fields = us.fields || {};
      const usState = fields['System.State'] || '';

      // Aplicar filtros
      if (state && usState !== state) {
        continue;
      }

      const assignedToField = fields['System.AssignedTo'];
      const assignedName = extractDisplayName(assignedToField);
      if (assigned_to && assignedName.toLowerCase() !== assigned_to.toLowerCase()) {
        continue;
      }

      // Formatar campos brutos para campos legíveis
      const formattedFields = formatWorkItemFieldsFlat(fields);
      // Filtrar campos brutos removendo campos já formatados
      const filteredRawFields = filterRawFields(fields);

      userStories.push({
        id: us.id,
        title: fields['System.Title'] || '',
        state: usState,
        assigned_to: assignedName,
        created_date: fields['System.CreatedDate'] || '',
        changed_date: fields['System.ChangedDate'] || '',
        story_points: fields['Microsoft.VSTS.Scheduling.StoryPoints'] || null,
        priority: fields['Microsoft.VSTS.Common.Priority'] || null,
        effort: fields['Microsoft.VSTS.Scheduling.Effort'] || null,
        url: us.url || '',
        web_url: us._links?.html?.href || '',
        fields_formatted: formattedFields,
        raw_fields_json: filteredRawFields,
      });
    }

    res.json({
      user_stories: userStories,
      count: userStories.length,
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/user-stories:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar user stories',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/by-type
 * Work items por tipo
 */
router.get('/by-type', async (req, res) => {
  try {
    const wiql = new WIQLClient();
    const query = getAllWorkItemsByTypeQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemRefs = wiqlResult.workItems || [];
    if (workItemRefs.length === 0) {
      return res.json({ by_type: {}, total: 0 });
    }

    const wiIds = workItemRefs.map(ref => parseInt(ref.id)).filter(id => !isNaN(id));
    const wisData = await wiql.getWorkItems(wiIds);

    const byType = {};
    for (const wi of wisData) {
      const fields = wi.fields || {};
      const wiType = fields['System.WorkItemType'] || 'Unknown';
      byType[wiType] = (byType[wiType] || 0) + 1;
    }

    res.json({
      by_type: byType,
      total: wisData.length,
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/by-type:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar work items por tipo',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/features/overdue
 * Features atrasadas
 */
router.get('/features/overdue', async (req, res) => {
  try {
    const { token } = req.query;

    const wiql = new WIQLClient();
    const query = getOverdueFeaturesQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemRefs = wiqlResult.workItems || [];
    if (workItemRefs.length === 0) {
      return res.json({ features: [], count: 0 });
    }

    const featureIds = workItemRefs.map(ref => parseInt(ref.id)).filter(id => !isNaN(id));
    const featuresData = await wiql.getWorkItems(featureIds);

    // Aplicar filtro de cliente
    const userClient = getUserClientFilter(token);
    const filteredFeatures = userClient ? filterFeaturesByClient(featuresData, userClient) : featuresData;

    const features = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const feature of filteredFeatures) {
      const fields = feature.fields || {};
      const targetDateStr = fields['Microsoft.VSTS.Scheduling.TargetDate'] || '';
      let targetDate = null;
      let daysOverdue = null;

      if (targetDateStr) {
        try {
          targetDate = new Date(targetDateStr);
          targetDate.setHours(0, 0, 0, 0);
          if (targetDate < today) {
            daysOverdue = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));
          }
        } catch (e) {
          // Ignora erro
        }
      }

      const assignedToField = fields['System.AssignedTo'];
      const assignedName = extractDisplayName(assignedToField);

      // Formatar campos brutos para campos legíveis
      const formattedFields = formatWorkItemFieldsFlat(fields);
      // Filtrar campos brutos removendo campos já formatados
      const filteredRawFields = filterRawFields(fields);

      features.push({
        id: feature.id,
        title: fields['System.Title'] || '',
        state: fields['System.State'] || '',
        assigned_to: assignedName,
        work_item_type: fields['System.WorkItemType'] || 'Feature',
        parent: fields['System.Parent'] || null,
        board_column: fields['System.BoardColumn'] || '',
        tags: fields['System.Tags'] ? fields['System.Tags'].split(';').filter(t => t.trim()) : [],
        iteration_level2: fields['System.IterationLevel2'] || '',
        numero_proposta: fields['Custom.NumeroProposta'] || '',
        target_date: targetDateStr,
        days_overdue: daysOverdue,
        created_date: fields['System.CreatedDate'] || '',
        changed_date: fields['System.ChangedDate'] || '',
        url: feature.url || '',
        web_url: feature._links?.html?.href || '',
        fields_formatted: formattedFields,
        raw_fields_json: filteredRawFields,
      });
    }

    // Ordenar por dias de atraso (maior primeiro)
    features.sort((a, b) => (b.days_overdue || 0) - (a.days_overdue || 0));

    res.json({
      features: features,
      count: features.length,
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/features/overdue:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar features atrasadas',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/features/near-deadline
 * Features próximas do prazo
 */
router.get('/features/near-deadline', async (req, res) => {
  try {
    const { days = 10, token } = req.query;
    const daysNum = parseInt(days) || 10;

    const wiql = new WIQLClient();
    const query = getNearDeadlineFeaturesQuery(null, daysNum);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemRefs = wiqlResult.workItems || [];
    if (workItemRefs.length === 0) {
      return res.json({ features: [], count: 0 });
    }

    const featureIds = workItemRefs.map(ref => parseInt(ref.id)).filter(id => !isNaN(id));
    const featuresData = await wiql.getWorkItems(featureIds);

    // Aplicar filtro de cliente
    const userClient = getUserClientFilter(token);
    const filteredFeatures = userClient ? filterFeaturesByClient(featuresData, userClient) : featuresData;

    const features = [];
    for (const feature of filteredFeatures) {
      const fields = feature.fields || {};
      const assignedToField = fields['System.AssignedTo'];
      const assignedName = extractDisplayName(assignedToField);

      // Formatar campos brutos para campos legíveis
      const formattedFields = formatWorkItemFieldsFlat(fields);
      // Filtrar campos brutos removendo campos já formatados
      const filteredRawFields = filterRawFields(fields);

      features.push({
        id: feature.id,
        title: fields['System.Title'] || '',
        state: fields['System.State'] || '',
        assigned_to: assignedName,
        work_item_type: fields['System.WorkItemType'] || 'Feature',
        target_date: fields['Microsoft.VSTS.Scheduling.TargetDate'] || '',
        board_column: fields['System.BoardColumn'] || '',
        iteration_level2: fields['System.IterationLevel2'] || '',
        parent: fields['System.Parent'] || null,
        numero_proposta: fields['Custom.NumeroProposta'] || '',
        created_date: fields['System.CreatedDate'] || '',
        changed_date: fields['System.ChangedDate'] || '',
        url: feature.url || '',
        web_url: feature._links?.html?.href || '',
        fields_formatted: formattedFields,
        raw_fields_json: filteredRawFields,
      });
    }

    res.json({
      features: features,
      count: features.length,
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/features/near-deadline:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar features próximas do prazo',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/features/planning-overdue
 * Features em planejamento atrasadas
 */
router.get('/features/planning-overdue', async (req, res) => {
  try {
    const { token } = req.query;

    const wiql = new WIQLClient();
    const query = getPlanningOverdueFeaturesQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemRefs = wiqlResult.workItems || [];
    if (workItemRefs.length === 0) {
      return res.json({ features: [], count: 0 });
    }

    const featureIds = workItemRefs.map(ref => parseInt(ref.id)).filter(id => !isNaN(id));
    const featuresData = await wiql.getWorkItems(featureIds);

    // Aplicar filtro de cliente
    const userClient = getUserClientFilter(token);
    const filteredFeatures = userClient ? filterFeaturesByClient(featuresData, userClient) : featuresData;

    const features = [];
    for (const feature of filteredFeatures) {
      const fields = feature.fields || {};
      const assignedToField = fields['System.AssignedTo'];
      const assignedName = extractDisplayName(assignedToField);

      // Formatar campos brutos para campos legíveis
      const formattedFields = formatWorkItemFieldsFlat(fields);
      // Filtrar campos brutos removendo campos já formatados
      const filteredRawFields = filterRawFields(fields);

      features.push({
        id: feature.id,
        title: fields['System.Title'] || '',
        state: fields['System.State'] || '',
        assigned_to: assignedName,
        work_item_type: fields['System.WorkItemType'] || 'Feature',
        tags: fields['System.Tags'] ? fields['System.Tags'].split(';').filter(t => t.trim()) : [],
        url: feature.url || '',
        web_url: feature._links?.html?.href || '',
        fields_formatted: formattedFields,
        raw_fields_json: filteredRawFields,
      });
    }

    res.json({
      features: features,
      count: features.length,
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/features/planning-overdue:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar features em planejamento atrasadas',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/features/hours-alerts
 * Features com alertas de horas
 */
router.get('/features/hours-alerts', async (req, res) => {
  try {
    const { token } = req.query;

    const wiql = new WIQLClient();
    const query = getFeaturesWithHoursAlertsQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemRefs = wiqlResult.workItems || [];
    if (workItemRefs.length === 0) {
      return res.json({ features: [], count: 0 });
    }

    const featureIds = workItemRefs.map(ref => parseInt(ref.id)).filter(id => !isNaN(id));
    const featuresData = await wiql.getWorkItems(featureIds);

    // Aplicar filtro de cliente
    const userClient = getUserClientFilter(token);
    const filteredFeatures = userClient ? filterFeaturesByClient(featuresData, userClient) : featuresData;

    // Filtrar apenas features com StatusHoras = 'Com Alerta'
    const features = [];
    for (const feature of filteredFeatures) {
      const fields = feature.fields || {};
      const statusHoras = fields['Custom.StatusHoras'] || '';

      if (statusHoras === 'Com Alerta') {
        // Formatar campos brutos para campos legíveis
        const formattedFields = formatWorkItemFieldsFlat(fields);
        // Filtrar campos brutos removendo campos já formatados
        const filteredRawFields = filterRawFields(fields);

        features.push({
          id: feature.id,
          title: fields['System.Title'] || '',
          state: fields['System.State'] || '',
          status_horas: statusHoras,
          saldo_horas: fields['Custom.SaldoHoras'] || null,
          horas_consumidas_real: fields['Custom.HorasConsumidasReal'] || null,
          horas_projeto: fields['Custom.HorasProjeto'] || null,
          fields_formatted: formattedFields,
          raw_fields_json: filteredRawFields,
        });
      }
    }

    res.json({
      features: features,
      count: features.length,
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/features/hours-alerts:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar features com alertas de horas',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/features/estourados
 * Features estouradas
 */
router.get('/features/estourados', async (req, res) => {
  try {
    const { token } = req.query;

    const wiql = new WIQLClient();
    const query = getFeaturesEstouradosQuery(null);
    const wiqlResult = await wiql.executeWiql(project, query);

    const workItemRefs = wiqlResult.workItems || [];
    if (workItemRefs.length === 0) {
      return res.json({ features: [], count: 0 });
    }

    const featureIds = workItemRefs.map(ref => parseInt(ref.id)).filter(id => !isNaN(id));
    const featuresData = await wiql.getWorkItems(featureIds);

    // Aplicar filtro de cliente
    const userClient = getUserClientFilter(token);
    const filteredFeatures = userClient ? filterFeaturesByClient(featuresData, userClient) : featuresData;

    const features = [];
    for (const feature of filteredFeatures) {
      const fields = feature.fields || {};
      // Formatar campos brutos para campos legíveis
      const formattedFields = formatWorkItemFieldsFlat(fields);
      // Filtrar campos brutos removendo campos já formatados
      const filteredRawFields = filterRawFields(fields);

      features.push({
        id: feature.id,
        title: fields['System.Title'] || '',
        state: fields['System.State'] || '',
        status_horas: fields['Custom.StatusHoras'] || '',
        saldo_horas: fields['Custom.SaldoHoras'] || null,
        horas_consumidas_real: fields['Custom.HorasConsumidasReal'] || null,
        horas_projeto: fields['Custom.HorasProjeto'] || null,
        motivo_estouro_projeto: fields['Custom.MotivoEstouroProjeto'] || '',
        board_column: fields['System.BoardColumn'] || '',
        fields_formatted: formattedFields,
        raw_fields_json: filteredRawFields,
      });
    }

    res.json({
      features: features,
      count: features.length,
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/features/estourados:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar features estouradas',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * GET /api/work-items/burndown
 * Dados de burndown (placeholder - requer banco de dados)
 */
router.get('/burndown', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days) || 30;

    // Por enquanto, retorna mensagem informando que burndown requer banco de dados
    res.status(501).json({
      error: 'Burndown ainda não implementado no backend Node.js',
      message: 'Este endpoint requer banco de dados para cálculos históricos',
      suggestion: 'Use o endpoint /api/azdo/consolidated para obter dados agregados do Azure DevOps'
    });
  } catch (error) {
    console.error('[ERROR] /api/work-items/burndown:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar dados de burndown',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

export default router;
