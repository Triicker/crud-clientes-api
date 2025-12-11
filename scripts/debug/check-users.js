require('dotenv').config();
const pool = require('./config/db');

async function checkUsersAndProfiles() {
    try {
        // Verificar perfis
        const perfis = await pool.query('SELECT * FROM perfis ORDER BY id');
        console.log('\n📋 Perfis disponíveis:\n');
        console.table(perfis.rows);
        
        // Verificar usuários
        const usuarios = await pool.query(`
            SELECT 
                u.id, 
                u.nome, 
                u.email, 
                u.ativo,
                u.perfil_id,
                p.nome as perfil
            FROM usuarios u
            LEFT JOIN perfis p ON u.perfil_id = p.id
            ORDER BY u.id
        `);
        console.log('\n👥 Usuários existentes:\n');
        console.table(usuarios.rows);
        
    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkUsersAndProfiles();
