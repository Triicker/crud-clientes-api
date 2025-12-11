/**
 * Controller para gestão de equipe
 * Inclui observações, métricas de desempenho e acompanhamento de vendedores
 */
const pool = require('../config/db');

// ============================================================================
// OBTER TODOS OS USUÁRIOS COM MÉTRICAS
// ============================================================================
exports.getUsuariosComMetricas = async (req, res) => {
    try {
        const { perfil, ativo, ordenar } = req.query;

        let query = `
            SELECT 
                u.id,
                u.nome,
                u.email,
                u.telefone,
                u.data_admissao,
                u.meta_vendas_mensal,
                u.ativo,
                u.observacao_geral,
                p.id as perfil_id,
                p.nome as perfil,
                p.descricao as perfil_descricao,
                
                -- Contagem de clientes
                COALESCE((
                    SELECT COUNT(*) FROM clientes c WHERE c.consultor_id = u.id
                ), 0)::integer as total_clientes,
                
                -- Clientes com vendas fechadas (chegaram em renovação)
                COALESCE((
                    SELECT COUNT(*) 
                    FROM clientes c 
                    WHERE c.consultor_id = u.id 
                    AND c.tarefas_concluidas IS NOT NULL
                    AND c.tarefas_concluidas::text LIKE '%"renovacao"%'
                ), 0)::integer as vendas_fechadas,
                
                -- Clientes em processo
                COALESCE((
                    SELECT COUNT(*) 
                    FROM clientes c 
                    WHERE c.consultor_id = u.id 
                    AND c.tarefas_concluidas IS NOT NULL
                    AND c.tarefas_concluidas::text != '{}'
                    AND c.tarefas_concluidas::text NOT LIKE '%"renovacao"%'
                ), 0)::integer as clientes_em_processo,
                
                -- Clientes sem ação
                COALESCE((
                    SELECT COUNT(*) 
                    FROM clientes c 
                    WHERE c.consultor_id = u.id 
                    AND (c.tarefas_concluidas IS NULL OR c.tarefas_concluidas::text = '{}')
                ), 0)::integer as clientes_sem_acao,
                
                -- Última atividade
                (
                    SELECT MAX(ht.data_hora)
                    FROM historico_tarefas ht
                    WHERE ht.usuario_id = u.id
                ) as ultima_atividade,
                
                -- Total de ações
                COALESCE((
                    SELECT COUNT(*) FROM historico_tarefas ht WHERE ht.usuario_id = u.id
                ), 0)::integer as total_acoes,
                
                -- Ações este mês
                COALESCE((
                    SELECT COUNT(*)
                    FROM historico_tarefas ht
                    WHERE ht.usuario_id = u.id
                    AND ht.data_hora >= DATE_TRUNC('month', CURRENT_DATE)
                ), 0)::integer as acoes_mes_atual,
                
                -- Quantidade de observações
                COALESCE((
                    SELECT COUNT(*) FROM observacoes_usuarios o WHERE o.usuario_id = u.id
                ), 0)::integer as total_observacoes

            FROM usuarios u
            JOIN perfis p ON u.perfil_id = p.id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        // Filtro por perfil
        if (perfil) {
            query += ` AND p.nome = $${paramIndex}`;
            params.push(perfil);
            paramIndex++;
        }

        // Filtro por status ativo
        if (ativo !== undefined) {
            query += ` AND (u.ativo = $${paramIndex} OR u.ativo IS NULL)`;
            params.push(ativo === 'true');
            paramIndex++;
        }

        // Ordenação
        switch (ordenar) {
            case 'vendas':
                query += ' ORDER BY vendas_fechadas DESC, u.nome';
                break;
            case 'atividade':
                query += ' ORDER BY ultima_atividade DESC NULLS LAST, u.nome';
                break;
            case 'clientes':
                query += ' ORDER BY total_clientes DESC, u.nome';
                break;
            default:
                query += ' ORDER BY u.nome ASC';
        }

        const result = await pool.query(query, params);

        // Calcular estatísticas gerais
        const stats = {
            total_usuarios: result.rows.length,
            usuarios_ativos: result.rows.filter(u => u.ativo !== false).length,
            total_vendas: result.rows.reduce((sum, u) => sum + u.vendas_fechadas, 0),
            total_clientes: result.rows.reduce((sum, u) => sum + u.total_clientes, 0),
            clientes_em_processo: result.rows.reduce((sum, u) => sum + u.clientes_em_processo, 0)
        };

        res.json({
            success: true,
            stats,
            usuarios: result.rows
        });

    } catch (error) {
        console.error('Erro ao buscar usuários com métricas:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
};

// ============================================================================
// OBTER DETALHES DE UM USUÁRIO COM MÉTRICAS COMPLETAS
// ============================================================================
exports.getUsuarioDetalhado = async (req, res) => {
    try {
        const { id } = req.params;

        // Dados básicos do usuário
        const usuarioResult = await pool.query(`
            SELECT 
                u.*,
                p.nome as perfil,
                p.descricao as perfil_descricao
            FROM usuarios u
            JOIN perfis p ON u.perfil_id = p.id
            WHERE u.id = $1
        `, [id]);

        if (usuarioResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const usuario = usuarioResult.rows[0];
        delete usuario.senha_hash; // Remove senha

        // Métricas de clientes
        const clientesResult = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE tarefas_concluidas::text LIKE '%"renovacao"%') as vendas_fechadas,
                COUNT(*) FILTER (
                    WHERE tarefas_concluidas IS NOT NULL 
                    AND tarefas_concluidas::text != '{}' 
                    AND tarefas_concluidas::text NOT LIKE '%"renovacao"%'
                ) as em_processo,
                COUNT(*) FILTER (
                    WHERE tarefas_concluidas IS NULL OR tarefas_concluidas::text = '{}'
                ) as sem_acao
            FROM clientes
            WHERE consultor_id = $1
        `, [id]);

        // Lista de clientes do usuário
        const clientesListaResult = await pool.query(`
            SELECT 
                id, nome, email, telefone, cidade, estado,
                tarefas_concluidas,
                created_at,
                updated_at
            FROM clientes
            WHERE consultor_id = $1
            ORDER BY updated_at DESC
            LIMIT 20
        `, [id]);

        // Histórico de atividades recentes
        const atividadesResult = await pool.query(`
            SELECT 
                ht.*,
                c.nome as cliente_nome
            FROM historico_tarefas ht
            LEFT JOIN clientes c ON ht.cliente_id = c.id
            WHERE ht.usuario_id = $1
            ORDER BY ht.data_hora DESC
            LIMIT 50
        `, [id]);

        // Observações sobre o usuário
        const observacoesResult = await pool.query(`
            SELECT 
                o.*,
                u.nome as autor_nome
            FROM observacoes_usuarios o
            JOIN usuarios u ON o.autor_id = u.id
            WHERE o.usuario_id = $1
            ORDER BY o.criado_em DESC
        `, [id]);

        // Métricas mensais (últimos 6 meses)
        const metricasMensaisResult = await pool.query(`
            SELECT 
                DATE_TRUNC('month', ht.data_hora) as mes,
                COUNT(*) as total_acoes,
                COUNT(DISTINCT ht.cliente_id) as clientes_atendidos
            FROM historico_tarefas ht
            WHERE ht.usuario_id = $1
            AND ht.data_hora >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', ht.data_hora)
            ORDER BY mes DESC
        `, [id]);

        res.json({
            success: true,
            usuario,
            metricas: {
                clientes: clientesResult.rows[0],
                mensais: metricasMensaisResult.rows
            },
            clientes: clientesListaResult.rows,
            atividades: atividadesResult.rows,
            observacoes: observacoesResult.rows
        });

    } catch (error) {
        console.error('Erro ao buscar detalhes do usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes do usuário' });
    }
};

