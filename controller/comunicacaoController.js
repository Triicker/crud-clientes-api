const db = require('../config/db');

// Buscar todos os usuários
exports.getTodosUsuarios = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id,
                u.nome,
                u.email,
                u.telefone,
                u.ativo,
                p.nome as perfil_nome,
                p.id as perfil_id
            FROM usuarios u
            LEFT JOIN perfis p ON u.perfil_id = p.id
            WHERE u.ativo = true
            ORDER BY u.nome ASC
        `;

        const result = await db.query(query);
        res.json({
            usuarios: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
};

// Criar comentário/comunicação
exports.criarComunicacao = async (req, res) => {
    try {
        const { 
            cliente_id, 
            usuario_destinatario_id, 
            tipo, // 'comentario', 'tarefa', 'validacao'
            titulo,
            descricao,
            prioridade, // 'baixa', 'media', 'alta', 'urgente'
            etapa_relacionada,
            data_prazo,
            tags
        } = req.body;
        
        const usuario_remetente_id = req.usuario.id;

        const query = `
            INSERT INTO comunicacao_equipe 
            (cliente_id, usuario_remetente_id, usuario_destinatario_id, tipo, titulo, descricao, prioridade, etapa_relacionada, data_prazo, tags, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pendente')
            RETURNING *
        `;

        const result = await db.query(query, [
            cliente_id,
            usuario_remetente_id,
            usuario_destinatario_id,
            tipo,
            titulo,
            descricao,
            prioridade || 'media',
            etapa_relacionada,
            data_prazo,
            JSON.stringify(tags || [])
        ]);

        // Buscar dados completos da comunicação criada
        const comunicacaoCompleta = await db.query(`
            SELECT 
                c.*,
                ur.nome as remetente_nome,
                ur.email as remetente_email,
                ud.nome as destinatario_nome,
                ud.email as destinatario_email,
                cl.nome as cliente_nome
            FROM comunicacao_equipe c
            LEFT JOIN usuarios ur ON c.usuario_remetente_id = ur.id
            LEFT JOIN usuarios ud ON c.usuario_destinatario_id = ud.id
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            WHERE c.id = $1
        `, [result.rows[0].id]);

        res.status(201).json({
            message: 'Comunicação criada com sucesso',
            comunicacao: comunicacaoCompleta.rows[0]
        });
    } catch (error) {
        console.error('Erro ao criar comunicação:', error);
        res.status(500).json({ error: 'Erro ao criar comunicação' });
    }
};

// Buscar comunicações do usuário
exports.getComunicacoesUsuario = async (req, res) => {
    try {
        const usuario_id = req.usuario.id;
        const { tipo, status, cliente_id, limit = 50, offset = 0 } = req.query;

        let whereConditions = ['(c.usuario_remetente_id = $1 OR c.usuario_destinatario_id = $1)'];
        let queryParams = [usuario_id];
        let paramCounter = 2;

        if (tipo) {
            whereConditions.push(`c.tipo = $${paramCounter}`);
            queryParams.push(tipo);
            paramCounter++;
        }

        if (status) {
            whereConditions.push(`c.status = $${paramCounter}`);
            queryParams.push(status);
            paramCounter++;
        }

        if (cliente_id) {
            whereConditions.push(`c.cliente_id = $${paramCounter}`);
            queryParams.push(cliente_id);
            paramCounter++;
        }

        const whereClause = 'WHERE ' + whereConditions.join(' AND ');

        const query = `
            SELECT 
                c.*,
                ur.nome as remetente_nome,
                ur.email as remetente_email,
                ud.nome as destinatario_nome,
                ud.email as destinatario_email,
                cl.nome as cliente_nome,
                pr.nome as perfil_remetente,
                pd.nome as perfil_destinatario
            FROM comunicacao_equipe c
            LEFT JOIN usuarios ur ON c.usuario_remetente_id = ur.id
            LEFT JOIN usuarios ud ON c.usuario_destinatario_id = ud.id
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN perfis pr ON ur.perfil_id = pr.id
            LEFT JOIN perfis pd ON ud.perfil_id = pd.id
            ${whereClause}
            ORDER BY c.data_criacao DESC
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `;

        queryParams.push(limit, offset);

        const result = await db.query(query, queryParams);

        // Contar total
        const countQuery = `
            SELECT COUNT(*) 
            FROM comunicacao_equipe c
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, queryParams.slice(0, -2));

        res.json({
            comunicacoes: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Erro ao buscar comunicações:', error);
        res.status(500).json({ error: 'Erro ao buscar comunicações' });
    }
};

