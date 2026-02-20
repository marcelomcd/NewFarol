/**
 * Rotas para Azure DevOps consolidado
 * Mantém o padrão: WIQL -> IDs -> Hidratação
 * Convertido do Python para Node.js
 */
import express from 'express';
import { WIQLClient } from '../utils/wiqlClient.js';
import { extractClientName, normalizeFarolStatus } from '../utils/normalization.js';
import { getUserClientFilter, hasValidClientAccess } from '../utils/auth.js';
import cache from '../utils/ttlCache.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const project = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';

/**
 * Normaliza nome de cliente para dedupe (case/acentos/pontuação)
 */
function normalizeClientKey(value) {
  if (!value) {
    return '';
  }
  let s = String(value).trim();
  if (!s) {
    return '';
  }
  
  // Remover acentos (simplificado - em produção usar biblioteca)
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.toLowerCase();
  
  // Manter apenas alfanuméricos
  s = s.replace(/[^a-z0-9]/g, '');
  
  // Aliases conhecidos
  if (s === 'qualiit' || s === 'qualiitinnovacaoetecnologia' || s === 'qualit') {
    return 'qualiit';
  }
  return s;
}

/**
 * Nome canônico do cliente
 */
function canonicalClientName(value) {
  if (!value) {
    return null;
  }
  const s = String(value).trim();
  if (!s) {
    return null;
  }
  const key = normalizeClientKey(s);
  if (key === 'qualiit') {
    return 'Quali IT';
  }
  if (key === 'aurora') {
    return 'Aurora';
  }
  
  // Title Case
  const words = s.replace(/-/g, ' ').split(/\s+/).filter(w => w.trim());
  if (words.length === 0) {
    return null;
  }
  const titled = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return titled;
}

/**
 * Extrai displayName de System.AssignedTo sem usar email
 */
function safeDisplayName(assignedTo) {
  if (!assignedTo) {
    return null;
  }
  if (typeof assignedTo === 'object' && assignedTo !== null) {
    const name = assignedTo.displayName || '';
    const nameStr = String(name).trim();
    return nameStr || null;
  }
  const s = String(assignedTo).trim();
  if (s.includes('@')) {
    return null; // Não usar email
  }
  return s || null;
}

/**
 * Parseia ISO 8601 e devolve apenas date
 */
function parseIsoDate(value) {
  if (!value) {
    return null;
  }
  try {
    let s = String(value).trim();
    s = s.replace('Z', '+00:00');
    const dt = new Date(s);
    if (isNaN(dt.getTime())) {
      return null;
    }
    // Retornar apenas a data (sem hora)
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  } catch (e) {
    return null;
  }
}

/**
 * Constrói queries WIQL
 */
function buildWiqlTotalFeatures(projectName) {
  return `
SELECT
    [System.Id]
FROM workitems
WHERE
    [System.TeamProject] = '${projectName}'
    AND [System.WorkItemType] = 'Feature'
`.trim();
}

function buildWiqlOpenFeatures(projectName) {
  return `
SELECT
    [System.Id]
FROM workitems
WHERE
    [System.TeamProject] = '${projectName}'
    AND [System.WorkItemType] = 'Feature'
    AND [System.State] <> 'Closed'
`.trim();
}

function buildWiqlOverdueFeatures(projectName) {
  return `
SELECT
    [System.Id]
FROM workitems
WHERE
    [System.TeamProject] = '${projectName}'
    AND [System.WorkItemType] = 'Feature'
    AND [System.State] <> 'Closed'
    AND [Microsoft.VSTS.Scheduling.TargetDate] < @Today
`.trim();
}

function buildWiqlNearDeadlineCandidates(projectName) {
  return `
SELECT
    [System.Id]
FROM workitems
WHERE
    [System.TeamProject] = '${projectName}'
    AND [System.WorkItemType] = 'Feature'
    AND [System.State] <> 'Closed'
    AND [Microsoft.VSTS.Scheduling.TargetDate] >= @Today
`.trim();
}

function buildWiqlClosedFeatures(projectName) {
  return `
SELECT
    [System.Id]
FROM workitems
WHERE
    [System.TeamProject] = '${projectName}'
    AND [System.WorkItemType] = 'Feature'
    AND [System.State] = 'Closed'
`.trim();
}

