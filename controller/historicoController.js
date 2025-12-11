const db = require('../config/db');

// Registrar alteração no histórico
exports.registrarHistorico = async (req, res) => {
    try {
        const { cliente_id, etapa, acao_idx, acao_nome, operacao, observacao } = req.body;
        const usuario_id = req.usuario.id;

        // Truncar valores para evitar erro de tamanho do campo, verificando se são strings
        const acaoNomeTruncada = acao_nome && typeof acao_nome === 'string' ? acao_nome.substring(0, 250) : String(acao_nome || '').substring(0, 250);
        const observacaoTruncada = observacao && typeof observacao === 'string' ? observacao.substring(0, 250) : String(observacao || '').substring(0, 250);

        const query = `
            INSERT INTO historico_tarefas 
            (cliente_id, usuario_id, etapa, acao_idx, acao_nome, operacao, observacao)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const result = await db.query(query, [
            cliente_id,
            usuario_id,
            etapa,
            acao_idx,
            acaoNomeTruncada,
            operacao,
            observacaoTruncada || null
        ]);

        res.json({
            message: 'Histórico registrado com sucesso',
            historico: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao registrar histórico:', error);
        res.status(500).json({ error: 'Erro ao registrar histórico' });
    }
};

// Buscar histórico de um cliente específico
exports.getHistoricoCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const query = `
            SELECT 
                h.*,
                u.nome as usuario_nome,
                u.email as usuario_email,
                p.nome as usuario_perfil,
                c.nome as cliente_nome
            FROM historico_tarefas h
            LEFT JOIN usuarios u ON h.usuario_id = u.id
            LEFT JOIN perfis p ON u.perfil_id = p.id
            LEFT JOIN clientes c ON h.cliente_id = c.id
            WHERE h.cliente_id = $1
            ORDER BY h.data_hora DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await db.query(query, [clienteId, limit, offset]);

        // Contar total de registros
        const countQuery = 'SELECT COUNT(*) FROM historico_tarefas WHERE cliente_id = $1';
        const countResult = await db.query(countQuery, [clienteId]);

        res.json({
            historico: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Erro ao buscar histórico do cliente:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
};

// Buscar histórico geral (todos os clientes) com filtros
exports.getHistoricoGeral = async (req, res) => {
    try {
        const { 
            cliente_id, 
            usuario_id, 
            etapa, 
            operacao, 
            data_inicio, 
            data_fim,
            limit = 100,
            offset = 0
        } = req.query;

        let whereConditions = [];
        let queryParams = [];
        let paramCounter = 1;

        if (cliente_id) {
            whereConditions.push(`h.cliente_id = $${paramCounter}`);
            queryParams.push(cliente_id);
            paramCounter++;
        }

        if (usuario_id) {
            whereConditions.push(`h.usuario_id = $${paramCounter}`);
            queryParams.push(usuario_id);
            paramCounter++;
        }

        if (etapa) {
            whereConditions.push(`h.etapa = $${paramCounter}`);
            queryParams.push(etapa);
            paramCounter++;
        }

        if (operacao) {
            whereConditions.push(`h.operacao = $${paramCounter}`);
            queryParams.push(operacao);
            paramCounter++;
        }

        if (data_inicio) {
            whereConditions.push(`h.data_hora >= $${paramCounter}`);
            queryParams.push(data_inicio);
            paramCounter++;
        }

        if (data_fim) {
            whereConditions.push(`h.data_hora <= $${paramCounter}`);
            queryParams.push(data_fim);
            paramCounter++;
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        const query = `
            SELECT 
                h.*,
                u.nome as usuario_nome,
                u.email as usuario_email,
                p.nome as usuario_perfil,
                c.nome as cliente_nome
            FROM historico_tarefas h
            LEFT JOIN usuarios u ON h.usuario_id = u.id
            LEFT JOIN perfis p ON u.perfil_id = p.id
            LEFT JOIN clientes c ON h.cliente_id = c.id
            ${whereClause}
            ORDER BY h.data_hora DESC
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `;

        queryParams.push(limit, offset);

        const result = await db.query(query, queryParams);

        // Contar total
        const countQuery = `
            SELECT COUNT(*) 
            FROM historico_tarefas h
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, queryParams.slice(0, -2));

        res.json({
            historico: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Erro ao buscar histórico geral:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
};

// Obter estatísticas do histórico
exports.getEstatisticasHistorico = async (req, res) => {
    try {
        const { clienteId } = req.params;
        
        const query = `
            SELECT 
                COUNT(*) as total_alteracoes,
                COUNT(DISTINCT usuario_id) as usuarios_diferentes,
                COUNT(CASE WHEN operacao = 'marcada' THEN 1 END) as total_marcadas,
                COUNT(CASE WHEN operacao = 'desmarcada' THEN 1 END) as total_desmarcadas,
                MIN(data_hora) as primeira_alteracao,
                MAX(data_hora) as ultima_alteracao,
                u.nome as usuario_mais_ativo,
                COUNT(*) as alteracoes_usuario
            FROM historico_tarefas h
            LEFT JOIN usuarios u ON h.usuario_id = u.id
            WHERE h.cliente_id = $1
            GROUP BY u.nome
            ORDER BY alteracoes_usuario DESC
            LIMIT 1
        `;

        const result = await db.query(query, [clienteId]);

        res.json({
            estatisticas: result.rows[0] || {
                total_alteracoes: 0,
                usuarios_diferentes: 0,
                total_marcadas: 0,
                total_desmarcadas: 0
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
};
