const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Usa a mesma lógica de configuração do db.js
let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' || process.env.SSL === 'true' || process.env.RENDER === 'true'
      ? { rejectUnauthorized: false }
      : false,
  };
} else {
  poolConfig = {
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'etica_vendas',
    password: process.env.PGPASSWORD || 'postgres',
    port: Number(process.env.PGPORT || 5432),
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  };
}

const pool = new Pool(poolConfig);

async function runMigration() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Executando migration: create_historico_tarefas.sql');
        
        const migrationPath = path.join(__dirname, 'create_historico_tarefas.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        await client.query('BEGIN');
        await client.query(migrationSQL);
        await client.query('COMMIT');
        
        console.log('✅ Migration executada com sucesso!');
        console.log('📊 Tabela historico_tarefas criada');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao executar migration:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(console.error);
