/**
 * Utilitário para transformar campos brutos do Azure DevOps em campos formatados
 * Converte valores técnicos (1-Não, 2-Sim, objetos JSON) em valores legíveis
 */

import { formatDatetime, cleanHtml } from './normalization.js';

/**
 * Campos técnicos/internos que não devem ser exibidos ao usuário
 */
const INTERNAL_FIELDS = [
  'System.AreaId',
  'System.IterationId',
  'System.Parent',
  'System.PersonId',
  'System.Rev',
  'System.RevisedDate',
  'System.Watermark',
  'System.Id', // ID é mantido no objeto principal, não precisa nos campos formatados
];

/**
 * Verifica se um campo é técnico/interno
 */
function isInternalField(fieldName) {
  // Campos na lista INTERNAL_FIELDS
  if (INTERNAL_FIELDS.some(internal => fieldName === internal)) {
    return true;
  }
  
  // Campos WEF com System.ExtensionMarker (marcadores técnicos)
  if (fieldName.startsWith('WEF_') && fieldName.includes('System.ExtensionMarker')) {
    return true;
  }
  
  // Campos WEF que são apenas marcadores técnicos
  if (fieldName.startsWith('WEF_') && fieldName.endsWith('_System.ExtensionMarker')) {
    return true;
  }
  
  return false;
}

/**
 * Extrai displayName de objetos de identidade do Azure DevOps
 */
function extractDisplayName(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'object' && value !== null) {
    return value.displayName || null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return null;
}

/**
 * Formata valores de checklist (1-Não, 2-Sim, etc.)
 */
function formatChecklistValue(value) {
  if (!value) {
    return null;
  }

  const str = String(value).trim();

  // Formato: "1-Não", "2-Sim"
  const match = str.match(/^\d+-(.+)$/);
  if (match) {
    return match[1]; // Retorna apenas a parte após o número
  }

  // Se já está formatado (Sem/Não), retorna como está
  return str;
}

/**
 * Formata valores de lista (0-Sem Pendência, 2-Média, etc.)
 */
function formatListValue(value) {
  if (!value) {
    return null;
  }

  const str = String(value).trim();

  // Formato: "0-Sem Pendência", "2-Média"
  const match = str.match(/^\d+-(.+)$/);
  if (match) {
    return match[1]; // Retorna apenas a parte após o número
  }

  // Se já está formatado, retorna como está
  return str;
}

/**
 * Formata campos de identidade (Custom.Developer1, Custom.ResponsavelTecnico, etc.)
 */
function formatIdentityField(value) {
  const displayName = extractDisplayName(value);
  return displayName || 'Não definido';
}

/**
 * Formata campos HTML (Custom.Objetivo, System.Description, etc.)
 */
function formatHtmlField(value) {
  if (!value) {
    return null;
  }

  const cleaned = cleanHtml(String(value));
  return cleaned || null;
}

/**
 * Mapeia nomes de campos brutos para nomes legíveis
 */
