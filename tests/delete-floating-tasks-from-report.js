#!/usr/bin/env node
/**
 * Deleta do Azure DevOps as Tasks listadas em floating-tasks-report.md
 * Usa destroy=true (exclusão permanente).
 *
 * Uso: node tests/delete-floating-tasks-from-report.js
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

if (!pat?.trim()) {
  console.error('❌ AZDO_PAT não configurado.');
  process.exit(1);
}

const reportPath = resolve(__dirname, '../floating-tasks-report.md');
if (!fs.existsSync(reportPath)) {
  console.error('❌ Arquivo floating-tasks-report.md não encontrado.');
  process.exit(1);
}

function parseIdsFromReport(content) {
  const ids = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const m = line.match(/^\|\s*(\d+)\s+\|/);
    if (m) ids.push(parseInt(m[1], 10));
  }
  return ids;
}

const client = axios.create({
  baseURL: `https://dev.azure.com/${org}`,
  headers: {
    Authorization: `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

async function deleteWorkItem(id) {
  const projectEncoded = encodeURIComponent(project);
  await client.delete(
    `${projectEncoded}/_apis/wit/workitems/${id}?api-version=${apiVersion}&destroy=true`
  );
}

async function main() {
  const content = fs.readFileSync(reportPath, 'utf8');
  const ids = parseIdsFromReport(content);

  if (ids.length === 0) {
    console.log('Nenhum ID encontrado no report.\n');
    return;
  }

  console.log(`\n🗑️  Deletando ${ids.length} task(s) do Azure DevOps...\n`);

  for (const id of ids) {
    try {
      await deleteWorkItem(id);
      console.log(`  ✅ Deletado: ${id}`);
    } catch (err) {
      console.error(`  ❌ Erro ${id}:`, err.response?.data?.message || err.message);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log('\n  Concluído.\n');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
