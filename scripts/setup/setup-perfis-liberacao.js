/**
 * Script para configurar os novos perfis e tabela de liberação de etapas
 * Execute com: node setup-perfis-liberacao.js
 */
require('dotenv').config();
const pool = require('./config/db');

async function setup() {
    console.log('🚀 Iniciando configuração de perfis e liberação...\n');
    
    try {
        // 1. PRIMEIRO - ADICIONAR COLUNA descricao SE NÃO EXISTIR
        console.log('📋 Verificando/adicionando coluna descricao na tabela perfis...');
        try {
            await pool.query(`ALTER TABLE perfis ADD COLUMN IF NOT EXISTS descricao TEXT`);
            console.log('   ✅ Coluna descricao OK');
        } catch (err) {
            console.log('   ⚠️ Erro na coluna:', err.message);
        }
        
        // 2. ADICIONAR NOVOS PERFIS
        console.log('\n📋 Adicionando novos perfis...');
        
        const novosPerfis = [
            { id: 4, nome: 'equipe_interna', descricao: 'Equipe interna (prospecção e atendimento)' },
            { id: 5, nome: 'equipe_externa', descricao: 'Equipe externa (Representantes/supervisores/distribuidores)' },
            { id: 6, nome: 'diretor_comercial', descricao: 'Diretor comercial/equipe de apoio' },
            { id: 7, nome: 'logistica', descricao: 'Equipe logística (Separação e transporte)' },
            { id: 8, nome: 'formadores', descricao: 'Equipe de formadores (Professores e pedagógos-influenciadores)' },
            { id: 9, nome: 'marketing', descricao: 'Equipe de Marketing e comunicação' },
            { id: 10, nome: 'gerencia_dados', descricao: 'Gerência de dados' }
        ];
        
        for (const perfil of novosPerfis) {
            try {
                await pool.query(
                    `INSERT INTO perfis (id, nome, descricao) VALUES ($1, $2, $3) 
                     ON CONFLICT (id) DO UPDATE SET nome = $2, descricao = $3`,
                    [perfil.id, perfil.nome, perfil.descricao]
                );
                console.log(`   ✅ Perfil "${perfil.nome}" criado/atualizado`);
            } catch (err) {
                console.log(`   ⚠️ Erro no perfil "${perfil.nome}":`, err.message);
            }
        }
        
        // Atualizar descrições dos perfis existentes
        await pool.query(`UPDATE perfis SET descricao = 'Acesso total ao sistema' WHERE id = 1`);
        await pool.query(`UPDATE perfis SET descricao = 'Consultores de vendas' WHERE id = 2`);
        await pool.query(`UPDATE perfis SET descricao = 'Representantes comerciais' WHERE id = 3`);
        
        // 3. CRIAR TABELA DE LIBERAÇÃO DE ETAPAS (SE NÃO EXISTIR)
        console.log('\n📋 Criando tabela de liberação de etapas...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS liberacao_etapas (
                id SERIAL PRIMARY KEY,
                cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
                etapa_atual VARCHAR(100) NOT NULL,
                etapa_destino VARCHAR(100) NOT NULL,
                solicitado_por INTEGER NOT NULL REFERENCES usuarios(id),
                solicitado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'pendente',
                liberado_por INTEGER REFERENCES usuarios(id),
                liberado_em TIMESTAMP,
                observacao TEXT
            )
        `);
        console.log('   ✅ Tabela liberacao_etapas criada/verificada');
        
        // 4. CRIAR TABELA DE MAPEAMENTO ETAPA -> PERFIL RESPONSÁVEL
        console.log('\n📋 Criando tabela de mapeamento etapa-perfil...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS etapa_perfil (
                id SERIAL PRIMARY KEY,
                etapa_id VARCHAR(100) NOT NULL UNIQUE,
                etapa_nome VARCHAR(255) NOT NULL,
                perfil_responsavel INTEGER REFERENCES perfis(id),
                ordem INTEGER NOT NULL,
                pode_avancar_sem_liberacao BOOLEAN DEFAULT false,
                descricao TEXT
            )
        `);
        console.log('   ✅ Tabela etapa_perfil criada/verificada');
        
        // Inserir/atualizar mapeamento de etapas
        console.log('\n📋 Configurando mapeamento etapa-perfil...');
        const etapasConfig = [
            { etapa_id: 'prospeccao', nome: '1 - PROSPECÇÃO 3 CANAIS', perfil: 4, ordem: 1, avancar_livre: false },
            { etapa_id: 'aumentar_conexao', nome: '2 - AUMENTAR CONEXÃO', perfil: 4, ordem: 2, avancar_livre: false },
            { etapa_id: 'envio_consultor', nome: '3 - ENVIO DE CONSULTOR', perfil: 5, ordem: 3, avancar_livre: false },
            { etapa_id: 'efetivacao', nome: '4 - EFETIVAÇÃO', perfil: 6, ordem: 4, avancar_livre: false },
            { etapa_id: 'registros_legais', nome: '5 - REGISTROS LEGAIS', perfil: 6, ordem: 5, avancar_livre: false },
            { etapa_id: 'separacao', nome: '6 - SEPARAÇÃO', perfil: 7, ordem: 6, avancar_livre: false },
            { etapa_id: 'entrega', nome: '7 - ENTREGA', perfil: 7, ordem: 7, avancar_livre: false },
            { etapa_id: 'recebimentos', nome: '8 - RECEBIMENTOS', perfil: 6, ordem: 8, avancar_livre: false },
            { etapa_id: 'formacao', nome: '9 - FORMAÇÃO', perfil: 8, ordem: 9, avancar_livre: false },
            { etapa_id: 'documentarios', nome: '10 - DOCUMENTÁRIOS', perfil: 9, ordem: 10, avancar_livre: false },
            { etapa_id: 'gerar_graficos', nome: '11 - GERAR GRÁFICOS', perfil: 10, ordem: 11, avancar_livre: false },
            { etapa_id: 'renovacao', nome: '12 - RENOVAÇÃO', perfil: 4, ordem: 12, avancar_livre: false }
        ];
        
        for (const etapa of etapasConfig) {
            try {
                await pool.query(
                    `INSERT INTO etapa_perfil (etapa_id, etapa_nome, perfil_responsavel, ordem, pode_avancar_sem_liberacao) 
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (etapa_id) DO UPDATE SET 
                        etapa_nome = $2, 
                        perfil_responsavel = $3, 
                        ordem = $4,
                        pode_avancar_sem_liberacao = $5`,
                    [etapa.etapa_id, etapa.nome, etapa.perfil, etapa.ordem, etapa.avancar_livre]
                );
                console.log(`   ✅ Etapa "${etapa.etapa_id}" configurada`);
            } catch (err) {
                console.log(`   ⚠️ Erro na etapa "${etapa.etapa_id}":`, err.message);
            }
        }
        
        // 5. LISTAR TODOS OS PERFIS
        console.log('\n📋 Perfis cadastrados no sistema:');
        const perfisResult = await pool.query('SELECT * FROM perfis ORDER BY id');
        console.table(perfisResult.rows);
        
        // 6. LISTAR MAPEAMENTO DE ETAPAS
        console.log('\n📋 Mapeamento de etapas para equipes:');
        const etapasResult = await pool.query(`
            SELECT ep.etapa_id, ep.etapa_nome, p.nome as perfil_responsavel, ep.ordem
            FROM etapa_perfil ep
            LEFT JOIN perfis p ON ep.perfil_responsavel = p.id
            ORDER BY ep.ordem
        `);
        console.table(etapasResult.rows);
        
        console.log('\n✅ Configuração concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a configuração:', error);
    } finally {
        await pool.end();
    }
}

setup();
