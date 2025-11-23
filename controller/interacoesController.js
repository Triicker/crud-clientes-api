// Arquivo: controller/interacoesController.js

const pool = require('../config/db');

// 1. CREATE (Adicionar uma nova interação)
exports.createInteracao = async (req, res) => {
  const { cliente_id, tipo, descricao, usuario_responsavel } = req.body;

  try {
    const query = `
      INSERT INTO interacoes (cliente_id, tipo, descricao, usuario_responsavel)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [cliente_id, tipo, descricao, usuario_responsavel];

    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar interação:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao criar interação.' });
  }
};

// 2. READ ALL BY CLIENT (Obter todas as interações de um cliente)
exports.getInteracoesByCliente = async (req, res) => {
  const { clienteId } = req.params;

  try {
    const query = `
      SELECT * FROM interacoes
      WHERE cliente_id = $1
      ORDER BY data_interacao DESC;
    `;
    const result = await pool.query(query, [clienteId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(`Erro ao obter interações do cliente ${clienteId}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter interações.' });
  }
};

// 3. DELETE (Excluir uma interação)
exports.deleteInteracao = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM interacoes WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Interação não encontrada.' });
    }

    res.status(200).json({ mensagem: 'Interação excluída com sucesso!' });
  } catch (error) {
    console.error(`Erro ao excluir interação ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao excluir interação.' });
  }
};
