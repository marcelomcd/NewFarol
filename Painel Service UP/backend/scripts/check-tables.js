import { getConnection } from '../db/connection.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkTables() {
  try {
    const connection = getConnection();
    
    console.log('🔍 Verificando estrutura das tabelas...\n');
    
    // Verificar estrutura da tabela bi_chamados_service_up
    console.log('📊 Estrutura de bi_chamados_service_up:');
    const [columns1] = await connection.query(`
      DESCRIBE dw_combio.bi_chamados_service_up
    `);
    console.table(columns1);
    
    // Verificar estrutura da tabela bi_chamados_satisfacao_service_up
    console.log('\n📊 Estrutura de bi_chamados_satisfacao_service_up:');
    const [columns2] = await connection.query(`
      DESCRIBE dw_combio.bi_chamados_satisfacao_service_up
    `);
    console.table(columns2);
    
    // Verificar alguns registros de exemplo
    console.log('\n📋 Exemplo de registros (5 primeiros):');
    const [samples] = await connection.query(`
      SELECT * FROM dw_combio.bi_chamados_service_up 
      LIMIT 5
    `);
    console.table(samples);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkTables();