const FIELD_NAME_MAP = {
  // Campos Customizados - Checklist (nomes exatos do DevOps)
  'Custom.CheckList_DefinicaoGP': 'Definição de Gerente de Projetos',
  'Custom.CheckList_EmailBoasVindas': 'E-mail Boas Vindas ao Cliente',
  'Custom.CheckList_DefinicaoRecurso': 'Definição de Recurso',
  'Custom.CheckList_RealizarDiscovery': 'Realizar Discovery',
  'Custom.CheckList_DefinicaoCronograma': 'Definição de Cronograma',
  'Custom.CheckList_InsercaoStoryAzureDevOps': 'Inserção de Story no Azure DevOps',
  'Custom.CheckList_InsercaoProjetoAgendaRecurso': 'Inserção do Projeto na Agenda do Recurso',
  'Custom.CheckList_EmailComunicacaoClientKickOff': 'E-mail de Comunicação ao Cliente com a Apresentação de Kick-off (PowerPoint) e Cronograma Anexados, um dia Antes da Reunião',
  'Custom.CheckList_InicioDesenvolvimentoGestaoProjeto': 'Início do Desenvolvimento, Gestão do Projeto e Reuniões Semanais de Status Report',
  'Custom.CheckList_RealizarPlanningPlanejarDaily': 'Realizar Planning, Planejar Daily e Atribuir Todos os Impeditivos, Tasks, etc',
  'Custom.CheckList_RealizarDaily': 'Realizar Daily',
  'Custom.CheckList_FinalizacaoTarefasAzureDevOps': 'Finalização das Tarefas (Controle pelo Azure DevOps)',
  'Custom.CheckList_DocumentoTecnico': 'Documento Técnico',
  'Custom.CheckList_DocumentoImplantacao': 'Documento de Implantação',
  'Custom.CheckList_HomologacaoFinalCliente': 'Homologação Final do Cliente',
  'Custom.CheckList_RevisarDocumentacaoTecnicaImplantacao': 'Revisar Documentação Técnica e de Implantação se Existiu Mudança',
  'Custom.CheckList_TermoEncerramento': 'Termo de Encerramento',
  'Custom.CheckList_Passados30DiasTermoEncerramento': 'Passados 30 Dias do Envio do Termo de Encerramento',
  'Custom.CheckList_KTAreaSustentacao': 'KT com a Area de Sustentação',
  'Custom.ComplexidadeList': 'Complexidade do Projeto',
  'Custom.Criticidade': 'Criticidade do Projeto',
  'Custom.Developer1': 'Desenvolvedor Responsável 1',
  'Custom.EnvolveQA': 'Envolvimento de QA',
  'Custom.HorasConsumidasReal': 'Horas Consumidas (Real)',
  'Custom.HorasProjeto': 'Horas Planejadas do Projeto',
  'Custom.HorasVendidas': 'Horas Vendidas ao Cliente',
  'Custom.LiberaHorasAutomatica': 'Liberação Automática de Horas',
  'Custom.LinkPastaDocumentacao': 'Link da Pasta de Documentação',
  'Custom.NumeroProposta': 'Número da Proposta Comercial',
  'Custom.Objetivo': 'Objetivo do Projeto',
  'Custom.ProjetoAtrasado': 'Projeto em Atraso',
  'Custom.QtdReplamejamento': 'Quantidade de Replanejamentos',
  'Custom.ResponsavelCliente': 'Responsável pelo Cliente',
  'Custom.ResponsavelTecnico': 'Responsável Técnico',
  'Custom.SaldoHoras': 'Saldo de Horas do Projeto',
  'Custom.SituacaoPendenteList': 'Situação de Pendências',
  'Custom.StatusHoras': 'Status das Horas do Projeto',

  // Campos Microsoft.VSTS.Common
  'Microsoft.VSTS.Common.ActivatedBy': 'Ativado por',
  'Microsoft.VSTS.Common.ActivatedDate': 'Data de Ativação',
  'Microsoft.VSTS.Common.Priority': 'Prioridade',
  'Microsoft.VSTS.Common.StackRank': 'Ordem de Priorização Interna',
  'Microsoft.VSTS.Common.StateChangeDate': 'Data da Última Mudança de Estado',
  'Microsoft.VSTS.Common.ValueArea': 'Área de Valor',

  // Campos de Planejamento
  'Microsoft.VSTS.Scheduling.StartDate': 'Data de Início Planejada',
  'Microsoft.VSTS.Scheduling.TargetDate': 'Data de Entrega Planejada',

  // Estrutura Organizacional
  'System.AreaLevel1': 'Organização',
  'System.AreaLevel2': 'Área',
  'System.AreaLevel3': 'Tipo de Cliente',
  'System.AreaLevel4': 'Cliente',
  'System.AreaPath': 'Caminho Organizacional',

  // Responsáveis e Auditoria
  'System.AssignedTo': 'Responsável Atual',
  'System.AuthorizedAs': 'Autorizado por',
  'System.AuthorizedDate': 'Data de Autorização',
  'System.ChangedBy': 'Alterado por',
  'System.ChangedDate': 'Data da Última Alteração',
  'System.CreatedBy': 'Criado por',
  'System.CreatedDate': 'Data de Criação',

  // Identificação do Work Item
  'System.Title': 'Título',
  'System.Description': 'Descrição Resumida',
  'System.WorkItemType': 'Tipo do Item',
  'System.State': 'Status Atual',
  'System.TeamProject': 'Projeto',

  // Kanban
  'System.BoardColumn': 'Coluna do Kanban',
  'System.BoardColumnDone': 'Coluna Finalizada',

  // Identificação e Controle Interno (campos legíveis que devem ser formatados)
  'System.NodeName': 'Nome do Nó Organizacional',
  
  // Comentários e Histórico
  'System.CommentCount': 'Contagem de Comentários',
  'System.Reason': 'Motivo da Última Alteração',
  
  // Iteração e Planejamento
  'System.IterationLevel1': 'Organização da Iteração',
  'System.IterationLevel2': 'Cliente da Iteração',
  'System.IterationPath': 'Caminho da Iteração',
};

