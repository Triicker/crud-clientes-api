require('dotenv').config();
const pool = require('../config/db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS interacoes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    usuario_responsavel VARCHAR(100),
    data_interacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const runMigration = async () => {
  try {
    await pool.query(createTableQuery);
    console.log('Tabela "interacoes" verificada/criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela "interacoes":', error);
  } finally {
    pool.end();
  }
};

runMigration();
