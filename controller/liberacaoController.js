/**
 * Controller para gerenciamento de liberação de etapas
 * 
 * Regras de negócio:
 * - Perfil 1 (administrador) pode avançar livremente sem solicitar liberação
 * - Outros perfis precisam solicitar liberação para avançar para próxima etapa
 * - Cada etapa tem um perfil responsável definido na tabela etapa_perfil
 * - O responsável pela próxima etapa ou o administrador pode liberar
 */
const pool = require('../config/db');

// ============================================================================
// OBTER CONFIGURAÇÃO DAS ETAPAS
// ============================================================================
exports.getEtapasConfig = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ep.etapa_id,
                ep.etapa_nome,
                ep.ordem,
                ep.pode_avancar_sem_liberacao,
                p.id as perfil_id,
                p.nome as perfil_responsavel,
                p.descricao as perfil_descricao
            FROM etapa_perfil ep
            LEFT JOIN perfis p ON ep.perfil_responsavel = p.id
            ORDER BY ep.ordem
        `);

        res.json({
            success: true,
            etapas: result.rows
        });
    } catch (error) {
        console.error('Erro ao obter configuração de etapas:', error);
        res.status(500).json({ error: 'Erro ao obter configuração de etapas' });
    }
};

// ============================================================================
// VERIFICAR SE USUÁRIO PODE AVANÇAR ETAPA
// ============================================================================
exports.verificarPermissaoAvancar = async (req, res) => {
    try {
        const { cliente_id, etapa_destino } = req.params;
        const usuario_id = req.usuario.id;
        const perfil_usuario = req.usuario.perfil;

        // Administrador pode avançar livremente
        if (perfil_usuario === 'administrador') {
            return res.json({
                pode_avancar: true,
                requer_liberacao: false,
                motivo: 'Administrador tem permissão total'
            });
        }

        // Buscar informações do usuário
        const usuarioResult = await pool.query(`
            SELECT u.perfil_id, p.nome as perfil_nome
            FROM usuarios u
            JOIN perfis p ON u.perfil_id = p.id
            WHERE u.id = $1
        `, [usuario_id]);

        if (usuarioResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const perfil_id = usuarioResult.rows[0].perfil_id;

        // Administrador (perfil_id = 1) pode avançar livremente
        if (perfil_id === 1) {
            return res.json({
                pode_avancar: true,
                requer_liberacao: false,
                motivo: 'Administrador tem permissão total'
            });
        }

        // Verificar se a etapa destino permite avanço livre
        const etapaResult = await pool.query(`
            SELECT * FROM etapa_perfil WHERE etapa_id = $1
        `, [etapa_destino]);

        if (etapaResult.rows.length === 0) {
            return res.json({
                pode_avancar: true,
                requer_liberacao: false,
                motivo: 'Etapa não mapeada - avanço permitido'
            });
        }

        const etapa = etapaResult.rows[0];

        // Se a etapa permite avanço sem liberação
        if (etapa.pode_avancar_sem_liberacao) {
            return res.json({
                pode_avancar: true,
                requer_liberacao: false,
                motivo: 'Etapa não requer liberação'
            });
        }

        // Verificar se já existe liberação pendente ou aprovada
        const liberacaoResult = await pool.query(`
            SELECT * FROM liberacao_etapas 
            WHERE cliente_id = $1 
            AND etapa_destino = $2
            AND status IN ('pendente', 'aprovada')
            ORDER BY solicitado_em DESC
            LIMIT 1
        `, [cliente_id, etapa_destino]);

        if (liberacaoResult.rows.length > 0) {
            const liberacao = liberacaoResult.rows[0];
            
            if (liberacao.status === 'aprovada') {
                return res.json({
                    pode_avancar: true,
                    requer_liberacao: false,
                    liberacao_id: liberacao.id,
                    motivo: 'Liberação já aprovada'
                });
            }

            return res.json({
                pode_avancar: false,
                requer_liberacao: true,
                liberacao_pendente: true,
                liberacao_id: liberacao.id,
                motivo: 'Aguardando aprovação da liberação'
            });
        }

        // Precisa solicitar liberação
        return res.json({
            pode_avancar: false,
            requer_liberacao: true,
            liberacao_pendente: false,
            perfil_responsavel: etapa.perfil_responsavel,
            motivo: 'Necessário solicitar liberação para avançar para esta etapa'
        });

    } catch (error) {
        console.error('Erro ao verificar permissão:', error);
        res.status(500).json({ error: 'Erro ao verificar permissão' });
    }
};

// ============================================================================
// SOLICITAR LIBERAÇÃO DE ETAPA
// ============================================================================
exports.solicitarLiberacao = async (req, res) => {
    try {
        const { cliente_id, etapa_atual, etapa_destino, observacao } = req.body;
        const usuario_id = req.usuario.id;

        // Verificar se já existe solicitação pendente
        const existeResult = await pool.query(`
            SELECT * FROM liberacao_etapas 
            WHERE cliente_id = $1 
            AND etapa_destino = $2
            AND status = 'pendente'
        `, [cliente_id, etapa_destino]);

        if (existeResult.rows.length > 0) {
            return res.status(400).json({
                error: 'Já existe uma solicitação pendente para esta etapa'
            });
        }

        // Criar nova solicitação
        const result = await pool.query(`
            INSERT INTO liberacao_etapas 
            (cliente_id, etapa_atual, etapa_destino, solicitado_por, observacao)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [cliente_id, etapa_atual, etapa_destino, usuario_id, observacao]);

        // Buscar informações adicionais
        const infoResult = await pool.query(`
            SELECT 
                l.*,
                u.nome as solicitante_nome,
                c.nome as cliente_nome,
                ep.etapa_nome,
                p.nome as perfil_responsavel
            FROM liberacao_etapas l
            JOIN usuarios u ON l.solicitado_por = u.id
            JOIN clientes c ON l.cliente_id = c.id
            LEFT JOIN etapa_perfil ep ON l.etapa_destino = ep.etapa_id
            LEFT JOIN perfis p ON ep.perfil_responsavel = p.id
            WHERE l.id = $1
        `, [result.rows[0].id]);

        res.status(201).json({
            success: true,
            message: 'Solicitação de liberação criada com sucesso',
            liberacao: infoResult.rows[0]
        });

    } catch (error) {
        console.error('Erro ao solicitar liberação:', error);
        res.status(500).json({ error: 'Erro ao solicitar liberação' });
    }
};

