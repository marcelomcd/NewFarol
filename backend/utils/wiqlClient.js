/**
 * Cliente especializado para execução de queries WIQL no Azure DevOps
 * Convertido do Python para Node.js
 */
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MAX_WORK_ITEMS_PER_BATCH = 200;

export class WIQLClient {
  constructor(pat = null) {
    this.pat = pat || process.env.AZDO_PAT;
    this.org = process.env.AZDO_ORG || 'qualiit';
    this.baseUrl = process.env.AZDO_BASE_URL || 'https://dev.azure.com/qualiit/';
    this.apiVersion = process.env.AZDO_API_VERSION || '7.0';

    if (!this.pat || !this.pat.trim()) {
      throw new Error(
        'PAT (Personal Access Token) do Azure DevOps não configurado!\n' +
        'Configure a variável de ambiente AZDO_PAT.'
      );
    }

    // Criar header de autenticação (Basic Auth com usuário vazio)
    const patEncoded = Buffer.from(`:${this.pat}`).toString('base64');
    this.headers = {
      'Authorization': `Basic ${patEncoded}`,
      'Content-Type': 'application/json',
    };

    // Cliente Axios configurado
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: this.headers,
      timeout: 30000, // 30 segundos
      maxRedirects: 0, // Não seguir redirects automaticamente
    });
  }

  _getUrl(endpoint) {
    return `${endpoint}?api-version=${this.apiVersion}`;
  }

  /**
   * Executa uma query WIQL e retorna os work item references
   */
  async executeWiql(projectName, query) {
    const projectEncoded = encodeURIComponent(projectName);
    const endpoint = `${projectEncoded}/_apis/wit/wiql`;
    const url = this._getUrl(endpoint);
    const payload = { query };

    console.log(`[WIQLClient] 🔍 Executando WIQL no projeto ${projectName}`);

    try {
      const response = await this.client.post(url, payload);

      if (response.status === 302 || response.status === 401) {
        const errorMsg = `Erro de autenticação ao executar WIQL no projeto ${projectName}. Verifique se o PAT está correto e tem permissões necessárias.`;
        console.error(`[WIQLClient] ❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      if (response.status !== 200) {
        const errorDetail = response.data?.message || response.statusText || 'Erro desconhecido';
        const errorMsg = `Erro ao executar WIQL (HTTP ${response.status}): ${errorDetail}\nQuery: ${query.substring(0, 200)}`;
        console.error(`[WIQLClient] ❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      const result = response.data;
      const workItems = result.workItems || [];

      console.log(
        `[WIQLClient] ✅ WIQL executada com sucesso. ${workItems.length} work items encontrados.`
      );

      return result;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 302 || error.response.status === 401) {
          throw new Error(`Erro de autenticação ao executar WIQL no projeto ${projectName}`);
        }
        const errorDetail = error.response.data?.message || error.response.statusText;
        throw new Error(`Erro ao executar WIQL (HTTP ${error.response.status}): ${errorDetail}`);
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Timeout ao executar WIQL no projeto ${projectName}`);
      }
      throw new Error(`Erro de conexão ao executar WIQL: ${error.message}`);
    }
  }

  /**
   * Obtém work items por IDs, tratando paginação automaticamente
   */
  async getWorkItems(workItemIds, fields = null) {
    if (!workItemIds || workItemIds.length === 0) {
      return [];
    }

    const allItems = [];
    const totalBatches = Math.ceil(workItemIds.length / MAX_WORK_ITEMS_PER_BATCH);

    console.log(
      `[WIQLClient] 🔍 Obtendo ${workItemIds.length} work items ` +
      `(serão necessárias ${totalBatches} chamadas devido ao limite de ${MAX_WORK_ITEMS_PER_BATCH} por batch)`
    );

    for (let i = 0; i < workItemIds.length; i += MAX_WORK_ITEMS_PER_BATCH) {
      const batch = workItemIds.slice(i, i + MAX_WORK_ITEMS_PER_BATCH);
      const batchNum = Math.floor(i / MAX_WORK_ITEMS_PER_BATCH) + 1;

      console.log(
        `[WIQLClient] 📦 Batch ${batchNum}/${totalBatches}: ` +
        `obtendo ${batch.length} work items (IDs: ${batch.slice(0, 5).join(', ')}...)`
      );

      const batchItems = await this._getWorkItemsBatch(batch, fields);
      allItems.push(...batchItems);

      console.log(
        `[WIQLClient] ✅ Batch ${batchNum} concluído: ${batchItems.length} work items obtidos`
      );

      // Delay entre batches para evitar rate limit (exceto no último batch)
      if (i + MAX_WORK_ITEMS_PER_BATCH < workItemIds.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(
      `[WIQLClient] ✅ Total obtido: ${allItems.length} work items de ${workItemIds.length} IDs solicitados`
    );

    if (allItems.length !== workItemIds.length) {
      console.warn(
        `[WIQLClient] ⚠️ Discrepância: ${workItemIds.length} IDs solicitados, ${allItems.length} work items retornados`
      );
    }

    return allItems;
  }

  /**
   * Obtém um lote de work items (máximo 200)
   */
  async _getWorkItemsBatch(workItemIds, fields = null) {
    const idsStr = workItemIds.join(',');
    const endpoint = '_apis/wit/workitems';
    let url = this._getUrl(endpoint);

    // Importante: Azure DevOps NÃO permite usar $expand junto com fields
    const params = new URLSearchParams();
    params.append('ids', idsStr);
    if (fields && fields.length > 0) {
      params.append('fields', fields.join(','));
    } else {
      params.append('$expand', 'all');
    }

    url += `&${params.toString()}`;

    console.log(`[WIQLClient] 📡 GET workitems: ${workItemIds.length} IDs`);

    try {
      const response = await this.client.get(url);

      if (response.status === 302 || response.status === 401) {
        throw new Error('Erro de autenticação ao obter work items.');
      }

      if (response.status !== 200) {
        const errorDetail = response.data?.message || response.statusText;
        throw new Error(`Erro ao obter work items (HTTP ${response.status}): ${errorDetail}`);
      }

      const items = response.data.value || [];

      console.log(
        `[WIQLClient] ✅ Batch retornou ${items.length} work items (esperado: ${workItemIds.length})`
      );

      return items;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 302 || error.response.status === 401) {
          throw new Error('Erro de autenticação ao obter work items.');
        }
        const errorDetail = error.response.data?.message || error.response.statusText;
        throw new Error(`Erro ao obter work items (HTTP ${error.response.status}): ${errorDetail}`);
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout ao obter work items');
      }
      throw new Error(`Erro de conexão ao obter work items: ${error.message}`);
    }
  }
}

export default WIQLClient;
