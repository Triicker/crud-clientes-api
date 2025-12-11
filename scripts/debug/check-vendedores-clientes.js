// Script para verificar vendedores e seus clientes
require('dotenv').config();
const pool = require('../../config/db');

async function checkVendedoresClientes() {
    try {
        console.log('🔍 Verificando vendedores e clientes associados...\n');
        
        // Lista todos os vendedores
        const vendedoresQuery = `
            SELECT 
                u.id,
                u.nome,
                u.perfil_id,
                p.nome as perfil_nome,
                u.ativo
            FROM usuarios u
            LEFT JOIN perfis p ON u.perfil_id = p.id
            WHERE u.perfil_id IN (2, 4)
            ORDER BY u.nome
        `;
        
        const vendedores = await pool.query(vendedoresQuery);
        
        console.log(`📊 Total de vendedores encontrados: ${vendedores.rows.length}\n`);
        
        for (const vendedor of vendedores.rows) {
            console.log(`\n👤 ${vendedor.nome} (ID: ${vendedor.id})`);
            console.log(`   Perfil: ${vendedor.perfil_nome} | Ativo: ${vendedor.ativo ? '✅' : '❌'}`);
            
            // Busca clientes por NOME
            const clientesPorNome = await pool.query(
                'SELECT id, nome FROM clientes WHERE vendedor_responsavel = $1',
                [vendedor.nome]
            );
            
            // Busca clientes por ID
            const clientesPorId = await pool.query(
                'SELECT id, nome FROM clientes WHERE vendedor_responsavel_id = $1',
                [vendedor.id]
            );
            
            console.log(`   📋 Clientes por NOME: ${clientesPorNome.rows.length}`);
            if (clientesPorNome.rows.length > 0) {
                clientesPorNome.rows.forEach(c => {
                    console.log(`      - ${c.nome} (ID: ${c.id})`);
                });
            }
            
            console.log(`   📋 Clientes por ID: ${clientesPorId.rows.length}`);
            if (clientesPorId.rows.length > 0) {
                clientesPorId.rows.forEach(c => {
                    console.log(`      - ${c.nome} (ID: ${c.id})`);
                });
            }
        }
        
        // Verifica inconsistências
        console.log('\n\n🔍 Verificando inconsistências...\n');
        
        const inconsistencias = await pool.query(`
            SELECT 
                id,
                nome,
                vendedor_responsavel,
                vendedor_responsavel_id
            FROM clientes
            WHERE (vendedor_responsavel IS NOT NULL AND vendedor_responsavel_id IS NULL)
               OR (vendedor_responsavel IS NULL AND vendedor_responsavel_id IS NOT NULL)
        `);
        
        if (inconsistencias.rows.length > 0) {
            console.log(`⚠️  ${inconsistencias.rows.length} inconsistências encontradas:`);
            inconsistencias.rows.forEach(c => {
                console.log(`   - Cliente ${c.nome} (ID: ${c.id})`);
                console.log(`     vendedor_responsavel: ${c.vendedor_responsavel || 'NULL'}`);
                console.log(`     vendedor_responsavel_id: ${c.vendedor_responsavel_id || 'NULL'}`);
            });
        } else {
            console.log('✅ Nenhuma inconsistência encontrada');
        }
        
        await pool.end();
        console.log('\n✅ Verificação concluída!');
        
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

checkVendedoresClientes();
