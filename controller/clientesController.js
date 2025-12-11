// Arquivo: controller/clientesController.js

/**
 * Módulo de Controller para a tabela 'clientes'.
 * Contém a lógica de acesso ao banco de dados (CRUD) usando SQL.
 */
const pool = require('../config/db');
const responseFormatter = require('../utils/responseFormatter');
const logger = require('../utils/logger');

// --- Funções Auxiliares ---

/**
 * Valida se o vendedor existe e está ativo
 * @param {string} nome - Nome do vendedor
 * @returns {Object} { valido: boolean, vendedor: Object|null }
 */
async function validarVendedor(nome) {
    if (!nome || nome.trim() === '') {
        return { valido: true, vendedor: null }; // NULL é permitido
    }
    
    try {
        const result = await pool.query(
            'SELECT id, nome, email FROM usuarios WHERE nome = $1 AND ativo = true',
            [nome]
        );
        
        if (result.rows.length === 0) {
            return { valido: false, vendedor: null };
        }
        
        return { valido: true, vendedor: result.rows[0] };
    } catch (error) {
        logger.error('Erro ao validar vendedor', error);
        return { valido: false, vendedor: null };
    }
}

// --- Funções CRUD ---

// 1. CREATE (Criar um novo cliente)
exports.createCliente = async (req, res) => {
  logger.debug('Recebido POST /api/clientes', { body: req.body });
  
  const { nome, tipo, cnpj, cidade, uf, telefone, observacoes, status, vendedor_responsavel, tarefas_concluidas } = req.body;

  try {
    // VALIDAÇÃO: Verificar se o vendedor existe (se fornecido)
    if (vendedor_responsavel) {
        const validacao = await validarVendedor(vendedor_responsavel);
        if (!validacao.valido) {
            logger.warn(`Vendedor inválido: "${vendedor_responsavel}"`);
            return res.status(400).json(responseFormatter.validationError(
                `O vendedor "${vendedor_responsavel}" não existe ou está inativo`,
                { vendedor_responsavel: 'Vendedor inválido ou inativo' }
            ));
        }
        logger.debug(`Vendedor validado: ${validacao.vendedor.nome}`);
    }
    
    // REGRA DE NEGÓCIO: Forçar NULL se status for Prospecção
    // (vendedor só deve ser atribuído após primeira interação)
    const statusFinal = status || 'Prospecção';
    const vendedorFinal = statusFinal === 'Prospecção' ? null : vendedor_responsavel;
    
    if (vendedor_responsavel && statusFinal === 'Prospecção') {
        logger.warn('Vendedor ignorado: clientes em Prospecção não devem ter vendedor atribuído');
    }
    const query = `
      INSERT INTO clientes (nome, tipo, cnpj, cidade, uf, telefone, observacoes, status, vendedor_responsavel, tarefas_concluidas)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `; 
    // 'RETURNING *' devolve o registo inserido.
    
    const values = [nome, tipo, cnpj, cidade, uf, telefone, observacoes, statusFinal, vendedorFinal, tarefas_concluidas || {}];

    const result = await pool.query(query, values);

    logger.info('Cliente criado com sucesso', { clienteId: result.rows[0].id, nome });
    res.status(201).json(responseFormatter.success(result.rows[0], 'Cliente criado com sucesso'));
  } catch (error) {
    logger.error('Erro ao criar cliente', error);
    
    if (error.code === '23505') {
        return res.status(409).json(responseFormatter.error('Cliente já cadastrado com este CNPJ'));
    }

    res.status(500).json(responseFormatter.error('Erro interno do servidor ao criar cliente'));
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

    res.status(200).json(responseFormatter.success(result.rows, 'Clientes recuperados com sucesso'));
  } catch (error) {
    logger.error('Erro ao obter clientes', error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor ao obter clientes'));
  }
};

// 3. READ ONE (Obter um cliente por ID)
exports.getClienteById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(responseFormatter.notFound('Cliente'));
    }

    res.status(200).json(responseFormatter.success(result.rows[0], 'Cliente recuperado com sucesso'));
  } catch (error) {
    logger.error(`Erro ao obter cliente com ID ${id}`, error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor ao obter cliente'));
  }
};

