// Arquivo: controller/diagnosticoController.js

/**
 * Módulo de Controller para a tabela 'diagnostico'.
 * Contém a lógica de acesso ao banco de dados (CRUD) para gerir os diagnósticos de clientes.
 */
const pool = require('../config/db');

// --- Funções CRUD ---

// 1. CREATE (Adicionar um novo diagnóstico)
exports.createDiagnostico = async (req, res) => {
  // cliente_id, classe, nivel_rede (INT), ideb (DECIMAL), satisfacao (INT), impacto (INT)
  const { cliente_id, classe, nivel_rede, ideb, satisfacao, impacto } = req.body;

  try {
    const query = `
      INSERT INTO diagnostico (cliente_id, classe, nivel_rede, ideb, satisfacao, impacto)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [cliente_id, classe, nivel_rede, ideb, satisfacao, impacto];

    const result = await pool.query(query, values);

    res.status(201).json({
      mensagem: 'Diagnóstico criado com sucesso!',
      diagnostico: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar diagnóstico:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao criar diagnóstico.' });
  }
};

// 2. READ ALL (Obter todos os diagnósticos, com o nome do cliente)
exports.getAllDiagnosticos = async (req, res) => {
  try {
    const query = `
      SELECT d.*, c.nome AS cliente_nome
      FROM diagnostico d
      JOIN clientes c ON d.cliente_id = c.id
      ORDER BY c.nome, d.id DESC;
    `;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao obter diagnósticos:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter diagnósticos.' });
  }
};

// 3. READ ONE (Obter um diagnóstico por ID)
exports.getDiagnosticoById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT d.*, c.nome AS cliente_nome
      FROM diagnostico d
      JOIN clientes c ON d.cliente_id = c.id
      WHERE d.id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Diagnóstico não encontrado.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Erro ao obter diagnóstico com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter diagnóstico.' });
  }
};

// 4. UPDATE (Atualizar um diagnóstico)
exports.updateDiagnostico = async (req, res) => {
  const { id } = req.params;
  const { cliente_id, classe, nivel_rede, ideb, satisfacao, impacto } = req.body;

  try {
    const query = `
      UPDATE diagnostico
      SET cliente_id = $1, classe = $2, nivel_rede = $3, ideb = $4, satisfacao = $5, impacto = $6
      WHERE id = $7
      RETURNING *;
    `;
    const values = [cliente_id, classe, nivel_rede, ideb, satisfacao, impacto, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Diagnóstico não encontrado para atualização.' });
    }

    res.status(200).json({
      mensagem: 'Diagnóstico atualizado com sucesso!',
      diagnostico: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao atualizar diagnóstico com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao atualizar diagnóstico.' });
  }
};

// 5. DELETE (Excluir um diagnóstico)
exports.deleteDiagnostico = async (req, res) => {
  const { id } = req.params;

  try {
    // Como a tabela influenciadores depende desta, a cláusula ON DELETE CASCADE
    // no teu DB garantirá que os influenciadores associados sejam apagados.
    const result = await pool.query('DELETE FROM diagnostico WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Diagnóstico não encontrado para exclusão.' });
    }

    res.status(200).json({ mensagem: 'Diagnóstico excluído com sucesso!' });
  } catch (error) {
    console.error(`Erro ao excluir diagnóstico com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao excluir diagnóstico.' });
  }
};