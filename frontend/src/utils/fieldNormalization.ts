// Normalização de campos do Azure DevOps (baseado no OldFarol)

// Mapeamento de renomeação de campos
export const RENOMEAR_CAMPOS: { [key: string]: string } = {
  // Campos Custom
  "acoestomadas": "Ações Tomadas",
  "aprovadorprojetocliente": "Aprovador (Cliente)",
  "comentariosadicionais": "Comentários Adicionais",
  "complexidadelist": "Complexidade",
  "coordenadorprojetoscliente": "Coordenador (Cliente)",
  "cronogramaprojeto": "Cronograma",
  "criticidade": "Criticidade",
  "dataliberadahomologacao": "Data Liberada para Homologação",
  "datainicialentregaprojeto": "Data Inicial Entrega",
  "datapausadopelocliente": "Data Pausa Cliente",
  "datapendentecliente": "Data Pendente Cliente",
  "datafinalgarantia": "Data Final Garantia",
  "detalhesproblemasprojeto": "Detalhes do Problema",
  "escopoprojeto": "Escopo",
  "envolveqa": "Envolve QA",
  "faseprojeto": "Fase do Projeto",
  "horasconsumidasreal": "Horas Consumidas",
  "horasprojeto": "Horas Planejadas",
  "horasvendidas": "Horas do Projeto",
  "keyusercliente": "Key User",
  "moivopausacliente": "Motivo Pausa Cliente",
  "motivoestouroprojeto": "Motivo Estouro",
  "numeroproposta": "N° Proposta",
  "porcentagementrega": "%",
  "principaispontosatencao": "Pontos de Atenção",
  "projetoatrasado": "Projeto Atrasado",
  "proximospassos": "Próximos Passos",
  "responsavelcliente": "Responsável Cliente",
  "responsaveltecnico": "Responsável Técnico",
  "statusprojeto": "Status do Projeto",
  "statushoras": "Status das Horas",
  "saldohoras": "Saldo de Horas",
  "situacaopendentelist": "Pendências",
  "qtdreplamejamento": "Quantidade de Replanejamentos",
  "liberahorasautomatica": "Liberar Horas Automaticamente",
  "descricaoqa": "Descrição de QA",
  "qainternodtrecebimentoprojeto": "Data de Recebimento do Projeto",
  "qainternodtestimadahomolog": "Data Estimada de Homologação Interna",
  "qainternodtestimadahomologcliente": "Data Estimada de Homologação do Cliente",
  "qainternodtaprovacao": "Data de Aprovação do QA",
  "qainternodtlimitedeajustesfinais": "Data Limite para Ajustes Finais",
  "qainternodtproxretornodev": "Próximo Retorno do Desenvolvimento",
  "developer1": "Desenvolvedor 1",
  
  // Campos System
  "system.title": "Título",
  "system.workitemtype": "Tipo de Item de Trabalho",
  "system.state": "Status",
  "system.reason": "Motivo da Alteração",
  "system.assignedto": "PMO",
  "system.createdby": "Criado Por",
  "system.createddate": "Data de Criação",
  "system.changedby": "Alterado Por",
  "system.changeddate": "Data da Última Alteração",
  "system.areapath": "Área",
  "system.iterationpath": "Iteração",
  "system.priority": "Prioridade",
  "system.description": "Descrição",
  "system.parent": "Item Pai",
  "system.boardcolumn": "Coluna do Kanban",
  "system.boardlane": "Raia do Kanban",
  "system.activatedby": "Criado Por",
  "system.activateddate": "Data de Ativação",
  "system.authorizedas": "Autorizado Como",
  "system.authorizeddate": "Data de Autorização",
  "system.teamproject": "Projeto da Equipe",
  "system.nodeName": "Nome do Nó",
  "system.commentcount": "Quantidade de Comentários",
  
  // Campos Microsoft.VSTS
  "microsoft.vsts.scheduling.targetdate": "Data Fim",
  "microsoft.vsts.scheduling.startdate": "Data de Início",
  "microsoft.vsts.common.priority": "Prioridade",
  "microsoft.vsts.common.stackrank": "Stack Rank",
  "microsoft.vsts.common.valuearea": "Área de Valor",
  "microsoft.vsts.common.activatedby": "Criado Por",
  "microsoft.vsts.common.activateddate": "Data de Ativação",
  
  // Campos Request
  "requestclientenome": "Cliente",
  "requestcontatocliente": "Contato do Cliente",
  "requestdatasolicitadacliente": "Data Solicitada Pelo Cliente",
  "requestidcrm": "ID CRM",
  "requestsolicitanteinterno": "Solicitante Interno",
  
  // Outros
  "objetivo": "Objetivo",
  "pausetime": "Data de Parada",
  "starttime": "Data de Início",
  "emfasedeencerramentotimee": "Em Fase de Encerramento",
}

