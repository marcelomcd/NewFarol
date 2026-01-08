/**
 * Normalização de campos brutos do Azure DevOps para exibição
 * Baseado nas especificações fornecidas
 */

/**
 * Normaliza o nome do campo para exibição
 */
export function normalizeRawFieldName(key: string): string {
  // Campos Customizados
  if (key === 'Custom.Criticidade') return 'Criticidade'
  if (key === 'Custom.Developer1') return 'Desenvolvedor 1'
  if (key === 'Custom.EnvolveQA') return 'Envolve QA'
  if (key === 'Custom.HorasConsumidasReal') return 'Horas Consumidas Real'
  if (key === 'Custom.HorasProjeto') return 'Horas do Projeto'
  if (key === 'Custom.HorasVendidas') return 'Horas Vendidas'
  if (key === 'Custom.LiberaHorasAutomatica') return 'Liberação Automática de Horas'
  if (key === 'Custom.NumeroProposta') return 'Número da Proposta'
  if (key === 'Custom.ProjetoAtrasado') return 'Projeto Atrasado'
  if (key === 'Custom.QtdReplamejamento') return 'Quantidade de Replanejamentos'
  if (key === 'Custom.ResponsavelCliente') return 'Responsável do Cliente'
  if (key === 'Custom.ResponsavelTecnico') return 'Responsável Técnico'
  if (key === 'Custom.SaldoHoras') return 'Saldo de Horas'
  if (key === 'Custom.SituacaoPendenteList') return 'Situação de Pendências'
  if (key === 'Custom.ComplexidadeList') return 'Complexidade'
  if (key === 'Custom.CoordenadorProjetosCliente') return 'Coordenador de Projetos (Cliente)'
  if (key === 'Custom.DataInicialEntregaProjeto') return 'Data Inicial de Entrega do Projeto'
  if (key === 'Custom.FaseProjeto') return 'Fase do Projeto'
  if (key === 'Custom.PorcentagemEntrega') return 'Porcentagem de Entrega'
  if (key === 'Custom.Objetivo') return 'Objetivo'
  if (key === 'Custom.StatusHoras') return 'Status das Horas'
  if (key === 'Custom.StatusProjeto') return 'Status do Projeto'

  // Campos de Sistema
  if (key === 'System.Id') return 'ID do Work Item'
  if (key === 'System.Title') return 'Título'
  if (key === 'System.WorkItemType') return 'Tipo do Item'
  if (key === 'System.State') return 'Status'
  if (key === 'System.AssignedTo') return 'Responsável Atual'
  if (key === 'System.CreatedBy') return 'Criado por'
  if (key === 'System.CreatedDate') return 'Data de Criação'
  if (key === 'System.ChangedBy') return 'Última Alteração por'
  if (key === 'System.ChangedDate') return 'Data da Última Alteração'
  if (key === 'System.ActivatedBy') return 'Ativado por'
  if (key === 'System.ActivatedDate') return 'Data de Ativação'
  if (key === 'System.Priority') return 'Prioridade'
  if (key === 'System.AreaLevel1') return 'Área Nível 1'
  if (key === 'System.AreaLevel2') return 'Área Nível 2'
  if (key === 'System.AreaLevel3') return 'Área Nível 3'
  if (key === 'System.AreaLevel4') return 'Cliente'
  if (key === 'System.AreaPath') return 'Caminho da Área'
  if (key === 'System.IterationPath') return 'Sprint / Iteração'
  if (key === 'System.NodeName') return 'Nome do Nó'
  if (key === 'System.TeamProject') return 'Projeto da Equipe'
  if (key === 'System.BoardColumn') return 'Coluna do Kanban'
  if (key === 'System.BoardLane') return 'Raia do Kanban'
  if (key === 'System.BoardColumnDone') return 'Coluna Concluída'
  if (key === 'System.CommentCount') return 'Quantidade de Comentários'
  if (key === 'System.Description') return 'Descrição'
  if (key === 'System.History') return 'Histórico'
  if (key === 'System.Parent') return 'Item Pai'
  if (key === 'System.Reason') return 'Motivo'
  if (key === 'System.StateChangeDate') return 'Data da Última Mudança de Status'
  if (key === 'System.Watermark') return 'Watermark'
  if (key === 'System.RevisedDate') return 'Data Revisada'

  // Campos Microsoft.VSTS
  if (key === 'Microsoft.VSTS.Scheduling.StartDate') return 'Data de Início'
  if (key === 'Microsoft.VSTS.Scheduling.TargetDate') return 'Data Alvo'
  if (key === 'Microsoft.VSTS.Common.StateChangeDate') return 'Data da Última Mudança de Status'
  if (key === 'Microsoft.VSTS.Common.Priority') return 'Prioridade'
  if (key === 'Microsoft.VSTS.Common.StackRank') return 'Stack Rank'
  if (key === 'Microsoft.VSTS.Common.ValueArea') return 'Área de Valor'
  if (key === 'Microsoft.VSTS.Common.ActivatedBy') return 'Ativado por'
  if (key === 'Microsoft.VSTS.Common.ActivatedDate') return 'Data de Ativação'
  if (key === 'Microsoft.VSTS.Common.JoinOnDateBehavior') return 'Comportamento de Data'

  // Campos WEF (Work Item Extensions) - geralmente ignorados
  if (key.startsWith('WEF_')) return null

  // Retorna o nome original se não houver mapeamento
  return key
}

/**
 * Normaliza o valor do campo para exibição
 */
