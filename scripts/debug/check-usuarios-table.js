require('dotenv').config();
const pool = require('../../config/db');

async function checkUsuariosTable() {
    try {
        console.log('🔍 Verificando estrutura da tabela usuarios...\n');
        
        // Verificar colunas da tabela
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'usuarios'
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 Colunas da tabela usuarios:');
        console.table(columns.rows);
        
        // Verificar constraints
        const constraints = await pool.query(`
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'usuarios';
        `);
        
        console.log('\n🔒 Constraints da tabela usuarios:');
        console.table(constraints.rows);
        
        // Verificar perfis disponíveis
        const perfis = await pool.query('SELECT id, nome FROM perfis ORDER BY id');
        console.log('\n👥 Perfis disponíveis:');
        console.table(perfis.rows);
        
        await pool.end();
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

checkUsuariosTable();