// Atualizar status da comunicação
exports.atualizarStatusComunicacao = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resposta } = req.body;
        const usuario_id = req.usuario.id;

        // Verificar se o usuário tem permissão para atualizar
        const verificarQuery = `
            SELECT * FROM comunicacao_equipe 
            WHERE id = $1 AND (usuario_remetente_id = $2 OR usuario_destinatario_id = $2)
        `;
        const verificarResult = await db.query(verificarQuery, [id, usuario_id]);
        
        if (verificarResult.rows.length === 0) {
            return res.status(403).json({ error: 'Sem permissão para atualizar esta comunicação' });
        }

        const query = `
            UPDATE comunicacao_equipe 
            SET status = $1, resposta = $2, data_resposta = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;

        const result = await db.query(query, [status, resposta, id]);

        res.json({
            message: 'Status atualizado com sucesso',
            comunicacao: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
};

// Buscar comunicações de um cliente específico
exports.getComunicacoesCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;

        const query = `
            SELECT 
                c.*,
                ur.nome as remetente_nome,
                ur.email as remetente_email,
                ud.nome as destinatario_nome,
                ud.email as destinatario_email,
                pr.nome as perfil_remetente,
                pd.nome as perfil_destinatario
            FROM comunicacao_equipe c
            LEFT JOIN usuarios ur ON c.usuario_remetente_id = ur.id
            LEFT JOIN usuarios ud ON c.usuario_destinatario_id = ud.id
            LEFT JOIN perfis pr ON ur.perfil_id = pr.id
            LEFT JOIN perfis pd ON ud.perfil_id = pd.id
            WHERE c.cliente_id = $1
            ORDER BY c.data_criacao DESC
        `;

        const result = await db.query(query, [clienteId]);

        res.json({
            comunicacoes: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Erro ao buscar comunicações do cliente:', error);
        res.status(500).json({ error: 'Erro ao buscar comunicações do cliente' });
    }
};

// Buscar dashboard de comunicações (estatísticas)
exports.getDashboardComunicacoes = async (req, res) => {
    try {
        const usuario_id = req.usuario.id;

        // Estatísticas gerais
        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
                COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
                COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas,
                COUNT(CASE WHEN tipo = 'tarefa' THEN 1 END) as tarefas,
                COUNT(CASE WHEN tipo = 'comentario' THEN 1 END) as comentarios,
                COUNT(CASE WHEN tipo = 'validacao' THEN 1 END) as validacoes,
                COUNT(CASE WHEN prioridade = 'alta' OR prioridade = 'urgente' THEN 1 END) as alta_prioridade
            FROM comunicacao_equipe 
            WHERE usuario_destinatario_id = $1 OR usuario_remetente_id = $1
        `;

        const statsResult = await db.query(statsQuery, [usuario_id]);

        // Comunicações recentes
        const recentesQuery = `
            SELECT 
                c.*,
                ur.nome as remetente_nome,
                ud.nome as destinatario_nome,
                cl.nome as cliente_nome
            FROM comunicacao_equipe c
            LEFT JOIN usuarios ur ON c.usuario_remetente_id = ur.id
            LEFT JOIN usuarios ud ON c.usuario_destinatario_id = ud.id
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            WHERE c.usuario_destinatario_id = $1 OR c.usuario_remetente_id = $1
            ORDER BY c.data_criacao DESC
            LIMIT 10
        `;

        const recentesResult = await db.query(recentesQuery, [usuario_id]);

        res.json({
            estatisticas: statsResult.rows[0],
            comunicacoes_recentes: recentesResult.rows
        });
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        res.status(500).json({ error: 'Erro ao buscar dashboard' });
    }
};