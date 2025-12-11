require('dotenv').config();
const pool = require('./config/db');

async function check() {
    try {
        // Colunas da tabela usuarios
        const cols = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'usuarios'
        `);
        console.log('Colunas usuarios:', cols.rows.map(c => c.column_name));

        // Verificar alguns usuarios
        const users = await pool.query(`SELECT id, nome, email, perfil_id FROM usuarios LIMIT 5`);
        console.log('\nUsuarios:', users.rows);

        // Verificar vendedor_responsavel nos clientes
        const vendedores = await pool.query(`
            SELECT DISTINCT vendedor_responsavel 
            FROM clientes 
            WHERE vendedor_responsavel IS NOT NULL
        `);
        console.log('\nVendedores responsáveis:', vendedores.rows);

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        process.exit();
    }
}

check();
