require('dotenv').config();
const { Pool } = require('pg');

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

async function checkDB() {
    try {
        // Verificar tabelas existentes
        console.log('🔍 Verificando tabelas...');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        console.log('📋 Tabelas encontradas:', tables.rows.map(r => r.table_name));
        
        // Verificar estrutura da tabela usuarios
        console.log('\n👤 Verificando estrutura usuarios...');
        const usuariosStructure = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' 
            ORDER BY ordinal_position
        `);
        console.log('🏗️ Colunas usuarios:', usuariosStructure.rows);
        
        // Verificar alguns dados usuarios
        const usuariosSample = await pool.query('SELECT id, nome, perfil_id FROM usuarios LIMIT 3');
        console.log('📊 Sample usuarios:', usuariosSample.rows);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

checkDB();