// Campos que devem ser excluídos da exibição
export const CAMPOS_EXCLUIDOS: Set<string> = new Set([
  "horasprojeto",
  "horasconsumidasreal",
  "statushoras",
  "saldohoras",
  "detalhesforaescopo",
  "liberahorasautomatica",
  "qtdreplamejamento",
  "criticidade",
  "envolveqa",
  "complexidadelist",
  "datadiscussion",
  "responsaveldiscussion",
  "situacaopendentelist",
  "statusprojeto",
  "porcentagementrega",
  "datafinalgarantia",
  "motivoestouroprojeto",
  "niveldecobranca",
  "system.id",
  "system.rev",
  "system.watermark",
  "system.reviseddate",
  "system.areaid",
  "system.iterationid",
  "system.personid",
  "system.authorizedas",
  "system.authorizeddate",
  "wef_dd75f0d9b7b54634b0209dfcfed65429_kanban.column",
  "wef_dd75f0d9b7b54634b0209dfcfed65429_kanban.column.done",
  "wef_dd75f0d9b7b54634b0209dfcfed65429_kanban.lane",
  "wef_dd75f0d9b7b54634b0209dfcfed65429_system.extensionmarker",
])

// Campos do Status Report
export const CAMPOS_STATUS_REPORT: Set<string> = new Set([
  "statusreport",
  "objetivo",
  "principaispontosatencao",
  "acoestomadas",
  "proximospassos",
  "comentariosadicionais",
])

// Ordem prioritária de campos
export const ORDEM_PRIORITARIA: string[] = [
  "Cliente",
  "N° Proposta",
  "Responsável Técnico",
  "Horas do Projeto",
  "Data Fim",
  "Criado Por",
  "Criticidade",
  "Pendências",
  "Data Liberada para Homologação",
  "User Stories",
  "Tasks",
]

/**
 * Normaliza a chave do campo (remove Custom., Microsoft.VSTS., etc.)
 */
export function normalizeFieldKey(key: string): string {
  // Remove prefixos comuns
  let normalized = key
    .replace(/^Custom\./i, "")
    .replace(/^Microsoft\.VSTS\.Common\./i, "microsoft.vsts.common.")
    .replace(/^Microsoft\.VSTS\.Scheduling\./i, "microsoft.vsts.scheduling.")
    .replace(/^Microsoft\.VSTS\./i, "microsoft.vsts.")
    .replace(/^System\./i, "system.")
    .replace(/^Extension\./i, "")
    .replace(/^WEF_/i, "")  // Remove prefixo WEF (Work Item Extensions)
  
  // Remove caracteres especiais e converte para minúscula
  normalized = normalized
    .replace(/[^a-zA-Z0-9.]/g, "")
    .toLowerCase()
  
  return normalized
}

/**
 * Obtém o nome amigável do campo
 */
export function getFieldLabel(key: string): string {
  const normalized = normalizeFieldKey(key)
  return RENOMEAR_CAMPOS[normalized] || key.split('.').pop() || key
}

/**
 * Normaliza o valor do campo
 */