function buildWiqlEpics(projectName) {
  return `
SELECT
    [System.Id],
    [System.Title]
FROM workitems
WHERE
    [System.TeamProject] = '${projectName}'
    AND [System.WorkItemType] = 'Epic'
`.trim();
}

function buildWiqlFeaturesByStatus(projectName, status) {
  return `
SELECT
    [System.Id]
FROM workitems
WHERE
    [System.TeamProject] = '${projectName}'
    AND [System.WorkItemType] = 'Feature'
    AND [System.State] = '${status}'
`.trim();
}

/**
 * GET /api/azdo/consolidated
 * Endpoint consolidado com todos os indicadores do Azure DevOps
 */
/**
 * Resposta vazia para usuários com domínio desconhecido (ex: @hotmail.com).
 * Mantém os cards exibindo zeros conforme requisito.
 */
function buildEmptyConsolidatedResponse(daysNearDeadline) {
  const emptyList = [];
  const emptyStatusDetails = {};
  return {
    meta: {
      org: process.env.AZDO_ORG || 'qualiit',
      project,
      api_version: process.env.AZDO_API_VERSION || '7.0',
      generated_at: new Date().toISOString(),
      near_deadline_days: daysNearDeadline,
      client_filter: null,
    },
    cache: { hit: false, ttlSeconds: 0 },
    totals: {
      total_projects: 0,
      open_projects: 0,
      overdue_projects: 0,
      near_deadline_projects: 0,
      closed_projects: 0,
    },
    lists: {
      total_projects: emptyList,
      open_projects: emptyList,
      overdue_projects: emptyList,
      near_deadline_projects: emptyList,
      closed_projects: emptyList,
    },
    clients: {
      epics: emptyList,
      count: 0,
      summary: [],
      unique_count: 0,
    },
    pmos: { items: emptyList, count: 0 },
    features_by_status: emptyStatusDetails,
  };
}