/**
 * Determina o tipo de campo baseado no nome
 */
function getFieldType(fieldName) {
  if (fieldName.startsWith('Custom.CheckList_')) {
    return 'checklist';
  }
  if (fieldName.includes('List') && (fieldName.includes('Custom.') || fieldName.includes('Microsoft.VSTS.Common.'))) {
    return 'list';
  }
  if (fieldName.includes('Developer') || fieldName.includes('Responsavel') || fieldName.includes('AssignedTo') || 
      fieldName.includes('CreatedBy') || fieldName.includes('ChangedBy') || fieldName.includes('ActivatedBy') ||
      fieldName.includes('AuthorizedAs')) {
    return 'identity';
  }
  if (fieldName.includes('Date') || fieldName.includes('Date')) {
    return 'date';
  }
  if (fieldName === 'Custom.Objetivo' || fieldName === 'System.Description') {
    return 'html';
  }
  if (fieldName === 'Custom.LinkPastaDocumentacao') {
    return 'url';
  }
  return 'text';
}

/**
 * Formata um valor baseado no tipo do campo
 */
function formatFieldValue(fieldName, value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const fieldType = getFieldType(fieldName);

  switch (fieldType) {
    case 'checklist':
      return formatChecklistValue(value);
    case 'list':
      return formatListValue(value);
    case 'identity':
      return formatIdentityField(value);
    case 'date':
      return formatDatetime(value, false);
    case 'html':
      return formatHtmlField(value);
    case 'url':
      return String(value).trim();
    default:
      return String(value).trim();
  }
}

/**
 * Transforma campos brutos do Azure DevOps em campos formatados
 * @param {Object} rawFields - Campos brutos do Azure DevOps
 * @returns {Object} Campos formatados organizados por categoria
 */
export function formatWorkItemFields(rawFields) {
  if (!rawFields || typeof rawFields !== 'object') {
    return {
      customizados: {},
      microsoft: {},
      planejamento: {},
      organizacao: {},
      responsaveis: {},
      identificacao: {},
      kanban: {},
    };
  }

  const formatted = {
    customizados: {},
    microsoft: {},
    planejamento: {},
    organizacao: {},
    responsaveis: {},
    identificacao: {},
    kanban: {},
  };

  for (const [fieldName, rawValue] of Object.entries(rawFields)) {
    // Ignora campos técnicos/internos
    if (isInternalField(fieldName)) {
      continue;
    }

    // Ignora campos WEF (Work Item Extension Framework) internos
    if (fieldName.startsWith('WEF_') && fieldName.includes('System.ExtensionMarker')) {
      continue;
    }

    // Obtém nome legível do campo
    let displayName = FIELD_NAME_MAP[fieldName] || fieldName;
    
    // Tratamento especial para campos WEF_*_Kanban.Lane (prefixo dinâmico)
    if (fieldName.startsWith('WEF_') && fieldName.endsWith('_Kanban.Lane')) {
      displayName = 'Linha do Board';
    }

    // Formata o valor
    const formattedValue = formatFieldValue(fieldName, rawValue);

    // Organiza por categoria
    if (fieldName.startsWith('Custom.')) {
      formatted.customizados[displayName] = formattedValue;
    } else if (fieldName.startsWith('Microsoft.VSTS.Common.')) {
      formatted.microsoft[displayName] = formattedValue;
    } else if (fieldName.startsWith('Microsoft.VSTS.Scheduling.')) {
      formatted.planejamento[displayName] = formattedValue;
    } else if (fieldName.startsWith('System.Area') || fieldName === 'System.AreaPath') {
      formatted.organizacao[displayName] = formattedValue;
    } else if (fieldName.includes('AssignedTo') || fieldName.includes('CreatedBy') || 
               fieldName.includes('ChangedBy') || fieldName.includes('ActivatedBy') ||
               fieldName.includes('AuthorizedAs') || fieldName.includes('AuthorizedDate') ||
               fieldName.includes('ChangedDate') || fieldName.includes('CreatedDate')) {
      formatted.responsaveis[displayName] = formattedValue;
    } else if (fieldName.startsWith('System.Board') || (fieldName.startsWith('WEF_') && fieldName.includes('Kanban'))) {
      formatted.kanban[displayName] = formattedValue;
    } else if (fieldName.startsWith('System.')) {
      formatted.identificacao[displayName] = formattedValue;
    }
  }

  return formatted;
}