// 3.1 READ ONE BY CNPJ (Obter um cliente por CNPJ)
exports.getClienteByCnpj = async (req, res) => {
  const { cnpj } = req.params;
  
  // Normalizar CNPJ (remover pontuação)
  const cnpjNormalizado = cnpj.replace(/\D/g, '');

  try {
    // Buscar com CNPJ limpo (sem pontuação) e com pontuação original
    const result = await pool.query(
      `SELECT * FROM clientes 
       WHERE REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = $1 
       OR cnpj = $2`,
      [cnpjNormalizado, cnpj]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(responseFormatter.notFound('Cliente com este CNPJ'));
    }

    res.status(200).json(responseFormatter.success(result.rows[0], 'Cliente encontrado'));
  } catch (error) {
    logger.error(`Erro ao buscar cliente com CNPJ ${cnpj}`, error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor ao buscar cliente'));
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
            return res.status(404).json(responseFormatter.notFound('Cliente'));
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

        res.status(200).json(responseFormatter.success(relatorio, 'Relatório gerado com sucesso'));

    } catch (error) {
        logger.error(`Erro ao gerar relatório do cliente com ID ${id}`, error);
        res.status(500).json(responseFormatter.error('Erro interno do servidor ao gerar relatório', error.message));
    }
};

// 4. UPDATE (Atualizar um cliente)
exports.updateCliente = async (req, res) => {
  const { id } = req.params;
  const { nome, tipo, cnpj, cidade, uf, telefone, observacoes, status, vendedor_responsavel, vendedor_responsavel_id, tarefas_concluidas } = req.body;

  try {
    // Buscar cliente atual para verificar estado anterior
    const clienteAtualResult = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    
    if (clienteAtualResult.rows.length === 0) {
      return res.status(404).json(responseFormatter.notFound('Cliente'));
    }
    
    const clienteAtual = clienteAtualResult.rows[0];
    let vendedorFinal = vendedor_responsavel;
    let vendedorIdFinal = vendedor_responsavel_id;
    
    // LÓGICA DE ATRIBUIÇÃO AUTOMÁTICA
    // Se está saindo de Prospecção para outro status e não tem vendedor
    if (clienteAtual.status === 'Prospecção' && 
        status && 
        status !== 'Prospecção' && 
        !clienteAtual.vendedor_responsavel) {
        
        // Se foi fornecido um vendedor, usar ele
        if (vendedor_responsavel) {
            vendedorFinal = vendedor_responsavel;
            logger.debug(`Vendedor explícito fornecido: ${vendedorFinal}`);
        }
        // Caso contrário, tentar atribuir ao usuário da sessão
        else if (req.user && req.user.nome) {
            vendedorFinal = req.user.nome;
            vendedorIdFinal = req.user.id;
            logger.info(`Vendedor atribuído automaticamente: ${vendedorFinal}`, { clienteId: id });
        }
    }
    
    // VALIDAÇÃO: Verificar se o vendedor existe (se fornecido)
    if (vendedorFinal) {
        const validacao = await validarVendedor(vendedorFinal);
        if (!validacao.valido) {
            logger.warn(`Vendedor inválido: "${vendedorFinal}"`);
            return res.status(400).json(responseFormatter.validationError(
                `O vendedor "${vendedorFinal}" não existe ou está inativo`,
                { vendedor_responsavel: 'Vendedor inválido ou inativo' }
            ));
        }
        logger.debug(`Vendedor validado: ${validacao.vendedor.nome}`);
        
        // Se ID não foi fornecido, buscar do vendedor validado
        if (!vendedorIdFinal && validacao.vendedor) {
            vendedorIdFinal = validacao.vendedor.id;
        }
    }
    
    const query = `
      UPDATE clientes
      SET nome = $1, tipo = $2, cnpj = $3, cidade = $4, uf = $5, telefone = $6, observacoes = $7, status = $8, vendedor_responsavel = $9, tarefas_concluidas = $10, vendedor_responsavel_id = $11
      WHERE id = $12
      RETURNING *;
    `;
    const values = [nome, tipo, cnpj, cidade, uf, telefone, observacoes, status, vendedorFinal, tarefas_concluidas, vendedorIdFinal, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json(responseFormatter.notFound('Cliente'));
    }

    logger.info('Cliente atualizado com sucesso', { clienteId: id, vendedorFinal });
    res.status(200).json(responseFormatter.success(result.rows[0], 'Cliente atualizado com sucesso'));
  } catch (error) {
    logger.error(`Erro ao atualizar cliente com ID ${id}`, error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor ao atualizar cliente'));
  }
};

// 5. DELETE (Excluir um cliente)
exports.deleteCliente = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(responseFormatter.notFound('Cliente'));
    }

    logger.info('Cliente excluído', { clienteId: id });
    res.status(200).json(responseFormatter.success(null, 'Cliente excluído com sucesso'));
  } catch (error) {
    logger.error(`Erro ao excluir cliente com ID ${id}`, error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor ao excluir cliente'));
  }
};

