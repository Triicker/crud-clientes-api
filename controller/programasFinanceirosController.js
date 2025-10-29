// Arquivo: controller/programasFinanceirosController.js

/**
 * Módulo de Controller para a tabela 'programas_financeiros'.
 * Contém a lógica de acesso ao banco de dados (CRUD) para gerir os programas financeiros.
 */
const pool = require('../config/db');

// --- Funções CRUD ---

// 1. CREATE (Adicionar um novo programa financeiro)
exports.createPrograma = async (req, res) => {
  // cliente_id, programa, valor_anual (DECIMAL), saldo (DECIMAL), tipo_produto
  const { cliente_id, programa, valor_anual, saldo, tipo_produto } = req.body;

  try {
    const query = `
      INSERT INTO programas_financeiros (cliente_id, programa, valor_anual, saldo, tipo_produto)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    // Nota: O pg-node converte strings de números (ex: "1500.50") ou Numbers JS (1500.50)
    // para o tipo DECIMAL do PostgreSQL.
    const values = [cliente_id, programa, valor_anual, saldo, tipo_produto];

    const result = await pool.query(query, values);

    res.status(201).json({
      mensagem: 'Programa financeiro criado com sucesso!',
      programa: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar programa financeiro:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao criar programa financeiro.' });
  }
};

// 2. READ ALL (Obter todos os programas financeiros, com o nome do cliente)
exports.getAllProgramas = async (req, res) => {
  try {
    const query = `
      SELECT pf.*, c.nome AS cliente_nome
      FROM programas_financeiros pf
      JOIN clientes c ON pf.cliente_id = c.id
      ORDER BY c.nome, pf.programa ASC;
    `;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao obter programas financeiros:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter programas financeiros.' });
  }
};

// 3. READ ONE (Obter um programa por ID)
exports.getProgramaById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT pf.*, c.nome AS cliente_nome
      FROM programas_financeiros pf
      JOIN clientes c ON pf.cliente_id = c.id
      WHERE pf.id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Programa financeiro não encontrado.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Erro ao obter programa com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter programa financeiro.' });
  }
};

// 4. UPDATE (Atualizar um programa)
exports.updatePrograma = async (req, res) => {
  const { id } = req.params;
  const { cliente_id, programa, valor_anual, saldo, tipo_produto } = req.body;

  try {
    const query = `
      UPDATE programas_financeiros
      SET cliente_id = $1, programa = $2, valor_anual = $3, saldo = $4, tipo_produto = $5
      WHERE id = $6
      RETURNING *;
    `;
    const values = [cliente_id, programa, valor_anual, saldo, tipo_produto, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Programa financeiro não encontrado para atualização.' });
    }

    res.status(200).json({
      mensagem: 'Programa financeiro atualizado com sucesso!',
      programa: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao atualizar programa com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao atualizar programa financeiro.' });
  }
};

// 5. DELETE (Excluir um programa)
exports.deletePrograma = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM programas_financeiros WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Programa financeiro não encontrado para exclusão.' });
    }

    res.status(200).json({ mensagem: 'Programa financeiro excluído com sucesso!' });
  } catch (error) {
    console.error(`Erro ao excluir programa com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao excluir programa financeiro.' });
  }
};