// ============================================================================
// APROVAR/REJEITAR LIBERAÇÃO
// ============================================================================
exports.processarLiberacao = async (req, res) => {
    try {
        const { id } = req.params;
        const { acao, observacao } = req.body; // acao: 'aprovar' ou 'rejeitar'
        const usuario_id = req.usuario.id;
        const perfil_usuario = req.usuario.perfil;

        // Buscar a liberação
        const liberacaoResult = await pool.query(`
            SELECT l.*, ep.perfil_responsavel
            FROM liberacao_etapas l
            LEFT JOIN etapa_perfil ep ON l.etapa_destino = ep.etapa_id
            WHERE l.id = $1
        `, [id]);

        if (liberacaoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        const liberacao = liberacaoResult.rows[0];

        // Verificar se já foi processada
        if (liberacao.status !== 'pendente') {
            return res.status(400).json({
                error: `Solicitação já foi ${liberacao.status}`
            });
        }

        // Verificar permissão para aprovar/rejeitar
        // Administrador pode sempre
        // Ou o responsável pela etapa destino
        const usuarioResult = await pool.query(`
            SELECT perfil_id FROM usuarios WHERE id = $1
        `, [usuario_id]);

        const perfil_id = usuarioResult.rows[0].perfil_id;
        const pode_processar = perfil_id === 1 || // Administrador
                               perfil_id === liberacao.perfil_responsavel;

        if (!pode_processar) {
            return res.status(403).json({
                error: 'Você não tem permissão para processar esta solicitação'
            });
        }

        // Processar a liberação
        const novo_status = acao === 'aprovar' ? 'aprovada' : 'rejeitada';
        const observacao_final = observacao 
            ? `${liberacao.observacao || ''}\n[${acao.toUpperCase()}]: ${observacao}`
            : liberacao.observacao;

        const result = await pool.query(`
            UPDATE liberacao_etapas 
            SET status = $1, 
                liberado_por = $2, 
                liberado_em = CURRENT_TIMESTAMP,
                observacao = $3
            WHERE id = $4
            RETURNING *
        `, [novo_status, usuario_id, observacao_final, id]);

        res.json({
            success: true,
            message: `Solicitação ${novo_status} com sucesso`,
            liberacao: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao processar liberação:', error);
        res.status(500).json({ error: 'Erro ao processar liberação' });
    }
};

// ============================================================================
// LISTAR LIBERAÇÕES PENDENTES
// ============================================================================
exports.getLiberacoesPendentes = async (req, res) => {
    try {
        const usuario_id = req.usuario.id;
        
        // Buscar perfil do usuário
        const usuarioResult = await pool.query(`
            SELECT perfil_id FROM usuarios WHERE id = $1
        `, [usuario_id]);

        const perfil_id = usuarioResult.rows[0].perfil_id;

        // Administrador vê todas, outros veem apenas as que são responsáveis
        let query;
        let params = [];

        if (perfil_id === 1) {
            // Administrador vê todas
            query = `
                SELECT 
                    l.*,
                    u_sol.nome as solicitante_nome,
                    u_lib.nome as liberador_nome,
                    c.nome as cliente_nome,
                    ep.etapa_nome,
                    p.nome as perfil_responsavel
                FROM liberacao_etapas l
                JOIN usuarios u_sol ON l.solicitado_por = u_sol.id
                LEFT JOIN usuarios u_lib ON l.liberado_por = u_lib.id
                JOIN clientes c ON l.cliente_id = c.id
                LEFT JOIN etapa_perfil ep ON l.etapa_destino = ep.etapa_id
                LEFT JOIN perfis p ON ep.perfil_responsavel = p.id
                WHERE l.status = 'pendente'
                ORDER BY l.solicitado_em DESC
            `;
        } else {
            // Outros veem apenas as que são responsáveis
            query = `
                SELECT 
                    l.*,
                    u_sol.nome as solicitante_nome,
                    u_lib.nome as liberador_nome,
                    c.nome as cliente_nome,
                    ep.etapa_nome,
                    p.nome as perfil_responsavel
                FROM liberacao_etapas l
                JOIN usuarios u_sol ON l.solicitado_por = u_sol.id
                LEFT JOIN usuarios u_lib ON l.liberado_por = u_lib.id
                JOIN clientes c ON l.cliente_id = c.id
                LEFT JOIN etapa_perfil ep ON l.etapa_destino = ep.etapa_id
                LEFT JOIN perfis p ON ep.perfil_responsavel = p.id
                WHERE l.status = 'pendente'
                AND ep.perfil_responsavel = $1
                ORDER BY l.solicitado_em DESC
            `;
            params = [perfil_id];
        }

        const result = await pool.query(query, params);

        res.json({
            success: true,
            total: result.rows.length,
            liberacoes: result.rows
        });

    } catch (error) {
        console.error('Erro ao listar liberações pendentes:', error);
        res.status(500).json({ error: 'Erro ao listar liberações pendentes' });
    }
};

// ============================================================================
// HISTÓRICO DE LIBERAÇÕES DE UM CLIENTE
// ============================================================================
exports.getHistoricoLiberacoes = async (req, res) => {
    try {
        const { cliente_id } = req.params;

        const result = await pool.query(`
            SELECT 
                l.*,
                u_sol.nome as solicitante_nome,
                u_lib.nome as liberador_nome,
                ep.etapa_nome
            FROM liberacao_etapas l
            JOIN usuarios u_sol ON l.solicitado_por = u_sol.id
            LEFT JOIN usuarios u_lib ON l.liberado_por = u_lib.id
            LEFT JOIN etapa_perfil ep ON l.etapa_destino = ep.etapa_id
            WHERE l.cliente_id = $1
            ORDER BY l.solicitado_em DESC
        `, [cliente_id]);

        res.json({
            success: true,
            historico: result.rows
        });

    } catch (error) {
        console.error('Erro ao buscar histórico de liberações:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico de liberações' });
    }
};

// ============================================================================
// OBTER TODOS OS PERFIS
// ============================================================================
exports.getPerfis = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nome, descricao 
            FROM perfis 
            ORDER BY id
        `);

        res.json({
            success: true,
            perfis: result.rows
        });
    } catch (error) {
        console.error('Erro ao obter perfis:', error);
        res.status(500).json({ error: 'Erro ao obter perfis' });
    }
};

// ============================================================================
// VERIFICAR STATUS DE LIBERAÇÃO DE UMA ETAPA ESPECÍFICA
// ============================================================================
// Este endpoint é usado pelo frontend para saber se pode avançar para uma etapa
exports.verificarStatusLiberacao = async (req, res) => {
    try {
        const { cliente_id, etapa_id } = req.params;
        const usuario_id = req.usuario.id;

        // Ordem das etapas
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

        const idxEtapa = etapasOrdem.indexOf(etapa_id);
        
        // Primeira etapa sempre liberada
        if (idxEtapa === 0) {
            return res.json({
                liberado: true,
                motivo: 'Primeira etapa - sempre liberada'
            });
        }

        // Verificar perfil do usuário
        const usuarioResult = await pool.query(`
            SELECT perfil_id FROM usuarios WHERE id = $1
        `, [usuario_id]);

        if (usuarioResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const perfil_id = usuarioResult.rows[0].perfil_id;

        // Administrador pode sempre
        if (perfil_id === 1) {
            return res.json({
                liberado: true,
                motivo: 'Administrador tem permissão total'
            });
        }

        // Verificar se existe liberação aprovada para esta etapa
        const liberacaoResult = await pool.query(`
            SELECT * FROM liberacao_etapas 
            WHERE cliente_id = $1 
            AND etapa_destino = $2
            AND status = 'aprovada'
            ORDER BY liberado_em DESC
            LIMIT 1
        `, [cliente_id, etapa_id]);

        if (liberacaoResult.rows.length > 0) {
            return res.json({
                liberado: true,
                motivo: 'Liberação aprovada',
                liberacao: liberacaoResult.rows[0]
            });
        }

        // Verificar se a etapa anterior foi concluída (todas as tarefas marcadas)
        const etapaAnterior = idxEtapa > 0 ? etapasOrdem[idxEtapa - 1] : null;
        
        if (etapaAnterior) {
            // Buscar tarefas concluídas do cliente
            const clienteResult = await pool.query(`
                SELECT tarefas_concluidas FROM clientes WHERE id = $1
            `, [cliente_id]);

            if (clienteResult.rows.length > 0) {
                const tarefasConcluidas = clienteResult.rows[0].tarefas_concluidas || {};
                
                // Verificar se a etapa anterior tem tarefas concluídas
                const tarefasEtapaAnterior = tarefasConcluidas[etapaAnterior] || [];
                
                // Se tem pelo menos uma tarefa concluída na etapa anterior, 
                // considera como "etapa em andamento" e pode avançar
                // Para considerar "completa", precisa ter todas (isso pode ser configurável)
                if (tarefasEtapaAnterior.length >= 1) {
                    return res.json({
                        liberado: true,
                        etapa_anterior_completa: true,
                        motivo: 'Etapa anterior tem progresso - pode avançar'
                    });
                }
            }
        }

        // Verificar se há solicitação pendente
        const pendentResult = await pool.query(`
            SELECT * FROM liberacao_etapas 
            WHERE cliente_id = $1 
            AND etapa_destino = $2
            AND status = 'pendente'
            LIMIT 1
        `, [cliente_id, etapa_id]);

        if (pendentResult.rows.length > 0) {
            return res.json({
                liberado: false,
                pendente: true,
                motivo: 'Solicitação de liberação aguardando aprovação',
                solicitacao: pendentResult.rows[0]
            });
        }

        // Não tem liberação - bloqueado
        return res.json({
            liberado: false,
            etapa_anterior_completa: false,
            motivo: 'Necessário concluir etapa anterior ou solicitar liberação'
        });

    } catch (error) {
        console.error('Erro ao verificar status de liberação:', error);
        res.status(500).json({ error: 'Erro ao verificar status de liberação' });
    }
};
