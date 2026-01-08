import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { featuresApi, FeatureDetail, RelationsResponse } from '../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import CommentsList from '../components/Comments/CommentsList'
import FarolCircle from '../components/Farol/FarolCircle'
import Tooltip from '../components/Tooltip/Tooltip'
import ProgressBar from '../components/ProgressBar/ProgressBar'
import { normalizeFarolStatus } from '../utils/farol'
import { organizeFields, getFieldLabel, normalizeFieldValue, ORDEM_PRIORITARIA } from '../utils/fieldNormalization'
import { extractDisplayName, formatDate } from '../utils/featureHelpers'
import { htmlToJsx } from '../utils/htmlRenderer'

/**
 * Extrai nome do cliente do AreaPath (fallback se não vier do backend)
 */
function extractClientFromAreaPath(areaPath?: string): string | null {
  if (!areaPath) return null
  
  // Normaliza barras (aceita tanto / quanto \)
  const pathNormalized = areaPath.replace(/\//g, '\\')
  
  // Remove barras no final se houver
  const pathCleaned = pathNormalized.replace(/\\+$/, '')
  
  // Separa por barras invertidas
  const parts = pathCleaned.split('\\')
  if (parts.length === 0) return null
  
  // SEMPRE pega o último segmento (após a última barra invertida)
  const lastPart = parts[parts.length - 1].trim()
  
  if (!lastPart) return null
  
  // Se for Quali IT, retorna null
  const lastPartLower = lastPart.toLowerCase()
  if (lastPartLower === 'quali it' || lastPartLower === 'qualit' || lastPartLower === 'qualiit') {
    return null
  }
  
  // Normaliza: primeira letra de cada palavra em maiúscula
  const words = lastPart.split(' ')
  const normalized = words.map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
  
  return normalized
}

export default function FeatureDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['feature', id],
    queryFn: () => featuresApi.get(Number(id)),
    enabled: !!id,
  })

  // Buscar relações (User Stories e Tasks)
  const { data: relationsData } = useQuery({
    queryKey: ['feature-relations', id],
    queryFn: () => featuresApi.getRelations(Number(id)),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="glass dark:glass-dark p-6 rounded-lg text-center animate-fadeIn">
        <p className="text-red-500 text-lg">
          Erro ao carregar feature: {error instanceof Error ? error.message : 'Feature não encontrada'}
        </p>
        <button
          onClick={() => navigate('/features')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voltar para Features
        </button>
      </div>
    )
  }

  const feature = data as FeatureDetail
  const fields = feature.raw_fields_json || {}
  const farolStatus = normalizeFarolStatus(feature.farol_status)
  
  // Garantir que o cliente está normalizado (fallback se não vier do backend)
  const clientNormalized = feature.client 
    ? feature.client 
    : (feature.area_path ? extractClientFromAreaPath(feature.area_path) : null)

  // Organizar campos usando normalização
  const { statusReport, customFields, systemFields, allFields } = organizeFields(fields)
  
  // Separar objetivo dos outros campos do Status Report
  const objetivo = statusReport['Objetivo'] || statusReport['objetivo'] || fields['Custom.Objetivo']
  
  // Extrair Descrição de QA
  const descricaoQA = customFields['Descrição de QA'] || fields['Custom.DescricaoQA']
  
  const outrosStatusReport = Object.fromEntries(
    Object.entries(statusReport).filter(([key]) => 
      key.toLowerCase() !== 'objetivo'
    )
  )

  // Extrair PMO do AssignedTo (nome completo, não email)
  const assignedToObj = fields['System.AssignedTo']
  const pmoName = extractDisplayName(assignedToObj)

  // Contar User Stories e Tasks
  const relations = relationsData as { children?: any[] } | undefined
  const userStoriesCount = relations?.children?.filter(
    (item: any) => item.work_item_type?.toLowerCase() === 'user story'
  ).length || 0
  const tasksCount = relations?.children?.filter(
    (item: any) => item.work_item_type?.toLowerCase() === 'task'
  ).length || 0

  // Extrair campos destacados
  const numeroProposta = allFields['N° Proposta'] || customFields['N° Proposta'] || fields['Custom.NumeroProposta']
  const responsavelTecnico = allFields['Responsável Técnico'] || customFields['Responsável Técnico'] || extractDisplayName(fields['Custom.ResponsavelTecnico'])
  const horasProjeto = allFields['Horas do Projeto'] || customFields['Horas do Projeto'] || fields['Custom.HorasVendidas']
  const dataFim = allFields['Data Fim'] || customFields['Data Fim'] || formatDate(feature.target_date) || formatDate(fields['Microsoft.VSTS.Scheduling.TargetDate'])
  // Usar System.CreatedBy ao invés de System.ActivatedBy para "Criado Por"
  const criadoPor = extractDisplayName(fields['System.CreatedBy']) || allFields['Criado Por'] || customFields['Criado Por']
  // Normalizar Criticidade (remove prefixo numérico: "1- Baixo" -> "Baixo")
  const criticidadeRaw = allFields['Criticidade'] || customFields['Criticidade'] || fields['Custom.Criticidade']
  const criticidade = criticidadeRaw ? normalizeFieldValue('Criticidade', criticidadeRaw) : null
  
  // Normalizar Pendências (remove prefixo numérico: "0-Sem Pendencia" -> "Não")
  const pendenciasRaw = allFields['Pendências'] || customFields['Pendências'] || fields['Custom.SituacaoPendenteList']
  const pendencias = pendenciasRaw ? normalizeFieldValue('Pendências', pendenciasRaw) : null
  const dataHomologacaoRaw = allFields['Data Liberada para Homologação'] || customFields['Data Liberada para Homologação'] || fields['Custom.DataLiberadaHomologacao']
  const dataHomologacao = dataHomologacaoRaw ? formatDate(dataHomologacaoRaw) : null

  // % de entrega (Custom.PorcentagemEntrega) - aba Status Report
  const porcentagemEntregaRaw =
    allFields['Porcentagem de Entrega'] ||
    customFields['Porcentagem de Entrega'] ||
    fields['Custom.PorcentagemEntrega'] ||
    fields['Custom.PorcentagemEntrega.value'] ||
    fields['Custom.PorcentagemEntrega']
  const porcentagemEntrega = (() => {
    if (porcentagemEntregaRaw === null || porcentagemEntregaRaw === undefined) return null
    const s = String(porcentagemEntregaRaw).replace('%', '').trim()
    const n = Number(s.replace(',', '.'))
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null
  })()

  // Remover &text= do link Azure DevOps
  const azureDevOpsUrl = `https://dev.azure.com/qualiit/Quali%20IT%20-%20Inovação%20e%20Tecnologia/_workitems/edit/${feature.id}`

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all hover-lift"
            title="Voltar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <span>🔹</span>
              <span>ID: {feature.id}</span>
              <span className="text-xl">-</span>
              <span>{feature.title}</span>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <a
                href={azureDevOpsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                Abrir no Azure DevOps
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="glass dark:glass-dark p-6 rounded-lg">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FarolCircle status={farolStatus} size="normal" />
            <span className="font-semibold text-gray-800 dark:text-white">Farol: {farolStatus}</span>
          </div>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
            {feature.state}
          </span>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Atualizado: {format(new Date(feature.changed_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </div>
        </div>

        {porcentagemEntrega !== null && (
          <div className="mt-4">
            <ProgressBar percentage={porcentagemEntrega} label="Porcentagem de Entrega" />
          </div>
        )}
      </div>

      {/* Campos Destacados */}
      <div className="glass dark:glass-dark p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          <span>⭐</span>
          <span>Informações Principais</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <HighlightField 
            label="Cliente" 
            value={clientNormalized || '-'} 
          />
          <HighlightField label="Nº de Proposta" value={numeroProposta || '-'} />
          <HighlightField label="Responsável Técnico" value={responsavelTecnico || '-'} />
          <HighlightField label="Horas do Projeto" value={horasProjeto || '-'} />
          <HighlightField label="Data Fim" value={dataFim || '-'} />
          <HighlightField label="Criado Por" value={criadoPor || '-'} />
          <HighlightField label="Criticidade" value={criticidade || '-'} />
          <HighlightField label="Pendências" value={pendencias || '-'} />
          <HighlightField label="Data Liberada para Homologação" value={dataHomologacao || '-'} />
          <HighlightField 
            label="User Stories" 
            value={userStoriesCount > 0 ? `${userStoriesCount} ${userStoriesCount === 1 ? 'User Story' : 'User Stories'}` : '0'} 
          />
          <HighlightField 
            label="Tasks" 
            value={tasksCount > 0 ? `${tasksCount} ${tasksCount === 1 ? 'Task' : 'Tasks'}` : '0'} 
          />
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard label="PMO" value={pmoName} />
        <InfoCard
          label="Criado em"
          value={format(new Date(feature.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          subtitle={extractDisplayName(fields['System.CreatedBy']) || feature.created_by || ''}
        />
        <InfoCard
          label="Alterado em"
          value={format(new Date(feature.changed_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          subtitle={extractDisplayName(fields['System.ChangedBy']) || feature.changed_by || ''}
        />
      </div>

      {/* Status Report e Descrição de QA lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Report - Objetivo */}
        {objetivo && (
          <div className="glass dark:glass-dark p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <span>📝</span>
              <span>Status Report - Objetivo</span>
            </h2>
            <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {typeof objetivo === 'string' && (objetivo.includes('<') || objetivo.includes('>')) 
                ? htmlToJsx(objetivo) 
                : String(objetivo)}
            </div>
          </div>
        )}
        
        {/* Descrição de QA */}
        {descricaoQA && (
          <div className="glass dark:glass-dark p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <span>🔍</span>
              <span>Descrição de QA</span>
            </h2>
            <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {typeof descricaoQA === 'string' && (descricaoQA.includes('<') || descricaoQA.includes('>')) 
                ? htmlToJsx(descricaoQA) 
                : String(descricaoQA)}
            </div>
          </div>
        )}
      </div>

      {/* Outros campos do Status Report */}
      {Object.keys(outrosStatusReport).length > 0 && (
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
            <span>📋</span>
            <span>Outros Campos do Status Report</span>
          </h2>

          {/* Outros campos do Status Report em duas colunas */}
          {Object.keys(outrosStatusReport).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(outrosStatusReport).map(([label, value]) => (
                <div key={label} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {label}:
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {typeof value === 'string' && (value.includes('<') || value.includes('>')) 
                      ? htmlToJsx(value) 
                      : String(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Informações Gerais do Projeto */}
      {(() => {
        // Separar campos prioritários dos demais
        // Excluir Descrição de QA pois já está em card separado
        const camposFiltrados = Object.entries(customFields).filter(([label]) => 
          label.toLowerCase() !== 'descrição de qa' && 
          label.toLowerCase() !== 'descricao de qa'
        )
        
        const camposPrioritarios = camposFiltrados.filter(([label]) =>
          ORDEM_PRIORITARIA.some(prioritario => 
            label.toLowerCase().includes(prioritario.toLowerCase())
          )
        )
        const camposRestantes = camposFiltrados.filter(([label]) =>
          !ORDEM_PRIORITARIA.some(prioritario => 
            label.toLowerCase().includes(prioritario.toLowerCase())
          )
        ).sort(([a], [b]) => a.localeCompare(b))

        if (camposFiltrados.length === 0) return null

        return (
          <div className="glass dark:glass-dark p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <span>📋</span>
              <span>Informações Gerais do Projeto</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...camposPrioritarios, ...camposRestantes].map(([label, value]) => (
                <div key={label} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    • {label}:
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {typeof value === 'string' && (value.includes('<') || value.includes('>')) 
                      ? htmlToJsx(value) 
                      : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Descrição */}
      {feature.description && (
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">📝 Descrição</h2>
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {htmlToJsx(feature.description)}
          </div>
        </div>
      )}

      {/* Tags */}
      {feature.tags && feature.tags.length > 0 && (
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">🏷️ Tags</h2>
          <div className="flex flex-wrap gap-2">
            {feature.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Comentários */}
      <CommentsList featureId={feature.id} />

      {/* Todos os Campos (Colapsável) - Normalizados */}
      <div className="glass dark:glass-dark p-6 rounded-lg">
        <details className="cursor-pointer">
          <summary className="text-xl font-bold text-gray-800 dark:text-white mb-4 list-none flex items-center gap-2">
            <span>🔍</span>
            <span>Todos os Campos Normalizados ({Object.keys(allFields).length})</span>
          </summary>
          <div className="mt-4 space-y-4">
            {/* Campos System */}
            {Object.keys(systemFields).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Campos do Sistema</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(systemFields)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([label, value]) => (
                      <div key={label} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {typeof value === 'string' && (value.includes('<') || value.includes('>')) 
                            ? htmlToJsx(value) 
                            : String(value)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Campos Custom */}
            {Object.keys(customFields).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Campos Customizados</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(customFields)
                    .sort(([a], [b]) => {
                      // Campos prioritários primeiro
                      const aPriority = ORDEM_PRIORITARIA.some(p => a.toLowerCase().includes(p.toLowerCase()))
                      const bPriority = ORDEM_PRIORITARIA.some(p => b.toLowerCase().includes(p.toLowerCase()))
                      if (aPriority && !bPriority) return -1
                      if (!aPriority && bPriority) return 1
                      return a.localeCompare(b)
                    })
                    .map(([label, value]) => (
                      <div key={label} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                          {typeof value === 'string' && (value.includes('<') || value.includes('>')) 
                            ? htmlToJsx(value) 
                            : String(value)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </details>
      </div>

      {/* Campos Brutos (Colapsável) - Para debug */}
      <div className="glass dark:glass-dark p-6 rounded-lg">
        <details className="cursor-pointer">
          <summary className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 list-none flex items-center gap-2">
            <span>🔧</span>
            <span>Campos Brutos do Azure DevOps ({Object.keys(fields).length})</span>
          </summary>
          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(fields)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, value]) => (
                <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="text-xs font-mono text-gray-600 dark:text-gray-400">{key}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {typeof value === 'object' ? (
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </div>
                </div>
              ))}
          </div>
        </details>
      </div>
    </div>
  )
}

function InfoCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="glass dark:glass-dark p-4 rounded-lg hover-lift transition-all">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div className="font-semibold text-gray-800 dark:text-white">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )
}

function HighlightField({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-l-4 border-blue-500 pl-4 py-2">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">{String(value)}</div>
    </div>
  )
}

