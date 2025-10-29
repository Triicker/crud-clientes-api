// Arquivo: controller/redeNumerosController.js

/**
 * Módulo de Controller para a tabela 'rede_numeros'.
 * Contém a lógica de acesso ao banco de dados (CRUD) para gerir os dados numéricos de uma rede/escola.
 */
const pool = require('../config/db');

// --- Funções CRUD ---

// 1. CREATE (Adicionar um novo número de rede/escola)
exports.createNumero = async (req, res) => {
  // Desestruturação dos campos. cliente_id, quantidade são cruciais.
  const { cliente_id, segmento, ano, quantidade, zona } = req.body;

  try {
    const query = `
      INSERT INTO rede_numeros (cliente_id, segmento, ano, quantidade, zona)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [cliente_id, segmento, ano, quantidade, zona];

    const result = await pool.query(query, values);

    res.status(201).json({
      mensagem: 'Número de rede/escola registado com sucesso!',
      registro: result.rows[0]
    });
  } catch (error) {
    // Erros podem incluir problemas de Foreign Key ou a 'quantidade' não ser um número
    console.error('Erro ao criar registro de rede_numeros:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao criar registro.' });
  }
};

// 2. READ ALL (Obter todos os registos de números de rede)
exports.getAllNumeros = async (req, res) => {
  try {
    // Usamos JOIN para incluir o nome do cliente
    const query = `
      SELECT rn.*, c.nome AS cliente_nome
      FROM rede_numeros rn
      JOIN clientes c ON rn.cliente_id = c.id
      ORDER BY c.nome, rn.ano DESC;
    `;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao obter registros de rede_numeros:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter registros.' });
  }
};

// 3. READ ONE (Obter um registo por ID)
exports.getNumeroById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT rn.*, c.nome AS cliente_nome
      FROM rede_numeros rn
      JOIN clientes c ON rn.cliente_id = c.id
      WHERE rn.id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Registro de rede_numeros não encontrado.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Erro ao obter registro com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter registro.' });
  }
};

// 4. UPDATE (Atualizar um registo)
exports.updateNumero = async (req, res) => {
  const { id } = req.params;
  const { cliente_id, segmento, ano, quantidade, zona } = req.body;

  try {
    const query = `
      UPDATE rede_numeros
      SET cliente_id = $1, segmento = $2, ano = $3, quantidade = $4, zona = $5
      WHERE id = $6
      RETURNING *;
    `;
    const values = [cliente_id, segmento, ano, quantidade, zona, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Registro não encontrado para atualização.' });
    }

    res.status(200).json({
      mensagem: 'Registro de rede/escola atualizado com sucesso!',
      registro: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao atualizar registro com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao atualizar registro.' });
  }
};

// 5. DELETE (Excluir um registo)
exports.deleteNumero = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM rede_numeros WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Registro não encontrado para exclusão.' });
    }

    res.status(200).json({ mensagem: 'Registro de rede/escola excluído com sucesso!' });
  } catch (error) {
    console.error(`Erro ao excluir registro com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao excluir registro.' });
  }
};