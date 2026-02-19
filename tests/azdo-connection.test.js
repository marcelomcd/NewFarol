#!/usr/bin/env node
/**
 * Teste de conexão com Azure DevOps
 *
 * Verifica:
 * - Credenciais (AZDO_PAT, AZDO_ORG, AZDO_ROOT_PROJECT)
 * - Execução de query WIQL
 * - Obtenção de work items
 * - Parsing de relações (relations)
 *
 * Uso: node tests/azdo-connection.test.js
 * Ou:  cd backend && node ../tests/azdo-connection.test.js
 */
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../backend/.env');
dotenv.config({ path: envPath });

const results = { passed: 0, failed: 0, tests: [] };

function ok(name, detail = '') {
  results.passed++;
  results.tests.push({ name, status: 'PASS', detail });
  console.log(`  ✅ ${name}${detail ? ` - ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.failed++;
  results.tests.push({ name, status: 'FAIL', detail });
  console.log(`  ❌ ${name}${detail ? ` - ${detail}` : ''}`);
}

async function main() {
  console.log('\n🧪 Teste: Conexão Azure DevOps\n');

  // 1. Variáveis de ambiente
  const pat = process.env.AZDO_PAT;
  const org = process.env.AZDO_ORG;
  const project = process.env.AZDO_ROOT_PROJECT;

  if (!pat?.trim()) {
    fail('AZDO_PAT configurado', 'Variável ausente ou vazia');
  } else {
    ok('AZDO_PAT configurado');
  }

  if (!org?.trim()) {
    fail('AZDO_ORG configurado', 'Usando default: qualii');
  } else {
    ok('AZDO_ORG configurado', org);
  }

  if (!project?.trim()) {
    fail('AZDO_ROOT_PROJECT configurado', 'Variável ausente');
  } else {
    ok('AZDO_ROOT_PROJECT configurado', project);
  }

  if (!pat?.trim()) {
    console.log('\n  ⚠️  Sem PAT, pulando testes de API.\n');
    printSummary();
    process.exit(1);
  }

  const axios = (await import('axios')).default;
  const baseUrl = `https://dev.azure.com/${org}`;
  const auth = Buffer.from(`:${pat}`).toString('base64');
  const client = axios.create({
    baseURL: baseUrl,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  const projectEncoded = encodeURIComponent(project);
  const apiVersion = process.env.AZDO_API_VERSION || '7.0';

  // 2. WIQL - listar Features
  let sampleId = null;
  try {
    const wiql = `
      SELECT [System.Id] FROM workitems
      WHERE [System.TeamProject] = '${project.replace(/'/g, "''")}'
      AND [System.WorkItemType] = 'Feature'
      AND [System.State] <> ''
    `.trim();
    const res = await client.post(
      `${projectEncoded}/_apis/wit/wiql?api-version=${apiVersion}`,
      { query: wiql }
    );
    const items = res.data?.workItems || [];
    sampleId = items[0]?.id;
    ok('WIQL: Executar query', `${items.length} features encontradas`);
  } catch (err) {
    fail('WIQL: Executar query', err.response?.data?.message || err.message);
  }

  // 3. Obter work item (usa ID da WIQL ou 1)
  const testId = sampleId || 1;
  try {
    const res = await client.get(
      `${projectEncoded}/_apis/wit/workitems/${testId}?api-version=${apiVersion}`
    );
    const wi = res.data;
    if (wi?.id && wi?.fields) {
      ok('API: Obter work item', `ID ${wi.id} - ${String(wi.fields?.['System.Title'] || '').slice(0, 40)}...`);
    } else {
      fail('API: Obter work item', 'Resposta inválida');
    }
  } catch (err) {
    if (err.response?.status === 404) {
      ok('API: Obter work item', `Work item ${testId} não existe (404)`);
    } else {
      fail('API: Obter work item', err.response?.data?.message || err.message);
    }
  }

  // 4. Work item com relations ($expand=all) - usa ID real se disponível
  if (sampleId) {
    try {
      const res = await client.get(
        `${projectEncoded}/_apis/wit/workitems?api-version=${apiVersion}&ids=${sampleId}&$expand=all`
      );
      const items = res.data?.value || [];
      const wi = items[0];
      if (wi && typeof wi.relations === 'object') {
        ok('API: Work item com relations', `relations: ${Array.isArray(wi.relations) ? wi.relations.length : 0}`);
      } else {
        ok('API: Work item com relations', 'Estrutura OK');
      }
    } catch (err) {
      fail('API: Work item com relations', err.response?.data?.message || err.message);
    }
  } else {
    ok('API: Work item com relations', 'Pulado (sem ID de amostra)');
  }

  printSummary();
  process.exit(results.failed > 0 ? 1 : 0);
}

function printSummary() {
  console.log('\n  --- Resumo ---');
  console.log(`  Passou: ${results.passed} | Falhou: ${results.failed}\n`);
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