router.get('/consolidated', async (req, res) => {
  try {
    const { token, days_near_deadline = 7, cache_seconds = 10 } = req.query;
    const daysNearDeadline = parseInt(days_near_deadline) || 7;
    const cacheSeconds = parseInt(cache_seconds) || 10;

    // Domínios desconhecidos (ex: @hotmail.com) veem zeros
    if (!hasValidClientAccess(token)) {
      return res.json(buildEmptyConsolidatedResponse(daysNearDeadline));
    }

    // Filtro por cliente (regra do sistema)
    const userClient = getUserClientFilter(token);

    const cacheKey = `azdo_consolidated:v1:project=${project}:user_client=${userClient || 'all'}:days=${daysNearDeadline}`;
    
    if (cacheSeconds > 0) {
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return res.json({ ...cached, cache: { hit: true, ttlSeconds: cacheSeconds } });
      }
    }

    const wiql = new WIQLClient();

    // Campos obrigatórios para Dashboard/Power BI
    const featureFields = [
      'System.Id',
      'System.Title',
      'System.State',
      'System.WorkItemType',
      'Microsoft.VSTS.Scheduling.TargetDate',
      'System.AssignedTo',
      'Custom.ResponsavelCliente',
      'Custom.StatusProjeto',
      'System.ChangedDate',
      'System.CreatedDate',
      'System.BoardColumn',
      'System.AreaPath',
      'System.IterationPath',
    ];
    const epicFields = ['System.Id', 'System.Title', 'System.WorkItemType', 'System.State'];

    async function idsFor(query) {
      const res = await wiql.executeWiql(project, query);
      const refs = res.workItems || [];
      return refs.map(r => parseInt(r.id)).filter(id => !isNaN(id));
    }

    async function itemsFor(ids, fields) {
      if (!ids || ids.length === 0) {
        return [];
      }
      return await wiql.getWorkItems(ids, fields);
    }

    // WIQL IDs (em paralelo)
    const [
      idsTotal,
      idsOpen,
      idsOverdue,
      idsNearCandidates,
      idsClosed,
      epicIds,
    ] = await Promise.all([
      idsFor(buildWiqlTotalFeatures(project)),
      idsFor(buildWiqlOpenFeatures(project)),
      idsFor(buildWiqlOverdueFeatures(project)),
      idsFor(buildWiqlNearDeadlineCandidates(project)),
      idsFor(buildWiqlClosedFeatures(project)),
      idsFor(buildWiqlEpics(project)),
    ]);

    // Status específicos
    const statuses = [
      'New',
      'Em Planejamento',
      'Em Andamento',
      'Projeto em Fase Critica',
      'Homologação Interna',
      'Em Homologação',
      'Em Fase de Encerramento',
      'Em Garantia',
      'Pausado pelo Cliente',
    ];

    const statusIdPairs = await Promise.all(
      statuses.map(status => idsFor(buildWiqlFeaturesByStatus(project, status)))
    );
    const statusIds = {};
    statuses.forEach((status, idx) => {
      statusIds[status] = statusIdPairs[idx];
    });

    // Buscar detalhes (hidratação) em paralelo
    const [
      totalItems,
      openItems,
      overdueItems,
      nearItemsCandidates,
      closedItems,
      epicItems,
    ] = await Promise.all([
      itemsFor(idsTotal, featureFields),
      itemsFor(idsOpen, featureFields),
      itemsFor(idsOverdue, featureFields),
      itemsFor(idsNearCandidates, featureFields),
      itemsFor(idsClosed, featureFields),
      itemsFor(epicIds, epicFields),
    ]);

    // Próximos do prazo: aplicar corte em dias usando TargetDate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDay = new Date(today);
    maxDay.setDate(maxDay.getDate() + daysNearDeadline);

    const nearDeadlineItems = [];
    for (const wi of nearItemsCandidates) {
      const fields = wi.fields || {};
      const td = parseIsoDate(fields['Microsoft.VSTS.Scheduling.TargetDate']);
      if (!td) {
        continue;
      }
      const targetDate = new Date(td);
      targetDate.setHours(0, 0, 0, 0);
      if (targetDate >= today && targetDate <= maxDay) {
        nearDeadlineItems.push(wi);
      }
    }

    // PMOs: distinct displayName de AssignedTo em Features (total)
    const pmosSet = new Set();
    for (const wi of totalItems) {
      const fields = wi.fields || {};
      const name = safeDisplayName(fields['System.AssignedTo']);
      if (name) {
        pmosSet.add(name);
      }
    }
    const pmos = Array.from(pmosSet).sort();

    function toFeatureRow(wi) {
      const f = wi.fields || {};
      const areaPath = f['System.AreaPath'];
      const iterationPath = f['System.IterationPath'];
      let client = extractClientName(areaPath, iterationPath);
      client = canonicalClientName(client) || client;

      return {
        id: wi.id || f['System.Id'],
        title: f['System.Title'],
        state: f['System.State'],
        work_item_type: f['System.WorkItemType'],
        target_date: f['Microsoft.VSTS.Scheduling.TargetDate'],
        created_date: f['System.CreatedDate'],
        changed_date: f['System.ChangedDate'],
        pmo: safeDisplayName(f['System.AssignedTo']),
        responsible: f['Custom.ResponsavelCliente'],
        responsavel_cliente: f['Custom.ResponsavelCliente'],
        farol_status: normalizeFarolStatus(f['Custom.StatusProjeto']),
        board_column: f['System.BoardColumn'],
        client: client,
        area_path: areaPath,
        iteration_path: iterationPath,
      };
    }

    function toEpicRow(wi) {
      const f = wi.fields || {};
      const title = f['System.Title'];
      return {
        id: wi.id || f['System.Id'],
        title: title,
        client: canonicalClientName(title),
        work_item_type: f['System.WorkItemType'],
      };
    }

    // Status: lista + contador (hidratação em paralelo)
    const statusItemsArrays = await Promise.all(
      statuses.map(status => itemsFor(statusIds[status] || [], featureFields))
    );
    const statusDetails = {};
    statuses.forEach((status, idx) => {
      const items = statusItemsArrays[idx];
      statusDetails[status] = {
        count: (statusIds[status] || []).length,
        items: items.map(toFeatureRow),
      };
    });

    // Filtrar por cliente se necessário
    function filterByClient(items) {
      if (!userClient) {
        return items; // Admin vê tudo
      }
      return items.filter(item => {
        const itemClient = item.client;
        return itemClient && itemClient.toLowerCase() === userClient.toLowerCase();
      });
    }

    const result = {
      meta: {
        org: process.env.AZDO_ORG || 'qualiit',
        project: project,
        api_version: process.env.AZDO_API_VERSION || '7.0',
        generated_at: new Date().toISOString(),
        near_deadline_days: daysNearDeadline,
        client_filter: userClient || null,
      },
      cache: { hit: false, ttlSeconds: cacheSeconds },
      totals: {
        total_projects: idsTotal.length,
        open_projects: idsOpen.length,
        overdue_projects: idsOverdue.length,
        near_deadline_projects: nearDeadlineItems.length,
        closed_projects: idsClosed.length,
      },
      lists: {
        total_projects: filterByClient(totalItems.map(toFeatureRow)),
        open_projects: filterByClient(openItems.map(toFeatureRow)),
        overdue_projects: filterByClient(overdueItems.map(toFeatureRow)),
        near_deadline_projects: filterByClient(nearDeadlineItems.map(toFeatureRow)),
        closed_projects: filterByClient(closedItems.map(toFeatureRow)),
      },
      clients: {
        epics: epicItems.map(toEpicRow),
        count: epicItems.length,
      },
      pmos: {
        items: pmos,
        count: pmos.length,
      },
      features_by_status: statusDetails,
    };

    // Clients summary
    const allFeaturesRows = filterByClient(totalItems.map(toFeatureRow));
    const openFeaturesRows = filterByClient(openItems.map(toFeatureRow));

    const byClientTotal = {};
    const byClientOpen = {};

    for (const row of allFeaturesRows) {
      const ck = normalizeClientKey(row.client);
      if (!ck) {
        continue;
      }
      byClientTotal[ck] = (byClientTotal[ck] || 0) + 1;
    }

    for (const row of openFeaturesRows) {
      const ck = normalizeClientKey(row.client);
      if (!ck) {
        continue;
      }
      byClientOpen[ck] = (byClientOpen[ck] || 0) + 1;
    }

    const epicClients = {};
    for (const e of result.clients.epics) {
      const name = e.client || e.title;
      const key = normalizeClientKey(name);
      if (key && !epicClients[key]) {
        epicClients[key] = canonicalClientName(name) || String(name).trim();
      }
    }

    const summary = [];
    for (const [key, name] of Object.entries(epicClients).sort((a, b) => a[1].toLowerCase().localeCompare(b[1].toLowerCase()))) {
      const total = byClientTotal[key] || 0;
      const open = byClientOpen[key] || 0;
      const closed = Math.max(total - open, 0);
      summary.push({
        key: key,
        name: name,
        active: open,
        total: total,
        closed: closed,
      });
    }

    result.clients.summary = summary;
    result.clients.unique_count = summary.length;

    if (cacheSeconds > 0) {
      cache.set(cacheKey, result, cacheSeconds);
    }

    res.json(result);
  } catch (error) {
    console.error('[ERROR] /api/azdo/consolidated:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar dados consolidados',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

/**
 * Formata Task do Azure para estrutura compatível com DrillDownModal (Feature-like)
 */
function formatTaskForModal(wi) {
  const fields = wi.fields || {};
  const webUrl = wi._links?.html?.href || '';
  return {
    id: wi.id,
    title: fields['System.Title'] || '',
    state: fields['System.State'] || '',
    changed_date: fields['System.ChangedDate'] || '',
    created_date: fields['System.CreatedDate'] || '',
    assigned_to: fields['System.AssignedTo']?.displayName || fields['System.AssignedTo'] || '',
    raw_fields_json: {
      work_item_type: 'Task',
      web_url: webUrl,
    },
  };
}

/**
 * GET /api/azdo/counts-by-month
 * Retorna contagens de tasks abertas/fechadas no mês (projetos calculados no frontend).
 * Query param include_items=true retorna tasks_opened_items e tasks_closed_items para drill-down.
 */
router.get('/counts-by-month', async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    const includeItems = req.query.include_items === 'true' || req.query.include_items === true;

    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({
        error: 'Parâmetros month (1-12) e year obrigatórios',
      });
    }

    // Formato yyyy-MM-dd evita problemas de timezone. Usar < primeiro dia do mês seguinte.
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endExclusiveStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const areaPath = `${project}\\Quali IT ! Gestao de Projetos`;
    const wiql = new WIQLClient();

    // Tasks criadas no mês (scope: mesma área das Features)
    const tasksCreatedQuery = `
SELECT [System.Id]
FROM workitems
WHERE
  [System.TeamProject] = '${project}'
  AND [System.WorkItemType] = 'Task'
  AND [System.AreaPath] UNDER '${areaPath.replace(/'/g, "''")}'
  AND [System.CreatedDate] >= '${startStr}'
  AND [System.CreatedDate] < '${endExclusiveStr}'
`.trim();

    // Tasks fechadas no mês (Closed, Done, Resolved - conforme processo Agile/Scrum/CMMI)
    const tasksClosedQuery = `
SELECT [System.Id]
FROM workitems
WHERE
  [System.TeamProject] = '${project}'
  AND [System.WorkItemType] = 'Task'
  AND [System.AreaPath] UNDER '${areaPath.replace(/'/g, "''")}'
  AND [System.State] IN ('Closed', 'Done', 'Resolved')
  AND [System.ChangedDate] >= '${startStr}'
  AND [System.ChangedDate] < '${endExclusiveStr}'
`.trim();

    let tasks_opened = 0;
    let tasks_closed = 0;
    let tasks_opened_items = [];
    let tasks_closed_items = [];
    let createdRefs = [];
    let closedRefs = [];

    const runQueries = async (createdQuery, closedQuery) => {
      const [createdResult, closedResult] = await Promise.all([
        wiql.executeWiql(project, createdQuery),
        wiql.executeWiql(project, closedQuery),
      ]);
      createdRefs = createdResult.workItems || [];
      closedRefs = closedResult.workItems || [];
      tasks_opened = createdRefs.length;
      tasks_closed = closedRefs.length;
    };

    try {
      await runQueries(tasksCreatedQuery, tasksClosedQuery);
    } catch (wiqlErr) {
      console.warn('[azdo/counts-by-month] WIQL com AreaPath falhou, tentando sem:', wiqlErr.message);
      const tasksCreatedFallback = `
SELECT [System.Id]
FROM workitems
WHERE
  [System.TeamProject] = '${project}'
  AND [System.WorkItemType] = 'Task'
  AND [System.CreatedDate] >= '${startStr}'
  AND [System.CreatedDate] < '${endExclusiveStr}'
`.trim();
      const tasksClosedFallback = `
SELECT [System.Id]
FROM workitems
WHERE
  [System.TeamProject] = '${project}'
  AND [System.WorkItemType] = 'Task'
  AND [System.State] IN ('Closed', 'Done', 'Resolved')
  AND [System.ChangedDate] >= '${startStr}'
  AND [System.ChangedDate] < '${endExclusiveStr}'
`.trim();
      await runQueries(tasksCreatedFallback, tasksClosedFallback);
    }

    if (includeItems && (createdRefs.length > 0 || closedRefs.length > 0)) {
      const createdIds = createdRefs.map((r) => parseInt(r.id)).filter((id) => !isNaN(id));
      const closedIds = closedRefs.map((r) => parseInt(r.id)).filter((id) => !isNaN(id));
      const allIds = [...new Set([...createdIds, ...closedIds])];

      if (allIds.length > 0) {
        const taskFields = [
          'System.Id', 'System.Title', 'System.State', 'System.CreatedDate', 'System.ChangedDate',
          'System.AssignedTo',
        ];
        const allItems = await wiql.getWorkItems(allIds, taskFields);
        const itemsById = new Map(allItems.map((wi) => [wi.id, wi]));
        const createdSet = new Set(createdIds);
        const closedSet = new Set(closedIds);

        for (const id of createdIds) {
          const wi = itemsById.get(id);
          if (wi) tasks_opened_items.push(formatTaskForModal(wi));
        }
        for (const id of closedIds) {
          const wi = itemsById.get(id);
          if (wi) tasks_closed_items.push(formatTaskForModal(wi));
        }
      }
    }

    const payload = { month, year, tasks_opened, tasks_closed };
    if (includeItems) {
      payload.tasks_opened_items = tasks_opened_items;
      payload.tasks_closed_items = tasks_closed_items;
    }

    res.json(payload);
  } catch (error) {
    console.error('[ERROR] /api/azdo/counts-by-month:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar contagens por mês',
      ...(process.env.DEBUG === 'true' && { stack: error.stack }),
    });
  }
});

export default router;
