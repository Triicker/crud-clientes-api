// Arquivo: controller/equipePedagogicaController.js

/**
 * Módulo de Controller para a tabela 'equipe_pedagogica'.
 * Contém a lógica de acesso ao banco de dados (CRUD) para gerir a equipa pedagógica.
 */
const pool = require('../config/db');

// --- Funções CRUD ---

// 1. CREATE (Adicionar um novo membro à equipe pedagógica)
exports.createMembro = async (req, res) => {
  // O cliente_id é crucial para ligar o membro à escola/rede
  const { cliente_id, funcao, nome, zap, email, rede_social } = req.body;

  try {
    const query = `
      INSERT INTO equipe_pedagogica (cliente_id, funcao, nome, zap, email, rede_social)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [cliente_id, funcao, nome, zap, email, rede_social];

    const result = await pool.query(query, values);

    res.status(201).json({
      mensagem: 'Membro da equipe pedagógica criado com sucesso!',
      membro: result.rows[0]
    });
  } catch (error) {
    // Erros aqui podem incluir a não existência do cliente_id (Foreign Key violation)
    console.error('Erro ao criar membro da equipe pedagógica:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao criar membro.' });
  }
};

// 2. READ ALL (Obter todos os membros)
exports.getAllMembros = async (req, res) => {
  try {
    // Adicionei um JOIN para mostrar o nome do cliente associado
    const query = `
      SELECT ep.*, c.nome AS cliente_nome
      FROM equipe_pedagogica ep
      JOIN clientes c ON ep.cliente_id = c.id
      ORDER BY c.nome, ep.nome ASC;
    `;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao obter membros da equipe pedagógica:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter membros.' });
  }
};

// 3. READ ONE (Obter um membro por ID)
exports.getMembroById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT ep.*, c.nome AS cliente_nome
      FROM equipe_pedagogica ep
      JOIN clientes c ON ep.cliente_id = c.id
      WHERE ep.id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Membro da equipe pedagógica não encontrado.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Erro ao obter membro com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter membro.' });
  }
};

// 4. UPDATE (Atualizar um membro)
exports.updateMembro = async (req, res) => {
  const { id } = req.params;
  const { cliente_id, funcao, nome, zap, email, rede_social } = req.body;

  try {
    const query = `
      UPDATE equipe_pedagogica
      SET cliente_id = $1, funcao = $2, nome = $3, zap = $4, email = $5, rede_social = $6
      WHERE id = $7
      RETURNING *;
    `;
    const values = [cliente_id, funcao, nome, zap, email, rede_social, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Membro não encontrado para atualização.' });
    }

    res.status(200).json({
      mensagem: 'Membro da equipe pedagógica atualizado com sucesso!',
      membro: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao atualizar membro com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao atualizar membro.' });
  }
};

// 5. DELETE (Excluir um membro)
exports.deleteMembro = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM equipe_pedagogica WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Membro não encontrado para exclusão.' });
    }

    res.status(200).json({ mensagem: 'Membro da equipe pedagógica excluído com sucesso!' });
  } catch (error) {
    console.error(`Erro ao excluir membro com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao excluir membro.' });
  }
};