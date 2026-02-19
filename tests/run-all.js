#!/usr/bin/env node
/**
 * Executa todos os testes e exibe resumo.
 *
 * Uso: node tests/run-all.js
 *
 * Ordem de execução:
 * 1. azdo-connection  - conexão Azure DevOps (não precisa de backend)
 * 2. api-endpoints    - endpoints da API (requer backend rodando)
 * 3. data-validation  - validação de dados e estruturas
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tests = [
  { name: 'Azure DevOps Connection', file: 'azdo-connection.test.js' },
  { name: 'API Endpoints', file: 'api-endpoints.test.js' },
  { name: 'Data Validation', file: 'data-validation.test.js' },
];

async function runTest(file) {
  return new Promise((resolve) => {
    const scriptPath = resolve(__dirname, file);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true,
      cwd: resolve(__dirname, '..'),
      env: { ...process.env, FORCE_COLOR: '1' },
    });
    child.on('close', (code, signal) => resolve(signal ? 1 : (code ?? 0)));
  });
}

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  NewFarol - Execução de Testes');
  console.log('═══════════════════════════════════════════\n');

  const results = [];
  for (const t of tests) {
    console.log(`\n▶ ${t.name} (${t.file})\n`);
    const code = await runTest(t.file);
    results.push({ name: t.name, file: t.file, code });
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  Resumo Final');
  console.log('═══════════════════════════════════════════');
  for (const r of results) {
    const icon = r.code === 0 ? '✅' : '❌';
    console.log(`  ${icon} ${r.name}`);
  }
  const failed = results.filter((r) => r.code !== 0).length;
  console.log('\n' + (failed === 0 ? 'Todos os testes passaram.' : `${failed} teste(s) falharam.`) + '\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
