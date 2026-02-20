/**
 * Utilitários para extração de campos de Features do Azure DevOps.
 *
 * Centraliza a lógica de normalização e extração de PMO, Responsável e TargetDate
 * a partir de raw_fields_json e campos normalizados.
 */
import type { Feature } from '../services/api'

/** Normaliza nome de cliente para comparação consistente. */
export function normalizeClientKey(value?: string | null): string {
  if (!value) return ''
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

/** Extrai PMO: campo pmo, Custom.PMO, AssignedTo ou assigned_to. */
export function extractPMO(item: Feature): string {
  if (item.pmo && item.pmo.trim() !== '') return item.pmo.trim()

  const raw = (item as { raw_fields_json?: Record<string, unknown> }).raw_fields_json
  if (raw) {
    const customPMO = raw['Custom.PMO'] || raw['Custom.Pmo']
    if (customPMO) {
      if (typeof customPMO === 'object' && (customPMO as { displayName?: string }).displayName?.trim()) {
        return (customPMO as { displayName: string }).displayName.trim()
      }
      if (typeof customPMO === 'string' && customPMO.trim() !== '') return customPMO.trim()
    }

    const assignedTo = raw['System.AssignedTo']
    if (assignedTo && typeof assignedTo === 'object' && (assignedTo as { displayName?: string }).displayName?.trim()) {
      return (assignedTo as { displayName: string }).displayName.trim()
    }
    if (typeof assignedTo === 'string' && assignedTo.trim() !== '') return assignedTo.trim()
  }

  const assigned = (item as { assigned_to?: string }).assigned_to
  if (assigned && typeof assigned === 'string' && assigned.trim() !== '') return assigned.trim()

  return 'Não atribuído'
}

/** Extrai Responsável Cliente. */
export function extractResponsavelCliente(item: Feature): string {
  const direct = (item as { responsible?: string }).responsible
  if (direct && typeof direct === 'string' && direct.trim() !== '') return direct.trim()

  const raw = (item as { raw_fields_json?: Record<string, unknown> }).raw_fields_json
  if (raw) {
    const rc = raw['Custom.ResponsavelCliente']
    if (rc) {
      if (typeof rc === 'object' && (rc as { displayName?: string }).displayName?.trim()) {
        return (rc as { displayName: string }).displayName.trim()
      }
      if (typeof rc === 'string' && rc.trim() !== '') return rc.trim()
    }
  }
  return 'Não atribuído'
}

/** Extrai TargetDate como Date ou null. */
export function getTargetDate(item: Feature): Date | null {
  const direct = (item as { target_date?: string }).target_date
  const raw = (item as { raw_fields_json?: Record<string, unknown> }).raw_fields_json
  const rawDate = raw ? (raw['Microsoft.VSTS.Scheduling.TargetDate'] as string | undefined) : null
  const val = direct || rawDate
  if (!val) return null
  try {
    const d = new Date(val)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}