export function normalizeFieldValue(label: string, value: any): string {
  if (value === null || value === undefined) {
    return ""
  }

  // Se for objeto com displayName
  if (typeof value === 'object' && value !== null && 'displayName' in value) {
    return value.displayName
  }

  // Normalização específica para Criticidade (ex: "1- Baixo" -> "Baixo")
  if (label.toLowerCase() === 'criticidade') {
    const str = String(value).trim()
    // Remove prefixo numérico com hífen (ex: "1- Baixo", "2-Média")
    const match = str.match(/^\d+\s*-\s*(.+)$/i)
    if (match) {
      return match[1].trim()
    }
    // Se não tiver hífen, retorna como está
    return str
  }

  // Normalização específica para Complexidade (ex: "2-Média" -> "Média")
  if (label.toLowerCase() === 'complexidade' || label.toLowerCase().includes('complexidade')) {
    const str = String(value).trim()
    // Remove prefixo numérico com hífen (ex: "2-Média")
    const match = str.match(/^\d+\s*-\s*(.+)$/i)
    if (match) {
      return match[1].trim()
    }
    // Se não tiver hífen, retorna como está
    return str
  }

  // Normalização específica para Pendências (ex: "0-Sem Pendencia" -> "Não")
  if (label.toLowerCase() === 'pendências' || label.toLowerCase().includes('pendente')) {
    const str = String(value).trim().toLowerCase()
    // Remove prefixo numérico com hífen (ex: "0-Sem Pendencia")
    const match = str.match(/^\d+\s*-\s*(.+)$/i)
    if (match) {
      const texto = match[1].trim().toLowerCase()
      // Se contém "sem pendência" ou similar, retorna "Não"
      if (texto.includes('sem') || texto.includes('no') || texto.includes('false')) {
        return 'Não'
      }
      // Se contém "sim", "yes", "true", retorna "Sim"
      if (texto.includes('sim') || texto.includes('yes') || texto.includes('true')) {
        return 'Sim'
      }
      // Por padrão, se não tem pendência, retorna "Não"
      return 'Não'
    }
    // Se não tiver formato com hífen, verifica diretamente
    if (str.includes('sim') || str.includes('yes') || str.includes('true') || str === '1') {
      return 'Sim'
    }
    if (str.includes('sem') || str.includes('no') || str.includes('false') || str === '0') {
      return 'Não'
    }
    return 'Não'
  }

  // Se for string com HTML, retornar como está (será renderizado com htmlToJsx)
  if (typeof value === 'string' && (value.includes('<') || value.includes('>'))) {
    return value
  }

  // Se for data
  if (label.toLowerCase().includes('data') || label.toLowerCase().includes('date')) {
    if (typeof value === 'string') {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          // Ajuste GMT-3
          date.setHours(date.getHours() - 3)
          return date.toLocaleDateString('pt-BR')
        }
      } catch {
        // Ignora erros de parsing
      }
    }
  }

  return String(value).trim()
}

/**
 * Filtra e organiza campos para exibição
 */
export function organizeFields(fields: Record<string, any>): {
  statusReport: Record<string, any>
  customFields: Record<string, any>
  systemFields: Record<string, any>
  allFields: Record<string, any>
} {
  const statusReport: Record<string, any> = {}
  const customFields: Record<string, any> = {}
  const systemFields: Record<string, any> = {}
  const allFields: Record<string, any> = {}

  for (const [key, value] of Object.entries(fields)) {
    const normalized = normalizeFieldKey(key)
    const label = getFieldLabel(key)
    
    // Pular campos excluídos
    if (CAMPOS_EXCLUIDOS.has(normalized)) {
      continue
    }

    // Normalizar valor (tratar objetos como System.AssignedTo)
    let normalizedValue: any = value
    if (typeof value === 'object' && value !== null && 'displayName' in value) {
      normalizedValue = value.displayName
    } else {
      normalizedValue = normalizeFieldValue(label, value)
    }
    
    if (!normalizedValue || normalizedValue === 'null' || normalizedValue === 'None' || normalizedValue === '') {
      continue
    }

    allFields[label] = normalizedValue

    // Separar Status Report
    if (CAMPOS_STATUS_REPORT.has(normalized)) {
      statusReport[label] = normalizedValue
    } else if (key.startsWith('Custom.') || key.startsWith('Extension.')) {
      customFields[label] = normalizedValue
    } else if (key.startsWith('System.') || key.startsWith('Microsoft.VSTS.')) {
      systemFields[label] = normalizedValue
    }
  }

  return { statusReport, customFields, systemFields, allFields }
}
