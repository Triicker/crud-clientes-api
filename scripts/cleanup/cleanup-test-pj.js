/**
 * Script para limpeza de registros PJ de teste
 * Remove empresas fictícias que foram criadas apenas para testar o sistema
 * 
 * IMPORTANTE: Executar apenas após conferir a lista de registros a serem removidos
 */
require('dotenv').config();
const pool = require('./config/db');

// Lista de empresas PJ de teste identificadas para remoção
const EMPRESAS_TESTE = [
    'Construtora Progresso',
    'Empresa Antiga SA',
    'Comércio Local',
    'Beleza & Estilo',
    'Empreiteira União',
    'Loja Virtual ME',
    'Obras Master',
    'Imobiliária Central',
    'Moda Fashion Ltda'
];

async function cleanupTestPJ() {
    try {
        console.log('🔍 Iniciando limpeza de registros PJ de teste...\n');
        
        // 1. Primeiro, listar os registros que serão removidos para confirmação
        const querySelect = `
            SELECT id, nome, tipo, cnpj, cidade, uf, status, vendedor_responsavel
            FROM clientes
            WHERE tipo = 'PJ' AND nome = ANY($1::text[])
            ORDER BY nome
        `;
        
        const clientesParaRemover = await pool.query(querySelect, [EMPRESAS_TESTE]);
        
        if (clientesParaRemover.rows.length === 0) {
            console.log('✅ Nenhum registro de teste encontrado para remoção.');
            return;
        }
        
        console.log(`📋 Encontrados ${clientesParaRemover.rows.length} registros para remoção:\n`);
        clientesParaRemover.rows.forEach((cliente, index) => {
            console.log(`${index + 1}. ${cliente.nome}`);
            console.log(`   - ID: ${cliente.id}`);
            console.log(`   - CNPJ: ${cliente.cnpj || 'N/A'}`);
            console.log(`   - Cidade/UF: ${cliente.cidade}/${cliente.uf}`);
            console.log(`   - Status: ${cliente.status}`);
            console.log(`   - Vendedor: ${cliente.vendedor_responsavel || 'N/A'}`);
            console.log('');
        });
        
        // 2. Verificar se existem dados relacionados (equipe, corpo docente, propostas, etc)
        const queryRelacionados = `
            SELECT 
                c.id,
                c.nome,
                (SELECT COUNT(*) FROM equipe_pedagogica WHERE cliente_id = c.id) as equipe_count,
                (SELECT COUNT(*) FROM corpo_docente WHERE cliente_id = c.id) as docentes_count,
                (SELECT COUNT(*) FROM propostas WHERE cliente_id = c.id) as propostas_count,
                (SELECT COUNT(*) FROM interacoes WHERE cliente_id = c.id) as interacoes_count
            FROM clientes c
            WHERE c.tipo = 'PJ' AND c.nome = ANY($1::text[])
        `;
        
        const dadosRelacionados = await pool.query(queryRelacionados, [EMPRESAS_TESTE]);
        
        let totalRelacionados = 0;
        dadosRelacionados.rows.forEach(cliente => {
            const soma = parseInt(cliente.equipe_count) + 
                        parseInt(cliente.docentes_count) + 
                        parseInt(cliente.propostas_count) + 
                        parseInt(cliente.interacoes_count);
            
            if (soma > 0) {
                console.log(`⚠️  Cliente "${cliente.nome}" (ID: ${cliente.id}) possui dados relacionados:`);
                if (cliente.equipe_count > 0) console.log(`   - ${cliente.equipe_count} registro(s) de equipe pedagógica`);
                if (cliente.docentes_count > 0) console.log(`   - ${cliente.docentes_count} registro(s) de corpo docente`);
                if (cliente.propostas_count > 0) console.log(`   - ${cliente.propostas_count} proposta(s)`);
                if (cliente.interacoes_count > 0) console.log(`   - ${cliente.interacoes_count} interação(ões)`);
                console.log('');
                totalRelacionados += soma;
            }
        });
        
        if (totalRelacionados > 0) {
            console.log(`⚠️  ATENÇÃO: Foram encontrados ${totalRelacionados} registros relacionados que também serão removidos!\n`);
        }
        
        // 3. Confirmar remoção (segurança)
        console.log('⚠️  ESTA AÇÃO É IRREVERSÍVEL!\n');
        console.log('Para prosseguir com a remoção, execute:');
        console.log('node cleanup-test-pj.js --confirm\n');
        
        // Verificar se o usuário passou o flag --confirm
        if (!process.argv.includes('--confirm')) {
            console.log('❌ Remoção cancelada (flag --confirm não encontrado)');
            return;
        }
        
        // 4. Executar remoção em uma transação (tudo ou nada)
        console.log('🗑️  Iniciando remoção...\n');
        
        await pool.query('BEGIN');
        
        try {
            // Remover dados relacionados primeiro (respeitando foreign keys)
            const deleteInteracoes = await pool.query(
                'DELETE FROM interacoes WHERE cliente_id IN (SELECT id FROM clientes WHERE tipo = $1 AND nome = ANY($2::text[]))',
                ['PJ', EMPRESAS_TESTE]
            );
            console.log(`   ✓ ${deleteInteracoes.rowCount} interação(ões) removida(s)`);
            
            const deletePropostas = await pool.query(
                'DELETE FROM propostas WHERE cliente_id IN (SELECT id FROM clientes WHERE tipo = $1 AND nome = ANY($2::text[]))',
                ['PJ', EMPRESAS_TESTE]
            );
            console.log(`   ✓ ${deletePropostas.rowCount} proposta(s) removida(s)`);
            
            const deleteCorpoDocente = await pool.query(
                'DELETE FROM corpo_docente WHERE cliente_id IN (SELECT id FROM clientes WHERE tipo = $1 AND nome = ANY($2::text[]))',
                ['PJ', EMPRESAS_TESTE]
            );
            console.log(`   ✓ ${deleteCorpoDocente.rowCount} registro(s) de corpo docente removido(s)`);
            
            const deleteEquipe = await pool.query(
                'DELETE FROM equipe_pedagogica WHERE cliente_id IN (SELECT id FROM clientes WHERE tipo = $1 AND nome = ANY($2::text[]))',
                ['PJ', EMPRESAS_TESTE]
            );
            console.log(`   ✓ ${deleteEquipe.rowCount} registro(s) de equipe pedagógica removido(s)`);
            
            const deleteDiagnostico = await pool.query(
                'DELETE FROM diagnostico WHERE cliente_id IN (SELECT id FROM clientes WHERE tipo = $1 AND nome = ANY($2::text[]))',
                ['PJ', EMPRESAS_TESTE]
            );
            console.log(`   ✓ ${deleteDiagnostico.rowCount} diagnóstico(s) removido(s)`);
            
            // Por fim, remover os clientes
            const deleteClientes = await pool.query(
                'DELETE FROM clientes WHERE tipo = $1 AND nome = ANY($2::text[]) RETURNING id, nome',
                ['PJ', EMPRESAS_TESTE]
            );
            console.log(`   ✓ ${deleteClientes.rowCount} cliente(s) PJ removido(s)\n`);
            
            // Commit da transação
            await pool.query('COMMIT');
            
            console.log('✅ Limpeza concluída com sucesso!\n');
            console.log('Clientes removidos:');
            deleteClientes.rows.forEach(c => {
                console.log(`   - ${c.nome} (ID: ${c.id})`);
            });
            
        } catch (error) {
            // Rollback em caso de erro
            await pool.query('ROLLBACK');
            console.error('❌ Erro durante a remoção. Transação revertida:', error.message);
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Erro ao executar limpeza:', error);
        process.exit(1);
    } finally {
        // Fechar conexão
        await pool.end();
    }
}

// Executar script
cleanupTestPJ()
    .then(() => {
        console.log('\n✅ Script finalizado');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Script finalizado com erro:', error);
        process.exit(1);
    });
