/**
 * Controller para gestão de vendedores/usuários
 * 
 * Funcionalidades:
 * - Listar todos os usuários com estatísticas de vendas
 * - Ver progresso de cada vendedor no pipeline
 * - Adicionar/editar observações de gestores
 * - Dashboard de performance
 */
const pool = require('../config/db');

// ============================================================================
// LISTAR TODOS OS USUÁRIOS COM ESTATÍSTICAS
// ============================================================================
exports.getUsuariosComEstatisticas = async (req, res) => {
    try {
        // Parâmetro para filtrar por perfil (ex: ?perfil=equipe_interna ou ?perfil_id=4)
        const { perfil, perfil_id, ativo } = req.query;
        
        let whereClause = '';
        const queryParams = [];
        
        // Filtrar por perfil_id específico
        if (perfil_id) {
            queryParams.push(perfil_id);
            whereClause = `WHERE u.perfil_id = $${queryParams.length}`;
        } else if (perfil) {
            queryParams.push(perfil);
            whereClause = `WHERE p.nome = $${queryParams.length}`;
        }
        
        // Adicionar filtro de ativo
        if (ativo !== undefined) {
            const isAtivo = ativo === 'true' || ativo === '1';
            queryParams.push(isAtivo);
            whereClause += whereClause ? ` AND u.ativo = $${queryParams.length}` : `WHERE u.ativo = $${queryParams.length}`;
        }
        
        // Buscar usuários com filtro opcional
        const usuariosResult = await pool.query(`
            SELECT 
                u.id,
                u.nome,
                u.email,
                u.telefone,
                u.perfil_id,
                u.ativo,
                u.data_admissao,
                u.meta_vendas_mensal,
                u.observacao_geral,
                p.nome as perfil_nome,
                p.descricao as perfil_descricao
            FROM usuarios u
            LEFT JOIN perfis p ON u.perfil_id = p.id
            ${whereClause}
            ORDER BY u.nome
        `, queryParams);

        const usuarios = usuariosResult.rows;

        // Para cada usuário, buscar estatísticas de clientes
        for (let usuario of usuarios) {
            // Buscar clientes onde o usuário é vendedor_responsavel (por ID ou nome como fallback)
            const clientesResult = await pool.query(`
                SELECT 
                    COUNT(*) as total_clientes,
                    COUNT(CASE WHEN status = 'Prospecção' THEN 1 END) as prospeccao,
                    COUNT(CASE WHEN status = 'Qualificação' THEN 1 END) as qualificacao,
                    COUNT(CASE WHEN status = 'Proposta' THEN 1 END) as proposta,
                    COUNT(CASE WHEN status = 'Fechamento' THEN 1 END) as fechamento,
                    COUNT(CASE WHEN status = 'Efetivação' THEN 1 END) as efetivacao,
                    COUNT(CASE WHEN status IN ('Fechamento', 'Efetivação') THEN 1 END) as vendas_fechadas
                FROM clientes
                WHERE vendedor_responsavel_id = $1 
                   OR (vendedor_responsavel = $2 AND vendedor_responsavel_id IS NULL)
            `, [usuario.id, usuario.nome]);

            usuario.estatisticas = clientesResult.rows[0] || {
                total_clientes: 0,
                prospeccao: 0,
                qualificacao: 0,
                proposta: 0,
                fechamento: 0,
                efetivacao: 0,
                vendas_fechadas: 0
            };

            // Calcular taxa de conversão
            const total = parseInt(usuario.estatisticas.total_clientes) || 0;
            const fechadas = parseInt(usuario.estatisticas.vendas_fechadas) || 0;
            usuario.estatisticas.taxa_conversao = total > 0 
                ? ((fechadas / total) * 100).toFixed(1) 
                : 0;

            // Progresso da meta (se houver meta definida)
            if (usuario.meta_vendas_mensal && usuario.meta_vendas_mensal > 0) {
                usuario.estatisticas.progresso_meta = ((fechadas / usuario.meta_vendas_mensal) * 100).toFixed(1);
            } else {
                usuario.estatisticas.progresso_meta = null;
            }
        }

        res.json({
            success: true,
            total: usuarios.length,
            usuarios
        });

    } catch (error) {
        console.error('Erro ao buscar usuários com estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
};

// ============================================================================
// DETALHES DE UM USUÁRIO ESPECÍFICO
// ============================================================================
exports.getUsuarioDetalhes = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar usuário
        const usuarioResult = await pool.query(`
            SELECT 
                u.*,
                p.nome as perfil_nome,
                p.descricao as perfil_descricao
            FROM usuarios u
            LEFT JOIN perfis p ON u.perfil_id = p.id
            WHERE u.id = $1
        `, [id]);

        if (usuarioResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const usuario = usuarioResult.rows[0];
        delete usuario.senha_hash; // Remover senha

        // Buscar todos os clientes do vendedor (por ID ou nome como fallback)
        const clientesResult = await pool.query(`
            SELECT 
                id, nome, status, tarefas_concluidas,
                cidade, uf as estado, tipo, telefone
            FROM clientes
            WHERE vendedor_responsavel_id = $1
               OR (vendedor_responsavel = $2 AND vendedor_responsavel_id IS NULL)
            ORDER BY id DESC
        `, [id, usuario.nome]);

        usuario.clientes = clientesResult.rows;

        // Estatísticas detalhadas
        const stats = {
            total: clientesResult.rows.length,
            por_status: {},
            por_mes: {},
            progresso_etapas: {}
        };

        // Contar por status
        clientesResult.rows.forEach(cliente => {
            stats.por_status[cliente.status] = (stats.por_status[cliente.status] || 0) + 1;
            
            // Sem data de criação disponível

            // Progresso nas etapas
            if (cliente.tarefas_concluidas) {
                Object.keys(cliente.tarefas_concluidas).forEach(etapa => {
                    const tarefas = cliente.tarefas_concluidas[etapa] || [];
                    if (!stats.progresso_etapas[etapa]) {
                        stats.progresso_etapas[etapa] = { total_clientes: 0, total_tarefas: 0 };
                    }
                    stats.progresso_etapas[etapa].total_clientes++;
                    stats.progresso_etapas[etapa].total_tarefas += tarefas.length;
                });
            }
        });

        usuario.estatisticas_detalhadas = stats;

        // Buscar histórico de ações do usuário
        const historicoResult = await pool.query(`
            SELECT 
                ht.id, ht.etapa, ht.acao_idx, ht.acao_nome as acao, ht.operacao, ht.data_hora,
                c.nome as cliente_nome
            FROM historico_tarefas ht
            JOIN clientes c ON ht.cliente_id = c.id
            WHERE ht.usuario_id = $1
            ORDER BY ht.data_hora DESC
            LIMIT 50
        `, [id]);

        usuario.historico_recente = historicoResult.rows;

        res.json({
            success: true,
            usuario
        });

    } catch (error) {
        console.error('Erro ao buscar detalhes do usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes do usuário' });
    }
};