/**
 * Filtra campos brutos removendo campos que foram formatados
 * Mantém apenas campos que não foram convertidos para formato legível
 * @param {Object} rawFields - Campos brutos do Azure DevOps
 * @returns {Object} Campos brutos filtrados (sem campos formatados)
 */
export function filterRawFields(rawFields) {
  if (!rawFields || typeof rawFields !== 'object') {
    return {};
  }

  const filtered = {};

  for (const [fieldName, rawValue] of Object.entries(rawFields)) {
    // Remove campos técnicos/internos completamente (não devem aparecer em raw_fields_json)
    if (isInternalField(fieldName)) {
      continue;
    }

    // Remove campos WEF que são apenas marcadores técnicos
    if (fieldName.startsWith('WEF_') && fieldName.includes('System.ExtensionMarker')) {
      continue;
    }

    // Remove campos que estão no FIELD_NAME_MAP (foram formatados)
    // Se o campo tem um nome legível mapeado, significa que foi formatado
    if (FIELD_NAME_MAP[fieldName]) {
      continue;
    }

    // Remove campos WEF Kanban que são duplicados de campos já formatados
    // WEF_*_Kanban.Column é equivalente a System.BoardColumn (já formatado)
    if (fieldName.startsWith('WEF_') && fieldName.includes('Kanban.Column') && !fieldName.includes('Done') && !fieldName.includes('Lane')) {
      continue;
    }
    
    // WEF_*_Kanban.Column.Done é equivalente a System.BoardColumnDone (já formatado)
    if (fieldName.startsWith('WEF_') && fieldName.includes('Kanban.Column.Done')) {
      continue;
    }

    // Mantém apenas campos que não foram formatados e não são técnicos
    filtered[fieldName] = rawValue;
  }

  return filtered;
}

/**
 * Transforma campos brutos em um objeto simples com nomes legíveis
 * @param {Object} rawFields - Campos brutos do Azure DevOps
 * @returns {Object} Campos formatados como objeto chave-valor simples
 */
export function formatWorkItemFieldsFlat(rawFields) {
  if (!rawFields || typeof rawFields !== 'object') {
    return {};
  }

  const formatted = {};

  for (const [fieldName, rawValue] of Object.entries(rawFields)) {
    // Ignora campos técnicos/internos
    if (isInternalField(fieldName)) {
      continue;
    }

    // Ignora campos WEF internos
    if (fieldName.startsWith('WEF_') && fieldName.includes('System.ExtensionMarker')) {
      continue;
    }

    // Obtém nome legível do campo
    let displayName = FIELD_NAME_MAP[fieldName] || fieldName;
    
    // Tratamento especial para campos WEF_*_Kanban.Lane (prefixo dinâmico)
    if (fieldName.startsWith('WEF_') && fieldName.endsWith('_Kanban.Lane')) {
      displayName = 'Linha do Board';
    }

    // Formata o valor
    const formattedValue = formatFieldValue(fieldName, rawValue);

    formatted[displayName] = formattedValue;
  }

  return formatted;
}