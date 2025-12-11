require('dotenv').config();
const pool = require('./config/db');

async function checkVendedores() {
    try {
        const query = `
            SELECT 
                COALESCE(vendedor_responsavel, '[SEM VENDEDOR]') as vendedor,
                status,
                COUNT(*) as total
            FROM clientes
            GROUP BY vendedor_responsavel, status
            ORDER BY vendedor, status
        `;
        
        const result = await pool.query(query);
        
        console.log('\n📊 Distribuição de clientes por vendedor:\n');
        console.table(result.rows);
        
        // Verificar se há problemas
        const prospeccaoComVendedor = await pool.query(`
            SELECT COUNT(*) as total
            FROM clientes
            WHERE status = 'Prospecção' AND vendedor_responsavel IS NOT NULL
        `);
        
        const vendedoresInvalidos = await pool.query(`
            SELECT DISTINCT vendedor_responsavel
            FROM clientes
            WHERE vendedor_responsavel IS NOT NULL
              AND vendedor_responsavel NOT IN (SELECT nome FROM usuarios WHERE ativo = true)
        `);
        
        console.log('\n✅ Validações:');
        console.log(`   Prospecção com vendedor: ${prospeccaoComVendedor.rows[0].total} (deveria ser 0)`);
        console.log(`   Vendedores inválidos: ${vendedoresInvalidos.rows.length} (deveria ser 0)`);
        
        if (vendedoresInvalidos.rows.length > 0) {
            console.log('\n❌ Vendedores inválidos encontrados:');
            vendedoresInvalidos.rows.forEach(v => console.log(`   - ${v.vendedor_responsavel}`));
        }
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await pool.end();
    }
}

checkVendedores();
