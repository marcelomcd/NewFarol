#!/usr/bin/env node
/**
 * Script para encontrar Tasks "flutuantes" no Azure DevOps:
 * Tasks que NÃO estão vinculadas a nenhuma Feature ou User Story (sem parent).
 * Provavelmente foram criadas de forma incorreta.
 *
 * Uso: node backend/scripts/find-floating-tasks.js
 * Ou:  cd backend && node scripts/find-floating-tasks.js
 *
 * Requer: .env com AZDO_PAT, AZDO_ORG, AZDO_ROOT_PROJECT
 */
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import axios from 'axios';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregar .env do backend
const envPath = resolve(__dirname, '../.env');
try {
  const dotenv = await import('dotenv');
  dotenv.config({ path: envPath });
} catch (e) {
  // dotenv já carregado ou .env no cwd
}

const org = process.env.AZDO_ORG || 'qualiit';
const project = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
const pat = process.env.AZDO_PAT;
const apiVersion = process.env.AZDO_API_VERSION || '7.0';

if (!pat?.trim()) {
  console.error('❌ AZDO_PAT não configurado. Configure no .env do backend.');
  process.exit(1);
}

const baseUrl = `https://dev.azure.com/${org}`;
const auth = Buffer.from(`:${pat}`).toString('base64');
const client = axios.create({
  baseURL: baseUrl,
  headers: {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

async function executeWiql(query) {
  const projectEncoded = encodeURIComponent(project);
  const res = await client.post(
    `${projectEncoded}/_apis/wit/wiql?api-version=${apiVersion}`,
    { query }
  );
  return res.data.workItems || [];
}

async function getWorkItemsBatch(ids) {
  if (!ids.length) return [];
  const projectEncoded = encodeURIComponent(project);
  const idsStr = ids.join(',');
  const res = await client.get(
    `${projectEncoded}/_apis/wit/workitems?api-version=${apiVersion}&ids=${idsStr}&$expand=all`
  );
  return res.data.value || [];
}

function hasParentLink(relations) {
  if (!relations || relations.length === 0) return false;
  for (const rel of relations) {
    const relType = (rel.rel || '').toLowerCase();
    if (relType.includes('hierarchy-reverse') || relType.includes('parent')) {
      return true;
    }
  }
  return false;
}

async function main() {
  console.log('🔍 Buscando Tasks no Azure DevOps...\n');

  const wiqlTasks = `
    SELECT [System.Id], [System.Title], [System.State]
    FROM workitems
    WHERE [System.TeamProject] = '${project.replace(/'/g, "''")}'
    AND [System.WorkItemType] = 'Task'
  `.trim();

  const refs = await executeWiql(wiqlTasks);
  console.log(`   Total de Tasks encontradas: ${refs.length}\n`);

  if (refs.length === 0) {
    console.log('   Nenhuma Task no projeto.\n');
    return;
  }

  const floating = [];
  const BATCH = 200;
  const ids = refs.map((r) => r.id);

  for (let i = 0; i < ids.length; i += BATCH) {
    const batchIds = ids.slice(i, i + BATCH);
    process.stdout.write(`   Verificando batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(ids.length / BATCH)}...\r`);
    try {
      const items = await getWorkItemsBatch(batchIds);
      for (const wi of items) {
        const relations = wi.relations || [];
        if (!hasParentLink(relations)) {
          floating.push({
            id: wi.id,
            title: wi.fields?.['System.Title'] || '(sem título)',
            state: wi.fields?.['System.State'] || '',
            webUrl: wi._links?.html?.href || `https://dev.azure.com/${org}/${encodeURIComponent(project)}/_workitems/edit/${wi.id}`,
          });
        }
      }
    } catch (err) {
      console.warn(`\n   ⚠ Erro no batch:`, err.message);
    }
    if (i + BATCH < ids.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`\n\n📋 Resultado: ${floating.length} Task(s) flutuante(s) (sem parent Feature/User Story)\n`);

  if (floating.length === 0) {
    console.log('   Todas as Tasks estão vinculadas corretamente.\n');
    return;
  }

  console.log('   ID    | Estado      | Título');
  console.log('   ------|-------------|----------------------------------------');
  for (const t of floating) {
    const title = (t.title || '').slice(0, 45).padEnd(45);
    console.log(`   ${String(t.id).padEnd(6)}| ${(t.state || '').padEnd(11)}| ${title}`);
    console.log(`         URL: ${t.webUrl}`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
