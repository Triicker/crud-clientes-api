// Arquivo: config/db.js

/**
 * Módulo para configuração da conexão com o PostgreSQL.
 * Utiliza o pool de conexões para gerir as conexões de forma eficiente.
 */
const { Pool } = require('pg');

// Configurações da tua base de dados.
// NOTA: Deves substituir 'tualocalhost', 'teuusuario', 'tuaSenha' e 'teuBancoDeDados' pelos teus dados reais.
// Em um projeto real, estas informações deveriam vir de variáveis de ambiente (.env) por questões de segurança.
const pool = new Pool({
  user: 'postgres',      // Substitui pelo teu usuário do PostgreSQL
  host: 'localhost',    // Geralmente 'localhost' ou o IP do servidor do DB
  database: 'etica_vendas', // O nome do teu banco de dados
  password: 'Jcchaos007@',    // A tua senha
  port: 5432,              // A porta padrão do PostgreSQL
});

// Testar a conexão (opcional, mas recomendado)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.stack);
  } else {
    console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso em:', res.rows[0].now);
  }
});

module.exports = pool;