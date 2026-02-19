#!/usr/bin/env node
/**
 * Teste dos endpoints da API (backend)
 *
 * Requer backend rodando em http://localhost:8000 (ou PORT do .env)
 * Verifica: health, API raiz, features, azdo consolidated
 *
 * Uso: node tests/api-endpoints.test.js
 * Pré-requisito: npm run dev ou npm start no backend
 */
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../backend/.env') });

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
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

async function fetch(url, options = {}) {
  const axios = (await import('axios')).default;
  return axios.get(url, { ...options, timeout: 15000, validateStatus: () => true });
}

async function main() {
  console.log(`\n🧪 Teste: API Endpoints (${BASE_URL})\n`);

  // 1. Health
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status === 200 && res.data?.status === 'healthy') {
      ok('GET /health', res.data.status);
    } else {
      fail('GET /health', `status=${res.status} ou resposta inválida`);
    }
  } catch (err) {
    fail('GET /health', err.code === 'ECONNREFUSED' ? 'Backend não está rodando' : err.message);
  }

  // 2. API raiz
  try {
    const res = await fetch(`${BASE_URL}/api`);
    if (res.status === 200 && res.data?.endpoints) {
      ok('GET /api', 'Endpoints disponíveis');
    } else {
      fail('GET /api', `status=${res.status}`);
    }
  } catch (err) {
    fail('GET /api', err.code === 'ECONNREFUSED' ? 'Backend não está rodando' : err.message);
  }

  // 3. Features (pode exigir auth - 401 é esperado)
  try {
    const res = await fetch(`${BASE_URL}/api/features`, { params: { limit: 5 } });
    if (res.status === 200) {
      const items = res.data?.items ?? [];
      ok('GET /api/features', `${items.length} itens (ou paginado)`);
    } else if (res.status === 401) {
      ok('GET /api/features', '401 - requer autenticação (esperado)');
    } else {
      fail('GET /api/features', `status=${res.status}`);
    }
  } catch (err) {
    fail('GET /api/features', err.code === 'ECONNREFUSED' ? 'Backend não está rodando' : err.message);
  }

  // 4. Azdo consolidated
  try {
    const res = await fetch(`${BASE_URL}/api/azdo/consolidated`, {
      params: { days_near_deadline: 7 },
    });
    if (res.status === 200 && (res.data?.totals || res.data?.lists)) {
      ok('GET /api/azdo/consolidated', 'Dados retornados');
    } else if (res.status === 401) {
      ok('GET /api/azdo/consolidated', '401 - requer autenticação (esperado)');
    } else {
      fail('GET /api/azdo/consolidated', `status=${res.status}`);
    }
  } catch (err) {
    fail('GET /api/azdo/consolidated', err.code === 'ECONNREFUSED' ? 'Backend não está rodando' : err.message);
  }

  // 5. Counts by month
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  try {
    const res = await fetch(`${BASE_URL}/api/azdo/counts-by-month`, {
      params: { month, year },
    });
    if (res.status === 200 && typeof res.data?.tasks_opened === 'number') {
      ok('GET /api/azdo/counts-by-month', `tasks_opened=${res.data.tasks_opened}`);
    } else if (res.status === 401) {
      ok('GET /api/azdo/counts-by-month', '401 - requer autenticação (esperado)');
    } else {
      fail('GET /api/azdo/counts-by-month', `status=${res.status}`);
    }
  } catch (err) {
    fail('GET /api/azdo/counts-by-month', err.code === 'ECONNREFUSED' ? 'Backend não está rodando' : err.message);
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
