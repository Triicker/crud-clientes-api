const fs = require('fs');
const path = require('path');

// Usa a mesma configuração do config/db.js
const pool = require('./config/db');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migration: add_vendedor_responsavel_id');
    
    // Lê o arquivo SQL
    const sqlPath = path.join(__dirname, 'migrations', 'add_vendedor_responsavel_id.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executa a migration
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Migration executada com sucesso!');
    
    // Mostra o resultado da verificação
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_clientes,
        COUNT(vendedor_responsavel) as com_vendedor_nome,
        COUNT(vendedor_responsavel_id) as com_vendedor_id,
        COUNT(*) FILTER (WHERE vendedor_responsavel IS NOT NULL AND vendedor_responsavel_id IS NULL) as inconsistencias
      FROM clientes
    `);
    
    console.log('\n📊 Status da tabela clientes:');
    console.log(`   Total de clientes: ${result.rows[0].total_clientes}`);
    console.log(`   Com vendedor (nome): ${result.rows[0].com_vendedor_nome}`);
    console.log(`   Com vendedor (ID): ${result.rows[0].com_vendedor_id}`);
    console.log(`   Inconsistências: ${result.rows[0].inconsistencias}`);
    
    if (result.rows[0].inconsistencias > 0) {
      console.log('\n⚠️  Alguns clientes têm nome do vendedor mas não o ID');
      console.log('   Execute UPDATE manual se necessário');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao executar migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
