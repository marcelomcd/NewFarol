#!/usr/bin/env node
/**
 * Teste: lista Tasks "flutuantes" no Azure DevOps
 * Tasks que NÃO estão vinculadas a nenhuma Feature ou User Story (sem parent).
 *
 * Uso: node tests/find-floating-tasks.test.js
 *      node tests/find-floating-tasks.test.js --output=floating-tasks-report.md
 *
 * Requer: backend/.env com AZDO_PAT, AZDO_ORG, AZDO_ROOT_PROJECT
 */
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import axios from 'axios';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../backend/.env') });

const org = process.env.AZDO_ORG || 'qualiit';
const project = process.env.AZDO_ROOT_PROJECT || 'Quali IT - Inovação e Tecnologia';
const pat = process.env.AZDO_PAT;
const apiVersion = process.env.AZDO_API_VERSION || '7.0';

const outArg = process.argv.find((a) => a.startsWith('--output='));
const outputFile = outArg ? outArg.split('=')[1] : null;

if (!pat?.trim()) {
  console.error('❌ AZDO_PAT não configurado. Configure no backend/.env');
  process.exit(1);
}

const baseUrl = `https://dev.azure.com/${org}`;
const client = axios.create({
  baseURL: baseUrl,
  headers: {
    Authorization: `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
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
  const res = await client.get(
    `${projectEncoded}/_apis/wit/workitems?api-version=${apiVersion}&ids=${ids.join(',')}&$expand=all`
  );
  return res.data.value || [];
}

function hasParentLink(relations) {
  if (!relations?.length) return false;
  for (const rel of relations) {
    const t = (rel.rel || '').toLowerCase();
    if (t.includes('hierarchy-reverse') || t.includes('parent')) return true;
  }
  return false;
}

function toMarkdown(floating) {
  const lines = [
    '# Tasks flutuantes (sem parent Feature/User Story)',
    '_Filtro: apenas status New e Active_',
    '',
    `**Data:** ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    `**Total:** ${floating.length} task(s)`,
    '',
    '| Task ID | Task Title | Estado |',
    '|---------|------------|--------|',
    ...floating.map(
      (t) =>
        `| ${t.id} | ${(t.title || '(sem título)').replace(/\|/g, '\\|')} | ${t.state || '-'} |`
    ),
    '',
  ];
  return lines.join('\n');
}

async function main() {
  console.log('🔍 Buscando Tasks flutuantes no Azure DevOps...\n');

  const wiql = `
    SELECT [System.Id], [System.Title], [System.State]
    FROM workitems
    WHERE [System.TeamProject] = '${project.replace(/'/g, "''")}'
    AND [System.WorkItemType] = 'Task'
  `.trim();

  const refs = await executeWiql(wiql);
  const ids = refs.map((r) => r.id);
  console.log(`   Total de Tasks: ${ids.length}`);

  const floating = [];
  const BATCH = 200;

  const allowedStates = ['New', 'Active'];
  for (let i = 0; i < ids.length; i += BATCH) {
    process.stdout.write(`   Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(ids.length / BATCH)}\r`);
    const items = await getWorkItemsBatch(ids.slice(i, i + BATCH));
    for (const wi of items) {
      const state = wi.fields?.['System.State'] || '';
      if (!hasParentLink(wi.relations) && allowedStates.includes(state)) {
        floating.push({
          id: wi.id,
          title: wi.fields?.['System.Title'] || '(sem título)',
          state,
        });
      }
    }
    if (i + BATCH < ids.length) await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n   Flutuantes: ${floating.length}\n`);

  const md = toMarkdown(floating);
  if (outputFile) {
    const path = resolve(process.cwd(), outputFile);
    fs.writeFileSync(path, md, 'utf8');
    console.log(`   Salvo em: ${path}\n`);
  } else {
    console.log(md);
  }
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
