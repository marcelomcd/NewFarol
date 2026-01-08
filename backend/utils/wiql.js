/**
 * Queries WIQL para Azure DevOps
 */

/**
 * Gera query WIQL para buscar Features
 * @param {string|null} projectId - ID do projeto (opcional)
 * @param {boolean} includeClosed - Se true, inclui features fechadas também
 * @returns {string} Query WIQL
 */
export function getFeaturesQuery(projectId = null, includeClosed = false) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  let query = `
    SELECT
        [System.Id]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.WorkItemType] = 'Feature'
  `;
  
  if (!includeClosed) {
    query += `        AND [System.State] <> 'Closed'\n`;
  }
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Epics (para validar clientes)
 * @param {string|null} projectId - ID do projeto (opcional)
 * @returns {string} Query WIQL
 */
export function getEpicsQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.Title],
        [System.AreaPath]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.WorkItemType] = 'Epic'
        AND [System.AreaPath] UNDER '${rootProject}\\Quali IT ! Gestao de Projetos'
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Features com filtros avançados
 */
export function getFeaturesQueryWithFilters(filters = {}) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  let query = `
    SELECT
        [System.Id]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.WorkItemType] = 'Feature'
  `;
  
  if (filters.state && filters.state !== 'All') {
    if (filters.state === 'Closed') {
      query += `        AND [System.State] = 'Closed'\n`;
    } else {
      query += `        AND [System.State] <> 'Closed'\n`;
    }
  } else if (!filters.includeClosed) {
    query += `        AND [System.State] <> 'Closed'\n`;
  }
  
  if (filters.areaPath) {
    query += `        AND [System.AreaPath] UNDER '${filters.areaPath.replace(/'/g, "''")}'\n`;
  }
  
  if (filters.assignedTo) {
    query += `        AND [System.AssignedTo] = '${filters.assignedTo.replace(/'/g, "''")}'\n`;
  }
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Features atrasadas
 */
export function getOverdueFeaturesQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.WorkItemType],
        [System.Parent],
        [System.Title],
        [System.AssignedTo],
        [System.BoardColumn],
        [System.State],
        [System.Tags],
        [System.IterationLevel2],
        [Custom.NumeroProposta],
        [Microsoft.VSTS.Scheduling.TargetDate]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.AreaPath] UNDER '${rootProject}\\Quali IT ! Gestao de Projetos'
        AND [Microsoft.VSTS.Scheduling.TargetDate] <= @startOfDay
        AND [System.WorkItemType] = 'Feature'
        AND [System.State] <> 'Closed'
        AND [System.BoardColumn] <> 'Em Garantia'
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Features próximas do prazo
 */
export function getNearDeadlineFeaturesQuery(projectId = null, days = 10) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.WorkItemType],
        [System.Title],
        [System.AssignedTo],
        [Microsoft.VSTS.Scheduling.TargetDate],
        [System.BoardColumn],
        [System.State],
        [System.IterationLevel2],
        [System.Parent],
        [Custom.NumeroProposta]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.AreaPath] UNDER '${rootProject}\\Quali IT ! Gestao de Projetos'
        AND [Microsoft.VSTS.Scheduling.TargetDate] >= @startOfDay
        AND [Microsoft.VSTS.Scheduling.TargetDate] <= @startOfDay('${days}d')
        AND [System.WorkItemType] = 'Feature'
        AND [System.State] <> 'Closed'
        AND [System.BoardColumn] <> 'Em Garantia'
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Features fechadas
 */
export function getClosedFeaturesQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.Title],
        [System.State],
        [System.ChangedDate]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.WorkItemType] = 'Feature'
        AND [System.AreaPath] UNDER '${rootProject}\\Quali IT ! Gestao de Projetos'
        AND [System.State] = 'Closed'
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Features agrupadas por estado
 */