// ============================================================================
// ATUALIZAR OBSERVAÇÃO DO GESTOR
// ============================================================================
exports.atualizarObservacao = async (req, res) => {
    try {
        const { id } = req.params;
        const { observacao_geral } = req.body;
        const gestor_id = req.usuario.id;

        // Verificar permissão (apenas admin ou diretor)
        const gestorResult = await pool.query(`
            SELECT perfil_id FROM usuarios WHERE id = $1
        `, [gestor_id]);

        const perfil_id = gestorResult.rows[0]?.perfil_id;
        if (perfil_id !== 1 && perfil_id !== 6) { // admin ou diretor_comercial
            return res.status(403).json({ 
                error: 'Apenas administradores ou diretores podem adicionar observações' 
            });
        }

        // Buscar observação atual
        const atualResult = await pool.query(`
            SELECT observacao_geral FROM usuarios WHERE id = $1
        `, [id]);

        if (atualResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Adicionar nova observação com timestamp
        const dataHora = new Date().toLocaleString('pt-BR');
        const gestorNome = req.usuario.nome || 'Gestor';
        const novaObservacao = `[${dataHora} - ${gestorNome}]: ${observacao_geral}`;
        
        const observacaoAtual = atualResult.rows[0].observacao_geral || '';
        const observacaoFinal = observacaoAtual 
            ? `${observacaoAtual}\n\n${novaObservacao}`
            : novaObservacao;

        // Atualizar
        const result = await pool.query(`
            UPDATE usuarios 
            SET observacao_geral = $1
            WHERE id = $2
            RETURNING id, nome, observacao_geral
        `, [observacaoFinal, id]);

        res.json({
            success: true,
            message: 'Observação adicionada com sucesso',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar observação:', error);
        res.status(500).json({ error: 'Erro ao atualizar observação' });
    }
};

// ============================================================================
// ATUALIZAR META DE VENDAS
// ============================================================================
exports.atualizarMeta = async (req, res) => {
    try {
        const { id } = req.params;
        const { meta_vendas_mensal } = req.body;
        const gestor_id = req.usuario.id;

        // Verificar permissão
        const gestorResult = await pool.query(`
            SELECT perfil_id FROM usuarios WHERE id = $1
        `, [gestor_id]);

        const perfil_id = gestorResult.rows[0]?.perfil_id;
        if (perfil_id !== 1 && perfil_id !== 6) {
            return res.status(403).json({ 
                error: 'Apenas administradores ou diretores podem definir metas' 
            });
        }

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
// DASHBOARD GERAL DE VENDEDORES
// ============================================================================
exports.getDashboardVendedores = async (req, res) => {
    try {
        // Ranking de vendedores por vendas fechadas
        const rankingResult = await pool.query(`
            SELECT 
                vendedor_responsavel as vendedor,
                COUNT(*) as total_clientes,
                COUNT(CASE WHEN status IN ('Fechamento', 'Efetivação') THEN 1 END) as vendas_fechadas,
                COUNT(CASE WHEN status = 'Prospecção' THEN 1 END) as em_prospeccao
            FROM clientes
            WHERE vendedor_responsavel IS NOT NULL AND vendedor_responsavel != ''
            GROUP BY vendedor_responsavel
            ORDER BY vendas_fechadas DESC
        `);

        // Estatísticas gerais
        const geraisResult = await pool.query(`
            SELECT 
                COUNT(DISTINCT vendedor_responsavel) as total_vendedores_ativos,
                COUNT(*) as total_clientes,
                COUNT(CASE WHEN status IN ('Fechamento', 'Efetivação') THEN 1 END) as total_vendas,
                COUNT(CASE WHEN status = 'Prospecção' THEN 1 END) as total_prospeccao,
                ROUND(
                    COUNT(CASE WHEN status IN ('Fechamento', 'Efetivação') THEN 1 END)::numeric / 
                    NULLIF(COUNT(*), 0) * 100, 1
                ) as taxa_conversao_geral
            FROM clientes
            WHERE vendedor_responsavel IS NOT NULL AND vendedor_responsavel != ''
        `);

        res.json({
            success: true,
            dashboard: {
                estatisticas_gerais: geraisResult.rows[0],
                ranking_vendedores: rankingResult.rows
            }
        });

    } catch (error) {
        console.error('Erro ao gerar dashboard:', error);
        res.status(500).json({ error: 'Erro ao gerar dashboard' });
    }
};

// ============================================================================
// LISTAR CLIENTES DE UM VENDEDOR
// ============================================================================
exports.getClientesDoVendedor = async (req, res) => {
    try {
        const { nome } = req.params;
        const { status, limit = 50 } = req.query;

        let query = `
            SELECT 
                id, nome, status, cidade, estado, 
                vendedor_responsavel, tarefas_concluidas, created_at
            FROM clientes
            WHERE vendedor_responsavel = $1
        `;
        const params = [decodeURIComponent(nome)];

        if (status) {
            query += ` AND status = $2`;
            params.push(status);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));

        const result = await pool.query(query, params);

        res.json({
            success: true,
            vendedor: decodeURIComponent(nome),
            total: result.rows.length,
            clientes: result.rows
        });

    } catch (error) {
        console.error('Erro ao buscar clientes do vendedor:', error);
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
};
