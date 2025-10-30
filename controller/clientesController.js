// Arquivo: controller/clientesController.js

/**
 * Módulo de Controller para a tabela 'clientes'.
 * Contém a lógica de acesso ao banco de dados (CRUD) usando SQL.
 */
const pool = require('../config/db');

// --- Funções CRUD ---

// 1. CREATE (Criar um novo cliente)
exports.createCliente = async (req, res) => {
  const { nome, tipo, cnpj, cidade, uf, telefone, observacoes } = req.body;

  try {
    const query = `
      INSERT INTO clientes (nome, tipo, cnpj, cidade, uf, telefone, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `; 
    // Movi o comentário para FORA da string SQL (agora é um comentário de JS)
    // 'RETURNING *' devolve o registo inserido.
    
    const values = [nome, tipo, cnpj, cidade, uf, telefone, observacoes];

    const result = await pool.query(query, values);

    // ... (restante do código)
  } catch (error) {
    // Resposta de erro (código 500: Internal Server Error)
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao criar cliente.' });
  }
};

// 2. READ ALL (Obter todos os clientes)
exports.getAllClientes = async (req, res) => {
  try {
    const query = `
      SELECT
        c.*,
        (SELECT json_agg(ep) FROM equipe_pedagogica ep WHERE ep.cliente_id = c.id) as equipe_pedagogica,
        (SELECT json_agg(cd) FROM corpo_docente cd WHERE cd.cliente_id = c.id) as corpo_docente,
        (SELECT json_agg(p) FROM propostas p WHERE p.cliente_id = c.id) as propostas,
        (SELECT json_agg(d) FROM diagnostico d WHERE d.cliente_id = c.id) as diagnosticos
      FROM clientes c
      ORDER BY c.nome ASC
    `;
    const result = await pool.query(query);

    // Resposta de sucesso (código 200: OK)
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao obter clientes:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter clientes.' });
  }
};

// 3. READ ONE (Obter um cliente por ID)
exports.getClienteById = async (req, res) => {
  const { id } = req.params; // Obtém o ID dos parâmetros da URL

  try {
    const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      // Cliente não encontrado (código 404: Not Found)
      return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
    }

    // Resposta de sucesso
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Erro ao obter cliente com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter cliente.' });
  }
};

exports.getClienteRelatorio = async (req, res) => {
    const { id } = req.params; // ID do Cliente

    try {
        // 1. OBTER DADOS PRINCIPAIS DO CLIENTE
        const clienteResult = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
        
        if (clienteResult.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
        }
        
        const cliente = clienteResult.rows[0];

        // 2. BUSCAR DADOS RELACIONADOS (usando o cliente.id)
        
        // A. EQUIPE PEDAGÓGICA (1:N)
        const equipeQuery = `
            SELECT funcao, nome, zap, email, rede_social 
            FROM equipe_pedagogica 
            WHERE cliente_id = $1 
            ORDER BY nome
        `;
        const equipeResult = await pool.query(equipeQuery, [id]);

        // B. CORPO DOCENTE (1:N)
        const docentesQuery = `
            SELECT funcao, nome, zap, email, escola 
            FROM corpo_docente 
            WHERE cliente_id = $1
            ORDER BY nome
        `;
        const docentesResult = await pool.query(docentesQuery, [id]);

        // C. PROPOSTAS (1:N)
        const propostasQuery = `
            SELECT nome, valor, enviada, created_at
            FROM propostas 
            WHERE cliente_id = $1
            ORDER BY created_at DESC
        `;
        const propostasResult = await pool.query(propostasQuery, [id]);
        
        // D. DIAGNÓSTICO (1:N - pode ter múltiplos, mas geralmente um)
        const diagnosticoQuery = `
            SELECT classe, nivel_rede, ideb, satisfacao, impacto, created_at 
            FROM diagnostico 
            WHERE cliente_id = $1
            ORDER BY created_at DESC
        `;
        const diagnosticoResult = await pool.query(diagnosticoQuery, [id]);

        // 3. COMBINAR TODOS OS DADOS NO OBJETO FINAL
        const relatorio = {
            ...cliente,
            equipe_pedagogica: equipeResult.rows,
            corpo_docente: docentesResult.rows,
            propostas: propostasResult.rows,
            diagnosticos: diagnosticoResult.rows,
            // Poderias adicionar aqui rede_numeros, programas_financeiros, etc.
        };

        res.status(200).json(relatorio);

    } catch (error) {
        console.error(`Erro ao gerar relatório do cliente com ID ${id}:`, error);
        res.status(500).json({ erro: 'Erro interno do servidor ao gerar relatório.' });
    }
};

// 4. UPDATE (Atualizar um cliente)
exports.updateCliente = async (req, res) => {
  const { id } = req.params;
  const { nome, tipo, cnpj, cidade, uf, telefone, observacoes } = req.body;

  try {
    const query = `
      UPDATE clientes
      SET nome = $1, tipo = $2, cnpj = $3, cidade = $4, uf = $5, telefone = $6, observacoes = $7
      WHERE id = $8
      RETURNING *;
    `;
    const values = [nome, tipo, cnpj, cidade, uf, telefone, observacoes, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado para atualização.' });
    }

    // Resposta de sucesso
    res.status(200).json({
      mensagem: 'Cliente atualizado com sucesso!',
      cliente: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao atualizar cliente com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao atualizar cliente.' });
  }
};

// 5. DELETE (Excluir um cliente)
exports.deleteCliente = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado para exclusão.' });
    }

    // Resposta de sucesso
    res.status(200).json({ mensagem: 'Cliente excluído com sucesso!' });
  } catch (error) {
    console.error(`Erro ao excluir cliente com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao excluir cliente.' });
  }
};