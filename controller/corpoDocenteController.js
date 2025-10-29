// Arquivo: controller/corpoDocenteController.js

/**
 * Módulo de Controller para a tabela 'corpo_docente'.
 * Contém a lógica de acesso ao banco de dados (CRUD) para gerir o corpo docente.
 */
const pool = require('../config/db');

// --- Funções CRUD ---

// 1. CREATE (Adicionar um novo membro ao corpo docente)
exports.createDocente = async (req, res) => {
  // Desestruturação dos campos, incluindo o cliente_id
  const { cliente_id, funcao, nome, zap, email, escola } = req.body;

  try {
    const query = `
      INSERT INTO corpo_docente (cliente_id, funcao, nome, zap, email, escola)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [cliente_id, funcao, nome, zap, email, escola];

    const result = await pool.query(query, values);

    res.status(201).json({
      mensagem: 'Membro do corpo docente criado com sucesso!',
      docente: result.rows[0]
    });
  } catch (error) {
    // Erros de Foreign Key ou outros
    console.error('Erro ao criar membro do corpo docente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao criar docente.' });
  }
};

// 2. READ ALL (Obter todos os membros do corpo docente)
exports.getAllDocentes = async (req, res) => {
  try {
    // Usamos JOIN para incluir o nome do cliente associado
    const query = `
      SELECT cd.*, c.nome AS cliente_nome
      FROM corpo_docente cd
      JOIN clientes c ON cd.cliente_id = c.id
      ORDER BY c.nome, cd.nome ASC;
    `;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao obter corpo docente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter docentes.' });
  }
};

// 3. READ ONE (Obter um docente por ID)
exports.getDocenteById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT cd.*, c.nome AS cliente_nome
      FROM corpo_docente cd
      JOIN clientes c ON cd.cliente_id = c.id
      WHERE cd.id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Membro do corpo docente não encontrado.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Erro ao obter docente com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter docente.' });
  }
};

// 4. UPDATE (Atualizar um docente)
exports.updateDocente = async (req, res) => {
  const { id } = req.params;
  const { cliente_id, funcao, nome, zap, email, escola } = req.body;

  try {
    const query = `
      UPDATE corpo_docente
      SET cliente_id = $1, funcao = $2, nome = $3, zap = $4, email = $5, escola = $6
      WHERE id = $7
      RETURNING *;
    `;
    const values = [cliente_id, funcao, nome, zap, email, escola, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Membro do corpo docente não encontrado para atualização.' });
    }

    res.status(200).json({
      mensagem: 'Membro do corpo docente atualizado com sucesso!',
      docente: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao atualizar docente com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao atualizar docente.' });
  }
};

// 5. DELETE (Excluir um docente)
exports.deleteDocente = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM corpo_docente WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Membro do corpo docente não encontrado para exclusão.' });
    }

    res.status(200).json({ mensagem: 'Membro do corpo docente excluído com sucesso!' });
  } catch (error) {
    console.error(`Erro ao excluir docente com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao excluir docente.' });
  }
};