// ============================================================================
// CRIAR OBSERVAÇÃO SOBRE UM USUÁRIO
// ============================================================================
exports.criarObservacao = async (req, res) => {
    try {
        const { usuario_id, tipo, titulo, conteudo, visivel_usuario } = req.body;
        const autor_id = req.usuario.id;

        // Verificar se usuário existe
        const usuarioExists = await pool.query('SELECT id FROM usuarios WHERE id = $1', [usuario_id]);
        if (usuarioExists.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const result = await pool.query(`
            INSERT INTO observacoes_usuarios 
            (usuario_id, autor_id, tipo, titulo, conteudo, visivel_usuario)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [usuario_id, autor_id, tipo || 'observacao', titulo, conteudo, visivel_usuario || false]);

        // Buscar com nome do autor
        const observacaoCompleta = await pool.query(`
            SELECT o.*, u.nome as autor_nome
            FROM observacoes_usuarios o
            JOIN usuarios u ON o.autor_id = u.id
            WHERE o.id = $1
        `, [result.rows[0].id]);

        res.status(201).json({
            success: true,
            message: 'Observação criada com sucesso',
            observacao: observacaoCompleta.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar observação:', error);
        res.status(500).json({ error: 'Erro ao criar observação' });
    }
};

// ============================================================================
// LISTAR OBSERVAÇÕES DE UM USUÁRIO
// ============================================================================
exports.getObservacoes = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const { tipo } = req.query;

        let query = `
            SELECT 
                o.*,
                u.nome as autor_nome
            FROM observacoes_usuarios o
            JOIN usuarios u ON o.autor_id = u.id
            WHERE o.usuario_id = $1
        `;
        const params = [usuario_id];

        if (tipo) {
            query += ' AND o.tipo = $2';
            params.push(tipo);
        }

        query += ' ORDER BY o.criado_em DESC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            total: result.rows.length,
            observacoes: result.rows
        });

    } catch (error) {
        console.error('Erro ao buscar observações:', error);
        res.status(500).json({ error: 'Erro ao buscar observações' });
    }
};

// ============================================================================
// ATUALIZAR OBSERVAÇÃO
// ============================================================================
exports.atualizarObservacao = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, conteudo, tipo, visivel_usuario } = req.body;
        const usuario_id = req.usuario.id;

        // Verificar se é o autor ou admin
        const obsResult = await pool.query('SELECT autor_id FROM observacoes_usuarios WHERE id = $1', [id]);
        if (obsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Observação não encontrada' });
        }

        const userResult = await pool.query('SELECT perfil_id FROM usuarios WHERE id = $1', [usuario_id]);
        const isAdmin = userResult.rows[0]?.perfil_id === 1;
        const isAutor = obsResult.rows[0].autor_id === usuario_id;

        if (!isAdmin && !isAutor) {
            return res.status(403).json({ error: 'Sem permissão para editar esta observação' });
        }

        const result = await pool.query(`
            UPDATE observacoes_usuarios
            SET titulo = COALESCE($1, titulo),
                conteudo = COALESCE($2, conteudo),
                tipo = COALESCE($3, tipo),
                visivel_usuario = COALESCE($4, visivel_usuario),
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `, [titulo, conteudo, tipo, visivel_usuario, id]);

        res.json({
            success: true,
            message: 'Observação atualizada',
            observacao: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar observação:', error);
        res.status(500).json({ error: 'Erro ao atualizar observação' });
    }
};

// ============================================================================
// DELETAR OBSERVAÇÃO
// ============================================================================
exports.deletarObservacao = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.id;

        // Verificar permissão
        const obsResult = await pool.query('SELECT autor_id FROM observacoes_usuarios WHERE id = $1', [id]);
        if (obsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Observação não encontrada' });
        }

        const userResult = await pool.query('SELECT perfil_id FROM usuarios WHERE id = $1', [usuario_id]);
        const isAdmin = userResult.rows[0]?.perfil_id === 1;
        const isAutor = obsResult.rows[0].autor_id === usuario_id;

        if (!isAdmin && !isAutor) {
            return res.status(403).json({ error: 'Sem permissão para deletar esta observação' });
        }

        await pool.query('DELETE FROM observacoes_usuarios WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Observação deletada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar observação:', error);
        res.status(500).json({ error: 'Erro ao deletar observação' });
    }
};

// ============================================================================
// ATUALIZAR META DE VENDAS
// ============================================================================
exports.atualizarMeta = async (req, res) => {
    try {
        const { id } = req.params;
        const { meta_vendas_mensal } = req.body;

        const result = await pool.query(`
            UPDATE usuarios
            SET meta_vendas_mensal = $1
            WHERE id = $2
            RETURNING id, nome, meta_vendas_mensal
        `, [meta_vendas_mensal, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            success: true,
            message: 'Meta atualizada com sucesso',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar meta:', error);
        res.status(500).json({ error: 'Erro ao atualizar meta' });
    }
};

// ============================================================================
// ATUALIZAR OBSERVAÇÃO GERAL DO USUÁRIO
// ============================================================================
exports.atualizarObservacaoGeral = async (req, res) => {
    try {
        const { id } = req.params;
        const { observacao_geral } = req.body;

        const result = await pool.query(`
            UPDATE usuarios
            SET observacao_geral = $1
            WHERE id = $2
            RETURNING id, nome, observacao_geral
        `, [observacao_geral, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            success: true,
            message: 'Observação atualizada',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar observação:', error);
        res.status(500).json({ error: 'Erro ao atualizar observação' });
    }
};

// ============================================================================
// RANKING DE VENDEDORES
// ============================================================================
exports.getRanking = async (req, res) => {
    try {
        const { periodo } = req.query; // 'mes', 'trimestre', 'ano'
        
        let dataInicio;
        switch (periodo) {
            case 'trimestre':
                dataInicio = "CURRENT_DATE - INTERVAL '3 months'";
                break;
            case 'ano':
                dataInicio = "DATE_TRUNC('year', CURRENT_DATE)";
                break;
            default: // mes
                dataInicio = "DATE_TRUNC('month', CURRENT_DATE)";
        }

        const result = await pool.query(`
            SELECT 
                u.id,
                u.nome,
                p.nome as perfil,
                u.meta_vendas_mensal,
                
                -- Total de clientes
                COALESCE((
                    SELECT COUNT(*) FROM clientes c WHERE c.consultor_id = u.id
                ), 0)::integer as total_clientes,
                
                -- Vendas fechadas no período
                COALESCE((
                    SELECT COUNT(*) 
                    FROM clientes c 
                    WHERE c.consultor_id = u.id 
                    AND c.tarefas_concluidas::text LIKE '%"renovacao"%'
                    AND c.updated_at >= ${dataInicio}
                ), 0)::integer as vendas_periodo,
                
                -- Total de vendas
                COALESCE((
                    SELECT COUNT(*) 
                    FROM clientes c 
                    WHERE c.consultor_id = u.id 
                    AND c.tarefas_concluidas::text LIKE '%"renovacao"%'
                ), 0)::integer as vendas_total,
                
                -- Ações no período
                COALESCE((
                    SELECT COUNT(*)
                    FROM historico_tarefas ht
                    WHERE ht.usuario_id = u.id
                    AND ht.data_hora >= ${dataInicio}
                ), 0)::integer as acoes_periodo

            FROM usuarios u
            JOIN perfis p ON u.perfil_id = p.id
            WHERE p.nome IN ('consultor', 'representante')
            AND (u.ativo = true OR u.ativo IS NULL)
            ORDER BY vendas_periodo DESC, vendas_total DESC, u.nome
        `);

        // Adicionar posição no ranking
        const ranking = result.rows.map((user, index) => ({
            posicao: index + 1,
            ...user,
            percentual_meta: user.meta_vendas_mensal > 0 
                ? Math.round((user.vendas_periodo / user.meta_vendas_mensal) * 100) 
                : 0
        }));

        res.json({
            success: true,
            periodo: periodo || 'mes',
            ranking
        });

    } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        res.status(500).json({ error: 'Erro ao buscar ranking' });
    }
};

// ============================================================================
// ESTATÍSTICAS GERAIS DA EQUIPE
// ============================================================================
exports.getEstatisticasEquipe = async (req, res) => {
    try {
        // Estatísticas gerais
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM usuarios WHERE ativo = true OR ativo IS NULL) as total_usuarios,
                (SELECT COUNT(*) FROM clientes) as total_clientes,
                (SELECT COUNT(*) FROM clientes WHERE tarefas_concluidas::text LIKE '%"renovacao"%') as vendas_total,
                (SELECT COUNT(*) FROM clientes 
                 WHERE tarefas_concluidas::text LIKE '%"renovacao"%'
                 AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)) as vendas_mes,
                (SELECT COUNT(*) FROM historico_tarefas 
                 WHERE data_hora >= DATE_TRUNC('month', CURRENT_DATE)) as acoes_mes,
                (SELECT COUNT(*) FROM liberacao_etapas WHERE status = 'pendente') as liberacoes_pendentes
        `);

        // Top 5 vendedores do mês
        const topVendedores = await pool.query(`
            SELECT 
                u.id,
                u.nome,
                COALESCE((
                    SELECT COUNT(*) 
                    FROM clientes c 
                    WHERE c.consultor_id = u.id 
                    AND c.tarefas_concluidas::text LIKE '%"renovacao"%'
                    AND c.updated_at >= DATE_TRUNC('month', CURRENT_DATE)
                ), 0)::integer as vendas_mes
            FROM usuarios u
            JOIN perfis p ON u.perfil_id = p.id
            WHERE p.nome IN ('consultor', 'representante')
            ORDER BY vendas_mes DESC
            LIMIT 5
        `);

        // Distribuição por etapa
        const etapas = ['prospeccao', 'aumentar_conexao', 'envio_consultor', 'efetivacao', 
                        'registros_legais', 'separacao', 'entrega', 'recebimentos', 
                        'formacao', 'documentarios', 'gerar_graficos', 'renovacao'];
        
        const distribuicaoResult = await pool.query(`
            SELECT tarefas_concluidas FROM clientes WHERE tarefas_concluidas IS NOT NULL
        `);

        const distribuicaoEtapas = {};
        etapas.forEach(e => distribuicaoEtapas[e] = 0);

        distribuicaoResult.rows.forEach(row => {
            const tarefas = row.tarefas_concluidas || {};
            // Encontrar a última etapa com tarefas
            for (let i = etapas.length - 1; i >= 0; i--) {
                const etapa = etapas[i];
                if (tarefas[etapa] && tarefas[etapa].length > 0) {
                    distribuicaoEtapas[etapa]++;
                    break;
                }
            }
        });

        res.json({
            success: true,
            stats: stats.rows[0],
            topVendedores: topVendedores.rows,
            distribuicaoEtapas
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
};
