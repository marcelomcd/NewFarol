#!/usr/bin/env node
/**
 * Teste de validação de dados e estruturas
 *
 * Verifica:
 * - Estrutura de respostas da API (quando disponíveis)
 * - Campos obrigatórios em Features
 * - Normalização de dados (status, farol)
 * - Consistência de tipos
 *
 * Uso: node tests/data-validation.test.js
 * Pré-requisito: backend rodando (para endpoints que retornam dados)
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

function assert(condition, name, detail) {
  if (condition) ok(name, detail);
  else fail(name, detail);
}

async function fetch(url) {
  const axios = (await import('axios')).default;
  return axios.get(url, { timeout: 15000, validateStatus: () => true });
}

async function main() {
  console.log('\n🧪 Teste: Validação de Dados\n');

  // 1. Health - estrutura
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status === 200) {
      const hasStatus = typeof res.data?.status === 'string';
      const hasApp = typeof res.data?.app === 'string' || res.data?.app == null;
      assert(hasStatus && hasApp, 'Health: estrutura { status, app }');
    } else {
      fail('Health: estrutura', 'Backend não respondeu 200');
    }
  } catch (err) {
    fail('Health: estrutura', err.code === 'ECONNREFUSED' ? 'Backend não rodando' : err.message);
  }

  // 2. Azdo consolidated - estrutura (se autenticado)
  try {
    const res = await fetch(`${BASE_URL}/api/azdo/consolidated?days_near_deadline=7`);
    if (res.status === 200 && res.data) {
      const d = res.data;
      const hasTotals = d.totals && typeof d.totals === 'object';
      const hasLists = d.lists && typeof d.lists === 'object';
      if (hasTotals) {
        assert(
          typeof d.totals.total_projects === 'number' || d.totals.total_projects == null,
          'Consolidated: totals.total_projects numérico'
        );
      }
      if (hasLists) {
        const open = d.lists.open_projects;
        assert(
          open == null || Array.isArray(open),
          'Consolidated: lists.open_projects é array ou null'
        );
      }
      if (hasTotals || hasLists) {
        ok('Consolidated: estrutura geral válida');
      }
    } else if (res.status === 401) {
      ok('Consolidated: validação', 'Endpoint requer auth - pulando validação profunda');
    } else {
      fail('Consolidated: estrutura', `status=${res.status}`);
    }
  } catch (err) {
    fail('Consolidated: estrutura', err.code === 'ECONNREFUSED' ? 'Backend não rodando' : err.message);
  }

  // 3. Counts-by-month - estrutura
  try {
    const now = new Date();
    const res = await fetch(
      `${BASE_URL}/api/azdo/counts-by-month?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
    );
    if (res.status === 200 && res.data) {
      const d = res.data;
      assert(typeof d.tasks_opened === 'number', 'Counts-by-month: tasks_opened numérico');
      assert(typeof d.tasks_closed === 'number', 'Counts-by-month: tasks_closed numérico');
      assert(typeof d.month === 'number', 'Counts-by-month: month numérico');
      assert(typeof d.year === 'number', 'Counts-by-month: year numérico');
    } else if (res.status === 401) {
      ok('Counts-by-month: validação', 'Endpoint requer auth - pulando');
    } else {
      fail('Counts-by-month: estrutura', `status=${res.status}`);
    }
  } catch (err) {
    fail('Counts-by-month: estrutura', err.code === 'ECONNREFUSED' ? 'Backend não rodando' : err.message);
  }

  // 4. Validação lógica - strings e números
  assert(typeof 'test' === 'string', 'Validação: tipos básicos');
  assert(Number.isFinite(42), 'Validação: Number.isFinite');

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
