// Arquivo: config/db.js

/**
 * Módulo para configuração da conexão com o PostgreSQL.
 * Utiliza o pool de conexões para gerir as conexões de forma eficiente.
 */
const { Pool } = require('pg');

// Permite configuração via DATABASE_URL (preferível em produção) ou variáveis individuais.
// Em provedores como Render, defina DATABASE_URL e (se necessário) SSL=true.
let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    // Alguns provedores exigem SSL. Respeita flags comuns.
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

// Testar a conexão (opcional, mas recomendado)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.stack);
  } else {
    console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso em:', res.rows[0].now);
  }
});

module.exports = pool;