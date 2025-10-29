// Arquivo: controller/propostasController.js

/**
 * Módulo de Controller para a tabela 'propostas'.
 * Contém a lógica de acesso ao banco de dados (CRUD) para gerir as propostas comerciais.
 */
const pool = require('../config/db');

// --- Funções CRUD ---

// 1. CREATE (Adicionar uma nova proposta)
exports.createProposta = async (req, res) => {
  // cliente_id, nome, valor (DECIMAL), enviada (BOOLEAN)
  const { cliente_id, nome, valor, enviada } = req.body;

  try {
    const query = `
      INSERT INTO propostas (cliente_id, nome, valor, enviada)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    // O pg-node converte automaticamente valores booleanos (true/false) JS
    // para o tipo BOOLEAN do PostgreSQL.
    const values = [cliente_id, nome, valor, enviada];

    const result = await pool.query(query, values);

    res.status(201).json({
      mensagem: 'Proposta criada com sucesso!',
      proposta: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar proposta:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao criar proposta.' });
  }
};

// 2. READ ALL (Obter todas as propostas, com o nome do cliente)
exports.getAllPropostas = async (req, res) => {
  try {
    const query = `
      SELECT p.*, c.nome AS cliente_nome
      FROM propostas p
      JOIN clientes c ON p.cliente_id = c.id
      ORDER BY c.nome, p.id DESC;
    `;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao obter propostas:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter propostas.' });
  }
};

// 3. READ ONE (Obter uma proposta por ID)
exports.getPropostaById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT p.*, c.nome AS cliente_nome
      FROM propostas p
      JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Proposta não encontrada.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Erro ao obter proposta com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter proposta.' });
  }
};

// 4. UPDATE (Atualizar uma proposta)
exports.updateProposta = async (req, res) => {
  const { id } = req.params;
  const { cliente_id, nome, valor, enviada } = req.body;

  try {
    const query = `
      UPDATE propostas
      SET cliente_id = $1, nome = $2, valor = $3, enviada = $4
      WHERE id = $5
      RETURNING *;
    `;
    const values = [cliente_id, nome, valor, enviada, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Proposta não encontrada para atualização.' });
    }

    res.status(200).json({
      mensagem: 'Proposta atualizada com sucesso!',
      proposta: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao atualizar proposta com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao atualizar proposta.' });
  }
};

// 5. DELETE (Excluir uma proposta)
exports.deleteProposta = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM propostas WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Proposta não encontrada para exclusão.' });
    }

    res.status(200).json({ mensagem: 'Proposta excluída com sucesso!' });
  } catch (error) {
    console.error(`Erro ao excluir proposta com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao excluir proposta.' });
  }
};