// ============================================================================
// CALENDÁRIO / HISTÓRICO DO CLIENTE
// ============================================================================

/**
 * GET /api/clientes/:id/calendario
 * Obtém os eventos do calendário de um cliente
 */
exports.getCalendario = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Tenta criar a coluna se não existir (silenciosamente)
    try {
      await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS calendario_eventos JSONB DEFAULT '{}'`);
    } catch (alterError) {
      // Ignora erro se coluna já existe
    }
    
    const result = await pool.query(
      'SELECT calendario_eventos FROM clientes WHERE id = $1', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json(responseFormatter.notFound('Cliente'));
    }
    
    const eventos = result.rows[0].calendario_eventos || {};
    res.status(200).json(responseFormatter.success({ eventos }, 'Eventos recuperados com sucesso'));
  } catch (error) {
    logger.error('Erro ao obter calendário', error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor'));
  }
};

/**
    console.error('Erro ao obter calendário:', error);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

/**
 * PUT /api/clientes/:id/calendario
 * Atualiza os eventos do calendário de um cliente
 */
exports.updateCalendario = async (req, res) => {
  const { id } = req.params;
  const { data, evento } = req.body;
  
  logger.debug('Atualizando calendário do cliente', { clienteId: id, data, evento });
  
  try {
    // Primeiro, busca os eventos atuais
    const currentResult = await pool.query(
      'SELECT calendario_eventos FROM clientes WHERE id = $1', 
      [id]
    );
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json(responseFormatter.notFound('Cliente'));
    }
    
    // Atualiza os eventos para a data específica
    let eventos = currentResult.rows[0].calendario_eventos || {};
    
    if (Array.isArray(evento) && evento.length === 0) {
      // Remove a data se não há mais eventos
      delete eventos[data];
    } else {
      // Atualiza os eventos da data
      eventos[data] = evento;
    }
    
    // Salva no banco
    const updateResult = await pool.query(
      'UPDATE clientes SET calendario_eventos = $1 WHERE id = $2 RETURNING calendario_eventos',
      [JSON.stringify(eventos), id]
    );
    
    logger.info('Calendário atualizado com sucesso', { clienteId: id, data });
    
    res.status(200).json(responseFormatter.success(
      { eventos: updateResult.rows[0].calendario_eventos },
      'Calendário atualizado com sucesso'
    ));
  } catch (error) {
    logger.error('Erro ao atualizar calendário', error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor'));
  }
};

// 10. ATUALIZAR TAREFAS CONCLUÍDAS E AUTO-ATRIBUIR VENDEDOR
exports.atualizarTarefas = async (req, res) => {
  const { id } = req.params;
  const { tarefas_concluidas } = req.body;
  
  logger.debug('Atualizando tarefas do cliente', { clienteId: id, tarefas_concluidas, user: req.user });
  
  try {
    // Busca o cliente atual
    const clienteResult = await pool.query(
      'SELECT id, nome, status, vendedor_responsavel, vendedor_responsavel_id, tarefas_concluidas FROM clientes WHERE id = $1',
      [id]
    );
    
    if (clienteResult.rows.length === 0) {
      return res.status(404).json(responseFormatter.notFound('Cliente'));
    }
    
    const cliente = clienteResult.rows[0];
    logger.debug('Cliente atual', { cliente });
    
    // Calcula o novo status baseado nas tarefas concluídas
    const novoStatus = calcularStatusPorTarefas(tarefas_concluidas);
    logger.debug('Novo status calculado', { novoStatus });
    
    // AUTO-ATRIBUIÇÃO DO VENDEDOR
    let vendedorId = cliente.vendedor_responsavel_id;
    let vendedorNome = cliente.vendedor_responsavel;
    
    // Se não tem vendedor atribuído E o usuário é vendedor, atribui automaticamente
    if (!vendedorId && req.user && req.user.id) {
      logger.debug('Cliente sem vendedor, verificando auto-atribuição');
      
      // Busca informações do usuário
      const usuarioResult = await pool.query(
        'SELECT id, nome, perfil_id FROM usuarios WHERE id = $1',
        [req.user.id]
      );
      
      if (usuarioResult.rows.length > 0) {
        const usuario = usuarioResult.rows[0];
        logger.debug('Usuário que marcou tarefa', { usuario });
        
        // Verifica se é vendedor (perfil_id 2, 3 ou 4)
        const perfisVendedor = [2, 3, 4]; // Vendedor, Comercial, Consultor
        
        if (perfisVendedor.includes(usuario.perfil_id)) {
          vendedorId = usuario.id;
          vendedorNome = usuario.nome;
          logger.info('Auto-atribuindo vendedor', { vendedorNome, clienteId: id });
        } else {
          logger.debug('Usuário não é vendedor', { perfil_id: usuario.perfil_id });
        }
      }
    } else if (vendedorId) {
      logger.debug('Cliente já possui vendedor atribuído', { vendedorNome });
    }
    
    // Atualiza as tarefas, status e vendedor no banco
    const updateResult = await pool.query(
      `UPDATE clientes 
       SET tarefas_concluidas = $1, 
           status = $2, 
           vendedor_responsavel_id = $3,
           vendedor_responsavel = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING id, nome, status, vendedor_responsavel, vendedor_responsavel_id, tarefas_concluidas`,
      [JSON.stringify(tarefas_concluidas), novoStatus, vendedorId, vendedorNome, id]
    );
    
    logger.info('Tarefas e vendedor atualizados com sucesso', { clienteId: id, novoStatus, vendedorNome });
    
    res.status(200).json(responseFormatter.success({
      cliente: updateResult.rows[0],
      status: novoStatus,
      vendedor_atribuido: vendedorNome || null
    }, 'Tarefas atualizadas com sucesso'));
    
  } catch (error) {
    logger.error('Erro ao atualizar tarefas', error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor ao atualizar tarefas'));
  }
};

/**
 * Calcula o status do cliente baseado nas tarefas concluídas
 * @param {Object} tarefas - Objeto com etapas e arrays de índices de tarefas concluídas
 * @returns {string} - Status calculado
 */
function calcularStatusPorTarefas(tarefas) {
  if (!tarefas || typeof tarefas !== 'object') {
    return 'prospeccao';
  }
  
  // Mapeamento de etapas (em ordem de progressão)
  const etapasOrdem = [
    'prospeccao',
    'aumentar_conexao',
    'envio_consultor',
    'efetivacao',
    'registros_legais',
    'separacao',
    'entrega',
    'recebimentos',
    'formacao',
    'documentarios',
    'gerar_graficos',
    'renovacao'
  ];
  
  // Considera uma etapa "completa" se tem pelo menos 3 tarefas marcadas (de 5 possíveis)
  const MINIMO_TAREFAS_PARA_COMPLETAR = 3;
  
  // Encontra a última etapa com progresso significativo
  let ultimaEtapaAtiva = 'prospeccao';
  
  for (const etapa of etapasOrdem) {
    const tarefasDaEtapa = tarefas[etapa] || [];
    
    if (Array.isArray(tarefasDaEtapa) && tarefasDaEtapa.length >= MINIMO_TAREFAS_PARA_COMPLETAR) {
      ultimaEtapaAtiva = etapa;
    } else if (Array.isArray(tarefasDaEtapa) && tarefasDaEtapa.length > 0) {
      // Se tem alguma tarefa marcada (mas menos de 3), considera essa como a etapa atual
      ultimaEtapaAtiva = etapa;
      break; // Para na primeira etapa incompleta
    }
  }
  
  logger.debug('Status calculado baseado em tarefas', { ultimaEtapaAtiva });
  return ultimaEtapaAtiva;
}