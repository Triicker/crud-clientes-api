/**
 * Obter status e tarefas da esteira de um cliente
 * GET /api/clientes/:id/esteira
 */
exports.getEsteiraCliente = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT status, tarefas_concluidas FROM clientes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter esteira do cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao obter esteira.' });
  }
};

// Configuração das etapas na ordem correta (12 etapas)
const ETAPAS_ORDEM = [
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

// Labels legíveis das etapas
const ETAPAS_LABELS = {
  'prospeccao': 'Prospecção 3 Canais',
  'aumentar_conexao': 'Aumentar Conexão',
  'envio_consultor': 'Envio de Consultor',
  'efetivacao': 'Efetivação',
  'registros_legais': 'Registros Legais',
  'separacao': 'Separação',
  'entrega': 'Entrega',
  'recebimentos': 'Recebimentos',
  'formacao': 'Formação',
  'documentarios': 'Documentários',
  'gerar_graficos': 'Gerar Gráficos',
  'renovacao': 'Renovação'
};

// Número mínimo de tarefas para considerar etapa como concluída
const TAREFAS_PARA_CONCLUIR = 3;

/**
 * Calcula a etapa atual baseado nas tarefas concluídas
 * Retorna a próxima etapa não concluída ou a última se todas estiverem completas
 */
function calcularEtapaAtual(tarefasConcluidas) {
  if (!tarefasConcluidas || typeof tarefasConcluidas !== 'object') {
    return ETAPAS_ORDEM[0]; // Retorna primeira etapa se não houver dados
  }

  // Encontrar a primeira etapa NÃO concluída
  for (const etapaId of ETAPAS_ORDEM) {
    const tarefasDaEtapa = tarefasConcluidas[etapaId] || [];
    const qtdConcluidas = Array.isArray(tarefasDaEtapa) ? tarefasDaEtapa.length : 0;
    
    // Se a etapa não está concluída (menos que o mínimo de tarefas), essa é a etapa atual
    if (qtdConcluidas < TAREFAS_PARA_CONCLUIR) {
      return etapaId;
    }
  }
  
  // Se todas estão concluídas, retorna a última (renovação)
  return ETAPAS_ORDEM[ETAPAS_ORDEM.length - 1];
}

// Arquivo: controller/tarefasController.js

/**
 * Controller para gerenciar as tarefas (checklist) da Esteira de Trabalho
 */
const pool = require('../config/db');

/**
 * Atualizar as tarefas concluídas de um cliente
 * PUT /api/clientes/:id/tarefas
 * 
 * IMPORTANTE: Este endpoint também atualiza automaticamente o status do cliente
 * baseado nas tarefas concluídas!
 */
exports.updateTarefas = async (req, res) => {
  console.log('📥 Recebido PUT /api/clientes/:id/tarefas');
  
  const { id } = req.params;
  const { tarefas_concluidas } = req.body;

  console.log('📋 Cliente ID:', id);
  console.log('📦 Tarefas:', JSON.stringify(tarefas_concluidas, null, 2));
  console.log('👤 req.usuario:', req.usuario); // Debug do objeto completo
  console.log('🔑 req.headers.authorization:', req.headers.authorization ? 'Presente' : 'AUSENTE');

  // Validação de entrada
  if (!tarefas_concluidas || typeof tarefas_concluidas !== 'object') {
    console.error('❌ tarefas_concluidas inválido:', tarefas_concluidas);
    return res.status(400).json({ erro: 'Dados de tarefas inválidos.' });
  }

  try {
    // Busca o cliente atual
    const clienteResult = await pool.query(
      'SELECT id, nome, status, vendedor_responsavel FROM clientes WHERE id = $1',
      [id]
    );
    
    if (clienteResult.rows.length === 0) {
      console.error('❌ Cliente não encontrado:', id);
      return res.status(404).json({ erro: 'Cliente não encontrado.' });
    }
    
    const cliente = clienteResult.rows[0];
    console.log('📊 Cliente atual:', cliente);
    
    // Calcular a etapa atual baseada nas tarefas concluídas
    const novoStatus = calcularEtapaAtual(tarefas_concluidas);
    console.log('🎯 Novo status calculado:', novoStatus, '(' + (ETAPAS_LABELS[novoStatus] || novoStatus) + ')');

    // ========== AUTO-ATRIBUIÇÃO DO VENDEDOR ==========
    let vendedorNome = cliente.vendedor_responsavel;
    
    // Se não tem vendedor atribuído E o usuário é vendedor, atribui automaticamente
    if (!vendedorNome && req.usuario && req.usuario.id) {
      console.log('🔄 Cliente sem vendedor. Verificando se usuário pode ser atribuído...');
      
      // Busca informações do usuário autenticado
      const usuarioResult = await pool.query(
        'SELECT id, nome, perfil_id FROM usuarios WHERE id = $1',
        [req.usuario.id] // Corrigido: req.usuario
      );
      
      if (usuarioResult.rows.length > 0) {
        const usuario = usuarioResult.rows[0];
        console.log('👤 Usuário que marcou tarefa:', usuario);
        
        // Verifica se é vendedor (perfil_id 2, 3 ou 4)
        const perfisVendedor = [2, 3, 4]; // Vendedor, Comercial, Consultor
        
        if (perfisVendedor.includes(usuario.perfil_id)) {
          vendedorNome = usuario.nome;
          console.log('✅ AUTO-ATRIBUINDO vendedor:', vendedorNome);
        } else {
          console.log('⚠️ Usuário não é vendedor (perfil_id:', usuario.perfil_id, ')');
        }
      }
    } else if (vendedorNome) {
      console.log('ℹ️ Cliente já possui vendedor atribuído:', vendedorNome);
    } else {
      console.log('⚠️ Sem usuário autenticado (req.usuario não disponível)');
    }
    // ================================================

    // Atualiza as tarefas, status E vendedor no banco
    const query = `
      UPDATE clientes 
      SET tarefas_concluidas = $1,
          status = $2,
          vendedor_responsavel = $3
      WHERE id = $4
      RETURNING *;
    `;
    
    const values = [JSON.stringify(tarefas_concluidas), novoStatus, vendedorNome, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado.' });
    }

    console.log('✅ Cliente atualizado - Status:', result.rows[0].status);
    console.log('✅ Vendedor atribuído:', result.rows[0].vendedor_responsavel || 'Nenhum');
    console.log('📤 Retornando resposta para o frontend\n');
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('❌❌❌ ERRO CRÍTICO ao atualizar tarefas ❌❌❌');
    console.error('Tipo do erro:', error.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('Código SQL:', error.code);
    console.error('Detalhes:', error.detail);
    
    res.status(500).json({ 
      erro: 'Erro interno do servidor ao atualizar tarefas.',
      mensagem: error.message,
      tipo: error.name
    });
  }
};

/**
 * Obter o progresso geral das tarefas de todos os clientes
 * GET /api/tarefas/progresso
 */
exports.getProgressoGeral = async (req, res) => {
  try {
    const query = `
      SELECT 
        status,
        COUNT(*) as total_clientes,
        AVG(
          CASE 
            WHEN tarefas_concluidas IS NOT NULL 
            THEN jsonb_array_length(tarefas_concluidas->status)
            ELSE 0
          END
        ) as media_tarefas_concluidas
      FROM clientes
      WHERE status IS NOT NULL
      GROUP BY status
      ORDER BY status;
    `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao obter progresso geral:', error);
    res.status(500).json({ erro: 'Erro ao obter progresso geral.' });
  }
};
