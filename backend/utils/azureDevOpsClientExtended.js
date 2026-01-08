/**
 * Cliente Azure DevOps estendido com métodos adicionais
 * Para funcionalidades que precisam de work items expandidos (relations, attachments, etc)
 */
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class AzureDevOpsClientExtended {
  constructor() {
    this.pat = process.env.AZDO_PAT;
    this.baseUrl = process.env.AZDO_BASE_URL || 'https://dev.azure.com/qualiit/';
    this.apiVersion = process.env.AZDO_API_VERSION || '7.0';

    if (!this.pat || !this.pat.trim()) {
      throw new Error('PAT (Personal Access Token) do Azure DevOps não configurado!');
    }

    const patEncoded = Buffer.from(`:${this.pat}`).toString('base64');
    this.headers = {
      'Authorization': `Basic ${patEncoded}`,
      'Content-Type': 'application/json',
    };

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: this.headers,
      timeout: 60000,
      maxRedirects: 0,
    });
  }

  _getUrl(endpoint) {
    return `${endpoint}?api-version=${this.apiVersion}`;
  }

  /**
   * Busca um work item específico com expand=all (inclui relations, etc)
   */
  async getWorkItem(workItemId, expand = 'all') {
    try {
      const endpoint = `_apis/wit/workitems/${workItemId}`;
      const url = this._getUrl(endpoint);
      const params = { $expand: expand };

      const response = await this.client.get(url, { params });

      if (response.status === 302 || response.status === 401) {
        throw new Error(`Erro de autenticação ao buscar work item ${workItemId}`);
      }

      if (response.status !== 200) {
        const errorDetail = response.data?.message || response.statusText;
        throw new Error(`Erro ao buscar work item (HTTP ${response.status}): ${errorDetail}`);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 302 || error.response.status === 401) {
          throw new Error(`Erro de autenticação ao buscar work item ${workItemId}`);
        }
        if (error.response.status === 429) {
          throw new Error('Rate limit do Azure DevOps atingido. Tente novamente em alguns segundos.');
        }
        const errorDetail = error.response.data?.message || error.response.statusText;
        throw new Error(`Erro ao buscar work item (HTTP ${error.response.status}): ${errorDetail}`);
      }
      throw error;
    }
  }

  /**
   * Busca work items por IDs com expand=all
   */
  async getWorkItems(workItemIds, expand = 'all') {
    if (!workItemIds || workItemIds.length === 0) {
      return [];
    }

    const MAX_BATCH = 200;
    const allItems = [];

    for (let i = 0; i < workItemIds.length; i += MAX_BATCH) {
      const batch = workItemIds.slice(i, i + MAX_BATCH);
      const idsStr = batch.join(',');
      const endpoint = '_apis/wit/workitems';
      const url = this._getUrl(endpoint);
      const params = { ids: idsStr, $expand: expand };

      try {
        const response = await this.client.get(url, { params });
        if (response.data && response.data.value) {
          allItems.push(...response.data.value);
        }

        // Delay entre batches
        if (i + MAX_BATCH < workItemIds.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        if (error.response?.status === 429) {
          // Retry após delay
          await new Promise(resolve => setTimeout(resolve, 5000));
          i -= MAX_BATCH; // Retry este batch
          continue;
        }
        throw error;
      }
    }

    return allItems;
  }

  /**
   * Busca relacionamentos (parent/child) de um work item
   */
  async getWorkItemRelations(workItemId) {
    const workItem = await this.getWorkItem(workItemId, 'all');
    const relations = workItem.relations || [];

    const parentIds = [];
    const childIds = [];

    for (const relation of relations) {
      const relType = relation.rel || '';
      const url = relation.url || '';

      if (url) {
        try {
          const wiId = parseInt(url.split('/workitems/')[1]?.split('?')[0]);
          if (isNaN(wiId)) continue;

          if (relType.includes('System.LinkTypes.Hierarchy-Reverse') || relType.toLowerCase().includes('parent')) {
            parentIds.push(wiId);
          } else if (relType.includes('System.LinkTypes.Hierarchy-Forward') || relType.toLowerCase().includes('child')) {
            childIds.push(wiId);
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Buscar detalhes dos work items relacionados
    const parentItems = parentIds.length > 0 ? await this.getWorkItems(parentIds) : [];
    const childItems = childIds.length > 0 ? await this.getWorkItems(childIds) : [];

    return {
      parent_ids: parentIds,
      child_ids: childIds,
      parents: parentItems.map(item => ({
        id: item.id,
        title: item.fields?.['System.Title'] || '',
        work_item_type: item.fields?.['System.WorkItemType'] || '',
        state: item.fields?.['System.State'] || '',
      })),
      children: childItems.map(item => ({
        id: item.id,
        title: item.fields?.['System.Title'] || '',
        work_item_type: item.fields?.['System.WorkItemType'] || '',
        state: item.fields?.['System.State'] || '',
      })),
    };
  }

  /**
   * Busca anexos de um work item
   */
  async getWorkItemAttachments(workItemId) {
    const workItem = await this.getWorkItem(workItemId, 'all');
    const relations = workItem.relations || [];

    const attachments = [];
    for (const relation of relations) {
      const relType = relation.rel || '';
      if (relType.includes('AttachedFile')) {
        attachments.push({
          url: relation.url || '',
          attributes: relation.attributes || {},
        });
      }
    }

    return attachments;
  }

  /**
   * Busca links relacionados de um work item
   */
  async getWorkItemLinks(workItemId) {
    const workItem = await this.getWorkItem(workItemId, 'all');
    const relations = workItem.relations || [];

    const links = [];
    for (const relation of relations) {
      const relType = relation.rel || '';
      const url = relation.url || '';
      const attributes = relation.attributes || {};

      // Filtrar apenas links (não hierarquia, não anexos)
      if (relType.includes('LinkTypes') && !relType.includes('Hierarchy') && !relType.includes('AttachedFile')) {
        links.push({
          type: relType,
          url: url,
          attributes: attributes,
        });
      }
    }

    return links;
  }

  /**
   * Busca revisões (histórico) de um work item
   */
  async getWorkItemRevisions(workItemId) {
    try {
      const endpoint = `_apis/wit/workitems/${workItemId}/revisions`;
      const url = this._getUrl(endpoint);

      const response = await this.client.get(url);

      if (response.status === 302 || response.status === 401) {
        throw new Error(`Erro de autenticação ao buscar revisões do work item ${workItemId}`);
      }

      if (response.status !== 200) {
        const errorDetail = response.data?.message || response.statusText;
        throw new Error(`Erro ao buscar revisões (HTTP ${response.status}): ${errorDetail}`);
      }

      return response.data.value || [];
    } catch (error) {
      if (error.response) {
        if (error.response.status === 302 || error.response.status === 401) {
          throw new Error(`Erro de autenticação ao buscar revisões do work item ${workItemId}`);
        }
        if (error.response.status === 429) {
          throw new Error('Rate limit do Azure DevOps atingido. Tente novamente em alguns segundos.');
        }
        const errorDetail = error.response.data?.message || error.response.statusText;
        throw new Error(`Erro ao buscar revisões (HTTP ${error.response.status}): ${errorDetail}`);
      }
      throw error;
    }
  }
}

export default AzureDevOpsClientExtended;