export function getFeaturesByStateQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.Title],
        [System.State]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.WorkItemType] = 'Feature'
        AND [System.AreaPath] UNDER '${rootProject}\\Quali IT ! Gestao de Projetos'
        AND [System.State] <> 'Closed'
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Features com StatusProjeto (Farol)
 */
export function getFeaturesByFarolQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.Title],
        [System.State],
        [Custom.StatusProjeto]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.WorkItemType] = 'Feature'
        AND [System.AreaPath] UNDER '${rootProject}\\Quali IT ! Gestao de Projetos'
        AND [System.State] <> 'Closed'
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Bugs
 */
export function getBugsQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.WorkItemType],
        [System.Title],
        [System.AssignedTo],
        [System.State],
        [System.Tags]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.WorkItemType] = 'Bug'
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Tasks
 */
export function getTasksQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.State],
        [System.AssignedTo],
        [System.CreatedDate],
        [System.ChangedDate]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.WorkItemType] = 'Task'
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Tasks atrasadas
 */
export function getOverdueTasksQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.WorkItemType],
        [System.AssignedTo],
        [System.Title],
        [System.State],
        [Microsoft.VSTS.Scheduling.TargetDate],
        [System.IterationLevel2],
        [System.Parent],
        [System.Tags]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [Microsoft.VSTS.Scheduling.TargetDate] <= @startOfDay
        AND [System.WorkItemType] = 'Task'
        AND [System.State] <> 'Closed'
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar User Stories
 */
export function getUserStoriesQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.State],
        [System.AssignedTo],
        [System.CreatedDate],
        [System.ChangedDate]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.WorkItemType] = 'User Story'
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar todos os Work Items por tipo
 */
export function getAllWorkItemsByTypeQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.WorkItemType],
        [System.State],
        [System.AssignedTo],
        [System.CreatedDate],
        [System.ChangedDate]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.WorkItemType] IN ('Feature', 'Bug', 'Task', 'User Story', 'Epic')
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Features em Planejamento atrasadas
 */
export function getPlanningOverdueFeaturesQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.WorkItemType],
        [System.Title],
        [System.AssignedTo],
        [System.State],
        [System.Tags]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.AreaPath] UNDER '${rootProject}\\Quali IT ! Gestao de Projetos'
        AND [System.BoardColumn] = 'Em Planejamento'
        AND [Microsoft.VSTS.Scheduling.StartDate] <= @startOfDay('-3d')
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Features com alertas de horas
 */
export function getFeaturesWithHoursAlertsQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.WorkItemType],
        [System.Title],
        [System.AssignedTo],
        [System.State],
        [System.Tags],
        [System.Parent],
        [Custom.SaldoHoras],
        [Custom.HorasConsumidasReal],
        [Custom.HorasProjeto],
        [System.BoardColumn],
        [Custom.MotivoEstouroProjeto],
        [Custom.StatusHoras]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.AreaPath] UNDER '${rootProject}\\Quali IT ! Gestao de Projetos'
        AND [System.WorkItemType] = 'Feature'
  `;
  
  return query.trim();
}

/**
 * Gera query WIQL para buscar Features estouradas
 */
export function getFeaturesEstouradosQuery(projectId = null) {
  const rootProject = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
  
  const query = `
    SELECT
        [System.Id],
        [System.WorkItemType],
        [System.Title],
        [System.AssignedTo],
        [System.State],
        [System.Tags],
        [System.Parent],
        [Custom.SaldoHoras],
        [Custom.HorasConsumidasReal],
        [Custom.HorasProjeto],
        [System.BoardColumn],
        [Custom.MotivoEstouroProjeto]
    FROM workitems
    WHERE
        [System.TeamProject] = '${rootProject}'
        AND [System.AreaPath] UNDER '${rootProject}\\Quali IT ! Gestao de Projetos'
        AND [Custom.StatusHoras] = 'Projeto Estourado'
        AND [System.WorkItemType] = 'Feature'
  `;
  
  return query.trim();
}
