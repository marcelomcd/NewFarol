/**
 * Utilitário para organizar campos de checklist por transição de estado
 */

/**
 * Mapeamento de campos de checklist para transições de estado
 * Os campos são mapeados pelos nomes que aparecem no FIELD_NAME_MAP (nomes exatos do DevOps)
 */
const CHECKLIST_TRANSITIONS = {
  'Projeto em Aberto -> Em Planejamento': [
    'Definição de Gerente de Projetos',
    'E-mail Boas Vindas ao Cliente',
  ],
  'Projeto em Planejamento -> Em Andamento': [
    'Definição de Recurso',
    'Realizar Discovery',
    'Definição de Cronograma',
    'Inserção de Story no Azure DevOps',
    'Inserção do Projeto na Agenda do Recurso',
    'E-mail de Comunicação ao Cliente com a Apresentação de Kick-off (PowerPoint) e Cronograma Anexados, um dia Antes da Reunião',
    'Início do Desenvolvimento, Gestão do Projeto e Reuniões Semanais de Status Report',
  ],
  'Projeto em Andamento -> Em Homologação': [
    'Realizar Planning, Planejar Daily e Atribuir Todos os Impeditivos, Tasks, etc',
    'Realizar Daily',
    'Finalização das Tarefas (Controle pelo Azure DevOps)',
    'Documento Técnico',
    'Documento de Implantação',
  ],
  'Homologação -> Em Fase de Encerramento': [
    'Homologação Final do Cliente',
  ],
  'Em Encerramento -> Em Garantia': [
    'Revisar Documentação Técnica e de Implantação se Existiu Mudança',
    'Termo de Encerramento',
  ],
  'Em Garantia -> Encerrado': [
    'Passados 30 Dias do Envio do Termo de Encerramento',
    'KT com a Area de Sustentação',
  ],
};

/**
 * Mapeamento reverso: nome formatado (do DevOps) -> campo bruto
 */
const CHECKLIST_FIELD_REVERSE_MAP = {
  'Definição de Gerente de Projetos': 'Custom.CheckList_DefinicaoGP',
  'E-mail Boas Vindas ao Cliente': 'Custom.CheckList_EmailBoasVindas',
  'Definição de Recurso': 'Custom.CheckList_DefinicaoRecurso',
  'Realizar Discovery': 'Custom.CheckList_RealizarDiscovery',
  'Definição de Cronograma': 'Custom.CheckList_DefinicaoCronograma',
  'Inserção de Story no Azure DevOps': 'Custom.CheckList_InsercaoStoryAzureDevOps',
  'Inserção do Projeto na Agenda do Recurso': 'Custom.CheckList_InsercaoProjetoAgendaRecurso',
  'E-mail de Comunicação ao Cliente com a Apresentação de Kick-off (PowerPoint) e Cronograma Anexados, um dia Antes da Reunião': 'Custom.CheckList_EmailComunicacaoClientKickOff',
  'Início do Desenvolvimento, Gestão do Projeto e Reuniões Semanais de Status Report': 'Custom.CheckList_InicioDesenvolvimentoGestaoProjeto',
  'Realizar Planning, Planejar Daily e Atribuir Todos os Impeditivos, Tasks, etc': 'Custom.CheckList_RealizarPlanningPlanejarDaily',
  'Realizar Daily': 'Custom.CheckList_RealizarDaily',
  'Finalização das Tarefas (Controle pelo Azure DevOps)': 'Custom.CheckList_FinalizacaoTarefasAzureDevOps',
  'Documento Técnico': 'Custom.CheckList_DocumentoTecnico',
  'Documento de Implantação': 'Custom.CheckList_DocumentoImplantacao',
  'Homologação Final do Cliente': 'Custom.CheckList_HomologacaoFinalCliente',
  'Revisar Documentação Técnica e de Implantação se Existiu Mudança': 'Custom.CheckList_RevisarDocumentacaoTecnicaImplantacao',
  'Termo de Encerramento': 'Custom.CheckList_TermoEncerramento',
  'Passados 30 Dias do Envio do Termo de Encerramento': 'Custom.CheckList_Passados30DiasTermoEncerramento',
  'KT com a Area de Sustentação': 'Custom.CheckList_KTAreaSustentacao',
};

/**
 * Formata valor de checklist (1-Não -> Não, 2-Sim -> Sim)
 */
function formatChecklistValue(value) {
  if (!value) return null;
  if (value === '1-Não' || value === '1-Nao') return 'Não';
  if (value === '2-Sim') return 'Sim';
  return String(value);
}

/**
 * Organiza campos de checklist por transição de estado
 * @param {Object} formattedFields - Campos formatados (fields_formatted)
 * @param {Object} rawFields - Campos brutos do Azure DevOps (para buscar valores originais)
 * @returns {Object} Checklist organizado por transição de estado
 */
export function organizeChecklistByTransition(formattedFields, rawFields = {}) {
  if (!formattedFields || typeof formattedFields !== 'object') {
    formattedFields = {};
  }
  if (!rawFields || typeof rawFields !== 'object') {
    rawFields = {};
  }

  const organized = {};

  // Iterar sobre cada transição
  for (const [transition, checklistLabels] of Object.entries(CHECKLIST_TRANSITIONS)) {
    organized[transition] = [];

    // Para cada label de checklist nesta transição
    for (const label of checklistLabels) {
      let value = null;
      
      // Tentar encontrar no formattedFields primeiro
      if (formattedFields[label] !== undefined && formattedFields[label] !== null && formattedFields[label] !== '') {
        value = formattedFields[label];
      } else {
        // Se não encontrou no formattedFields, tentar buscar pelo campo bruto
        const rawFieldName = CHECKLIST_FIELD_REVERSE_MAP[label];
        if (rawFieldName) {
          const rawValue = rawFields[rawFieldName];
          // Incluir mesmo se estiver vazio, null ou undefined
          if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
            value = formatChecklistValue(rawValue);
          }
          // Se rawValue existe mas está vazio/null/undefined, value permanece null (será exibido como em branco)
        }
      }
      
      // Sempre adicionar o item, mesmo que o valor esteja em branco (null)
      organized[transition].push({
        label: label,
        value: value, // null, 'Sim', 'Não', ou outro valor
      });
    }
  }

  // NÃO remover transições vazias - sempre exibir todas as transições

  return organized;
}
