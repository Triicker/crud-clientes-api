// Arquivo: controller/clientesController.js

/**
 * Módulo de Controller para a tabela 'clientes'.
 * Contém a lógica de acesso ao banco de dados (CRUD) usando SQL.
 */
const pool = require('../config/db');

// --- Funções CRUD ---

// 1. CREATE (Criar um novo cliente)
exports.createCliente = async (req, res) => {
  console.log('📥 Recebido POST /api/clientes');
  console.log('📦 req.body:', JSON.stringify(req.body, null, 2));
  
  const { nome, tipo, cnpj, cidade, uf, telefone, observacoes, status, vendedor_responsavel } = req.body;

  console.log('📋 Dados extraídos:', { nome, tipo, cnpj, cidade, uf, telefone, observacoes, status, vendedor_responsavel });

  try {
    const query = `
      INSERT INTO clientes (nome, tipo, cnpj, cidade, uf, telefone, observacoes, status, vendedor_responsavel)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `; 
    // Movi o comentário para FORA da string SQL (agora é um comentário de JS)
    // 'RETURNING *' devolve o registo inserido.
    
    const values = [nome, tipo, cnpj, cidade, uf, telefone, observacoes, status || 'Prospecção', vendedor_responsavel];
    
    console.log('💾 Executando INSERT com valores:', values);

    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    
    if (error.code === '23505') {
        return res.status(409).json({ erro: 'Cliente já cadastrado com este CNPJ.' });
    }

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
        // OTIMIZADO: Uma única query com JSON aggregation ao invés de múltiplas queries
        // Isso reduz de 4 queries para 1, melhorando significativamente a performance
        
        const query = `
            SELECT 
                c.*,
                COALESCE(json_agg(
                    json_build_object(
                        'id', ep.id,
                        'funcao', ep.funcao,
                        'nome', ep.nome,
                        'zap', ep.zap,
                        'email', ep.email,
                        'rede_social', ep.rede_social
                    ) ORDER BY ep.nome
                ) FILTER (WHERE ep.id IS NOT NULL), '[]'::json) as equipe_pedagogica,
                
                COALESCE(json_agg(
                    json_build_object(
                        'id', cd.id,
                        'funcao', cd.funcao,
                        'nome', cd.nome,
                        'zap', cd.zap,
                        'email', cd.email,
                        'escola', cd.escola
                    ) ORDER BY cd.nome
                ) FILTER (WHERE cd.id IS NOT NULL), '[]'::json) as corpo_docente,
                
                COALESCE(json_agg(
                    json_build_object(
                        'id', p.id,
                        'nome', p.nome,
                        'valor', p.valor,
                        'enviada', p.enviada,
                        'created_at', p.created_at
                    ) ORDER BY p.created_at DESC
                ) FILTER (WHERE p.id IS NOT NULL), '[]'::json) as propostas,
                
                COALESCE(json_agg(
                    json_build_object(
                        'id', d.id,
                        'classe', d.classe,
                        'nivel_rede', d.nivel_rede,
                        'ideb', d.ideb,
                        'satisfacao', d.satisfacao,
                        'impacto', d.impacto
                    ) ORDER BY d.id DESC
                ) FILTER (WHERE d.id IS NOT NULL), '[]'::json) as diagnosticos
            FROM clientes c
            LEFT JOIN equipe_pedagogica ep ON c.id = ep.cliente_id
            LEFT JOIN corpo_docente cd ON c.id = cd.cliente_id
            LEFT JOIN propostas p ON c.id = p.cliente_id
            LEFT JOIN diagnostico d ON c.id = d.cliente_id
            WHERE c.id = $1
            GROUP BY c.id
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
        }

        const cliente = result.rows[0];

        // Converter strings JSON de volta para objetos (se necessário)
        const relatorio = {
            ...cliente,
            equipe_pedagogica: typeof cliente.equipe_pedagogica === 'string' 
                ? JSON.parse(cliente.equipe_pedagogica) 
                : cliente.equipe_pedagogica,
            corpo_docente: typeof cliente.corpo_docente === 'string'
                ? JSON.parse(cliente.corpo_docente)
                : cliente.corpo_docente,
            propostas: typeof cliente.propostas === 'string'
                ? JSON.parse(cliente.propostas)
                : cliente.propostas,
            diagnosticos: typeof cliente.diagnosticos === 'string'
                ? JSON.parse(cliente.diagnosticos)
                : cliente.diagnosticos
        };

        res.status(200).json(relatorio);

    } catch (error) {
        console.error(`Erro ao gerar relatório do cliente com ID ${id}:`, error);
        res.status(500).json({ 
            erro: 'Erro interno do servidor ao gerar relatório.',
            message: error.message 
        });
    }
};

// 4. UPDATE (Atualizar um cliente)
exports.updateCliente = async (req, res) => {
  const { id } = req.params;
  const { nome, tipo, cnpj, cidade, uf, telefone, observacoes, status, vendedor_responsavel } = req.body;

  try {
    const query = `
      UPDATE clientes
      SET nome = $1, tipo = $2, cnpj = $3, cidade = $4, uf = $5, telefone = $6, observacoes = $7, status = $8, vendedor_responsavel = $9
      WHERE id = $10
      RETURNING *;
    `;
    const values = [nome, tipo, cnpj, cidade, uf, telefone, observacoes, status, vendedor_responsavel, id];

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