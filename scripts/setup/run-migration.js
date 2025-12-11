require('dotenv').config();
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('📦 Executando migration: CREATE_HISTORICO_TAREFAS.sql');
        
        const sqlFile = path.join(__dirname, 'migrations', 'CREATE_HISTORICO_TAREFAS.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        await db.query(sql);
        
        console.log('✅ Migration executada com sucesso!');
        console.log('📋 Tabela historico_tarefas criada');
        console.log('👥 Perfis adicionados ao sistema');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao executar migration:', error);
        process.exit(1);
    }
}

runMigration();
