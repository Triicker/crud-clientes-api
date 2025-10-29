// Arquivo: controller/influenciadoresController.js

/**
 * Módulo de Controller para a tabela 'influenciadores'.
 * Contém a lógica de acesso ao banco de dados (CRUD) para gerir os influenciadores associados a um diagnóstico.
 */
const pool = require('../config/db');

// --- Funções CRUD ---

// 1. CREATE (Adicionar um novo influenciador)
exports.createInfluenciador = async (req, res) => {
  // diagnostico_id (FOREIGN KEY), nome, contato
  const { diagnostico_id, nome, contato } = req.body;

  try {
    const query = `
      INSERT INTO influenciadores (diagnostico_id, nome, contato)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [diagnostico_id, nome, contato];

    const result = await pool.query(query, values);

    res.status(201).json({
      mensagem: 'Influenciador criado com sucesso!',
      influenciador: result.rows[0]
    });
  } catch (error) {
    // Erros aqui podem incluir a não existência do diagnostico_id (Foreign Key violation)
    console.error('Erro ao criar influenciador:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao criar influenciador.' });
  }
};

// 2. READ ALL (Obter todos os influenciadores, com o ID do diagnóstico)
exports.getAllInfluenciadores = async (req, res) => {
  try {
    // Nesta query, mostramos o nome do cliente associado ao diagnóstico para enriquecer os dados
    const query = `
      SELECT 
        i.*, 
        d.cliente_id, 
        c.nome AS cliente_nome 
      FROM influenciadores i
      JOIN diagnostico d ON i.diagnostico_id = d.id
      JOIN clientes c ON d.cliente_id = c.id
      ORDER BY c.nome, i.nome ASC;
    `;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao obter influenciadores:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter influenciadores.' });
  }
};

// 3. READ ONE (Obter um influenciador por ID)
exports.getInfluenciadorById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        i.*, 
        d.cliente_id, 
        c.nome AS cliente_nome 
      FROM influenciadores i
      JOIN diagnostico d ON i.diagnostico_id = d.id
      JOIN clientes c ON d.cliente_id = c.id
      WHERE i.id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Influenciador não encontrado.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Erro ao obter influenciador com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter influenciador.' });
  }
};

// 4. UPDATE (Atualizar um influenciador)
exports.updateInfluenciador = async (req, res) => {
  const { id } = req.params;
  const { diagnostico_id, nome, contato } = req.body;

  try {
    const query = `
      UPDATE influenciadores
      SET diagnostico_id = $1, nome = $2, contato = $3
      WHERE id = $4
      RETURNING *;
    `;
    const values = [diagnostico_id, nome, contato, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Influenciador não encontrado para atualização.' });
    }

    res.status(200).json({
      mensagem: 'Influenciador atualizado com sucesso!',
      influenciador: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao atualizar influenciador com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao atualizar influenciador.' });
  }
};

// 5. DELETE (Excluir um influenciador)
exports.deleteInfluenciador = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM influenciadores WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Influenciador não encontrado para exclusão.' });
    }

    res.status(200).json({ mensagem: 'Influenciador excluído com sucesso!' });
  } catch (error) {
    console.error(`Erro ao excluir influenciador com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao excluir influenciador.' });
  }
};