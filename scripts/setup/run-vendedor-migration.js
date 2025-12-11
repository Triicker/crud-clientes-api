/**
 * Script para executar migration de correção de vendedor_responsavel
 * Limpa vendedores inválidos e aplica regras de negócio
 */
require('dotenv').config();
const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🔄 Iniciando migration: fix_vendedor_responsavel...\n');
        
        // Ler arquivo SQL
        const sqlPath = path.join(__dirname, 'migrations', 'fix_vendedor_responsavel.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 SQL carregado, executando...\n');
        
        // Executar migration
        await pool.query(sql);
        
        console.log('\n✅ Migration executada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao executar migration:', error.message);
        
        if (error.hint) {
            console.error('💡 Dica:', error.hint);
        }
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar
runMigration()
    .then(() => {
        console.log('\n✅ Script finalizado');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Script finalizado com erro:', error);
        process.exit(1);
    });