export function normalizeRawFieldValue(key: string, value: any): string | null {
  if (value === null || value === undefined) {
    return null
  }

  // Campos que devem ser ignorados
  if (key === 'System.Rev' || key === 'System.Watermark' || key === 'System.PersonId') {
    return null
  }
  if (key === 'System.RevisedDate' && String(value) === '9999-01-01T00:00:00Z') {
    return null
  }
  if (key.startsWith('WEF_')) {
    return null
  }

  // Campos que são objetos com displayName
  if (typeof value === 'object' && value !== null && 'displayName' in value) {
    return value.displayName
  }

  // Normalização específica por tipo de campo
  if (key === 'Custom.Criticidade') {
    const str = String(value).trim()
    // Remove prefixo numérico (ex: "3-Alta" -> "Alto", "4- Altissimo" -> "Altíssimo")
    const match = str.match(/^\d+\s*-\s*(.+)$/i)
    if (match) {
      const valor = match[1].trim()
      // Normaliza variações
      if (valor.toLowerCase().includes('altissimo') || valor.toLowerCase().includes('altíssimo')) {
        return 'Altíssimo'
      }
      if (valor.toLowerCase().includes('alto')) {
        return 'Alto'
      }
      if (valor.toLowerCase().includes('medio') || valor.toLowerCase().includes('médio')) {
        return 'Médio'
      }
      if (valor.toLowerCase().includes('baixo')) {
        return 'Baixo'
      }
      return valor
    }
    return str
  }

  if (key === 'Custom.Developer1' || key === 'Custom.ResponsavelTecnico' || key === 'System.AssignedTo' || 
      key === 'System.CreatedBy' || key === 'System.ChangedBy' || key === 'System.ActivatedBy' ||
      key === 'Microsoft.VSTS.Common.ActivatedBy') {
    if (typeof value === 'object' && value !== null && 'displayName' in value) {
      return value.displayName
    }
    return String(value)
  }

  if (key === 'Custom.EnvolveQA' || key === 'Custom.ProjetoAtrasado' || key === 'Custom.LiberaHorasAutomatica') {
    const str = String(value).trim().toLowerCase()
    if (str === 'sim' || str === 'yes' || str === 'true' || str === '1') {
      return 'Sim'
    }
    if (str === 'não' || str === 'nao' || str === 'no' || str === 'false' || str === '0') {
      return 'Não'
    }
    return String(value)
  }

  if (key === 'Custom.SituacaoPendenteList') {
    const str = String(value).trim()
    // Remove prefixo numérico (ex: "0-Sem Pendencia" -> "Sem Pendência")
    const match = str.match(/^\d+\s*-\s*(.+)$/i)
    if (match) {
      const valor = match[1].trim()
      if (valor.toLowerCase().includes('sem pendencia') || valor.toLowerCase().includes('sem pendência')) {
        return 'Sem Pendência'
      }
      return valor
    }
    // Se não tiver formato com hífen, retorna como está
    return str
  }

  if (key === 'Custom.ResponsavelCliente') {
    const str = String(value).trim()
    if (str === '-' || str === '' || str.toLowerCase() === 'não informado') {
      return 'Não informado'
    }
    return str
  }

  // Campos de data
  if (key.includes('Date') || key.includes('Data')) {
    if (typeof value === 'string') {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
          })
        }
      } catch {
        // Ignora erros de parsing
      }
    }
  }

  // Campos numéricos
  if (key === 'Custom.HorasConsumidasReal' || key === 'Custom.HorasProjeto' || 
      key === 'Custom.HorasVendidas' || key === 'Custom.SaldoHoras' || 
      key === 'Custom.QtdReplamejamento' || key === 'System.Id' || 
      key === 'System.Priority' || key === 'System.CommentCount') {
    return String(value)
  }

  // Campos de porcentagem
  if (key === 'Custom.PorcentagemEntrega') {
    const str = String(value).trim()
    // Remove espaços extras e garante formato "XX %"
    return str.replace(/\s+/g, ' ').trim()
  }

  // Prioridade (sugestão semântica)
  if (key === 'System.Priority' || key === 'Microsoft.VSTS.Common.Priority') {
    const num = Number(value)
    if (num === 1) return '1 - Alta'
    if (num === 2) return '2 - Média'
    if (num === 3) return '3 - Baixa'
    return String(value)
  }

  // Se for objeto, retorna JSON formatado
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2)
  }

  // Se for string com HTML, retorna como está
  if (typeof value === 'string' && (value.includes('<') || value.includes('>'))) {
    return value
  }

  return String(value)
}

/**
 * Verifica se o campo deve ser exibido
 */
export function shouldDisplayRawField(key: string, value: any): boolean {
  // Campos que devem ser ignorados
  const ignoredFields = [
    'System.Rev',
    'System.Watermark',
    'System.PersonId',
    'System.RevisedDate',
    'System.AreaId',
    'System.IterationId',
  ]

  if (ignoredFields.includes(key)) {
    return false
  }

  // Campos WEF (Work Item Extensions) devem ser ignorados
  if (key.startsWith('WEF_')) {
    return false
  }

  // System.RevisedDate com valor 9999-01-01 deve ser ignorado
  if (key === 'System.RevisedDate' && String(value) === '9999-01-01T00:00:00Z') {
    return false
  }

  return true
}

/**
 * Organiza campos brutos para exibição
 */
export function organizeRawFields(fields: Record<string, any>): Array<{ name: string; value: string }> {
  const organized: Array<{ name: string; value: string }> = []

  for (const [key, value] of Object.entries(fields)) {
    if (!shouldDisplayRawField(key, value)) {
      continue
    }

    const normalizedName = normalizeRawFieldName(key)
    if (!normalizedName) {
      continue
    }

    const normalizedValue = normalizeRawFieldValue(key, value)
    if (normalizedValue === null) {
      continue
    }

    organized.push({
      name: normalizedName,
      value: normalizedValue
    })
  }

  // Ordenar por nome
  organized.sort((a, b) => a.name.localeCompare(b.name))

  return organized
}
