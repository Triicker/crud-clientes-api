// Script para sincronizar vendedor_responsavel_id
require('dotenv').config();
const pool = require('../../config/db');

async function syncVendedorIds() {
    try {
        console.log('🔄 Sincronizando vendedor_responsavel_id...\n');
        
        const result = await pool.query(`
            UPDATE clientes c
            SET vendedor_responsavel_id = u.id
            FROM usuarios u
            WHERE c.vendedor_responsavel = u.nome
              AND c.vendedor_responsavel_id IS NULL
              AND c.vendedor_responsavel IS NOT NULL
            RETURNING c.id, c.nome, c.vendedor_responsavel, c.vendedor_responsavel_id
        `);
        
        console.log(`✅ ${result.rowCount} clientes sincronizados:\n`);
        
        result.rows.forEach(c => {
            console.log(`   - ${c.nome} → Vendedor ID: ${c.vendedor_responsavel_id}`);
        });
        
        // Verifica se ainda há inconsistências
        const check = await pool.query(`
            SELECT COUNT(*) as total
            FROM clientes
            WHERE (vendedor_responsavel IS NOT NULL AND vendedor_responsavel_id IS NULL)
               OR (vendedor_responsavel IS NULL AND vendedor_responsavel_id IS NOT NULL)
        `);
        
        console.log(`\n📊 Inconsistências restantes: ${check.rows[0].total}`);
        
        await pool.end();
        console.log('\n✅ Sincronização concluída!');
        
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

syncVendedorIds();
