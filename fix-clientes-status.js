/**
 * Script para corrigir os status dos clientes para usar os IDs corretos da esteira
 * e calcular o status baseado nas tarefas concluídas
 */
require('dotenv').config();
const pool = require('./config/db');

// Mapeamento de status antigos para IDs da esteira
const STATUS_MAP = {
    'Prospecção': 'prospeccao',
    'Prospeccao': 'prospeccao',
    'Qualificação': 'aumentar_conexao',
    'Qualificacao': 'aumentar_conexao',
    'Proposta': 'envio_consultor',
    'Fechamento': 'efetivacao',
    'Efetivação': 'registros_legais',
    'Efetivacao': 'registros_legais',
    'Em análise': 'prospeccao',
    'Em analise': 'prospeccao',
    'Negociação': 'envio_consultor',
    'Negociacao': 'envio_consultor',
    'Novo': 'prospeccao',
    null: 'prospeccao',
    '': 'prospeccao'
};

// IDs das etapas em ordem
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

/**
 * Calcula a etapa atual baseado nas tarefas concluídas
 */
function calcularEtapaAtual(tarefasConcluidas) {
    if (!tarefasConcluidas || typeof tarefasConcluidas !== 'object') {
        return 'prospeccao';
    }

    // Percorre as etapas em ordem e encontra a primeira não completa
    for (let i = 0; i < ETAPAS_ORDEM.length; i++) {
        const etapaId = ETAPAS_ORDEM[i];
        const tarefas = tarefasConcluidas[etapaId];
        
        // Se não tem tarefas ou tem menos de 5 (assumindo 5 ações por etapa), retorna esta etapa
        if (!tarefas || !Array.isArray(tarefas) || tarefas.length < 5) {
            return etapaId;
        }
    }
    
    // Se todas estão completas, retorna a última
    return 'renovacao';
}

async function fixClientesStatus() {
    console.log('🔧 Iniciando correção de status dos clientes...\n');
    
    try {
        // Buscar todos os clientes
        const result = await pool.query('SELECT id, nome, status, tarefas_concluidas FROM clientes');
        console.log(`📋 Total de clientes encontrados: ${result.rows.length}\n`);
        
        let atualizados = 0;
        let semMudanca = 0;
        
        for (const cliente of result.rows) {
            let novoStatus;
            
            // Se tem tarefas concluídas, calcula o status baseado nelas
            if (cliente.tarefas_concluidas && Object.keys(cliente.tarefas_concluidas).length > 0) {
                novoStatus = calcularEtapaAtual(cliente.tarefas_concluidas);
            } else if (STATUS_MAP[cliente.status]) {
                // Se não tem tarefas mas tem status antigo, converte
                novoStatus = STATUS_MAP[cliente.status];
            } else if (ETAPAS_ORDEM.includes(cliente.status)) {
                // Se já está com ID correto, mantém
                novoStatus = cliente.status;
            } else {
                // Caso contrário, começa do início
                novoStatus = 'prospeccao';
            }
            
            // Só atualiza se mudou
            if (novoStatus !== cliente.status) {
                await pool.query(
                    'UPDATE clientes SET status = $1 WHERE id = $2',
                    [novoStatus, cliente.id]
                );
                console.log(`   ✅ ${cliente.nome}: "${cliente.status || '(vazio)'}" → "${novoStatus}"`);
                atualizados++;
            } else {
                semMudanca++;
            }
        }
        
        console.log(`\n📊 Resumo:`);
        console.log(`   - Atualizados: ${atualizados}`);
        console.log(`   - Sem mudança: ${semMudanca}`);
        console.log(`   - Total: ${result.rows.length}`);
        
    } catch (error) {
        console.error('❌ Erro ao corrigir status:', error);
    } finally {
        await pool.end();
    }
}

fixClientesStatus();
