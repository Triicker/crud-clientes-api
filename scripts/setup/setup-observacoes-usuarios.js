/**
 * Script para criar tabela de observações de usuários
 * Execute: node setup-observacoes-usuarios.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setup() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Iniciando configuração da tabela de observações...\n');

        // Criar tabela de observações de usuários
        await client.query(`
            CREATE TABLE IF NOT EXISTS observacoes_usuarios (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                autor_id INTEGER NOT NULL REFERENCES usuarios(id),
                tipo VARCHAR(50) NOT NULL DEFAULT 'observacao',
                titulo VARCHAR(200),
                conteudo TEXT NOT NULL,
                visivel_usuario BOOLEAN DEFAULT false,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabela observacoes_usuarios criada');

        // Criar índices
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_obs_usuario ON observacoes_usuarios(usuario_id);
            CREATE INDEX IF NOT EXISTS idx_obs_autor ON observacoes_usuarios(autor_id);
            CREATE INDEX IF NOT EXISTS idx_obs_tipo ON observacoes_usuarios(tipo);
            CREATE INDEX IF NOT EXISTS idx_obs_criado ON observacoes_usuarios(criado_em DESC);
        `);
        console.log('✅ Índices criados');

        // Adicionar coluna de metas na tabela usuarios (se não existir)
        await client.query(`
            ALTER TABLE usuarios 
            ADD COLUMN IF NOT EXISTS meta_vendas_mensal INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS data_admissao DATE,
            ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS observacao_geral TEXT;
        `);
        console.log('✅ Colunas adicionais na tabela usuarios');

        // Criar view de métricas de vendedores
        await client.query(`
            CREATE OR REPLACE VIEW vw_metricas_vendedores AS
            SELECT 
                u.id as usuario_id,
                u.nome as usuario_nome,
                u.email,
                p.nome as perfil,
                u.meta_vendas_mensal,
                u.ativo,
                u.data_admissao,
                
                -- Total de clientes atribuídos (onde o usuário é consultor)
                COALESCE((
                    SELECT COUNT(*) 
                    FROM clientes c 
                    WHERE c.consultor_id = u.id
                ), 0) as total_clientes,
                
                -- Clientes que chegaram à etapa de renovação (venda fechada)
                COALESCE((
                    SELECT COUNT(*) 
                    FROM clientes c 
                    WHERE c.consultor_id = u.id 
                    AND c.tarefas_concluidas::jsonb ? 'renovacao'
                    AND jsonb_array_length(c.tarefas_concluidas::jsonb->'renovacao') > 0
                ), 0) as vendas_fechadas,
                
                -- Clientes em processo (têm alguma tarefa mas não chegaram em renovação)
                COALESCE((
                    SELECT COUNT(*) 
                    FROM clientes c 
                    WHERE c.consultor_id = u.id 
                    AND c.tarefas_concluidas IS NOT NULL
                    AND c.tarefas_concluidas::text != '{}'
                    AND (
                        NOT (c.tarefas_concluidas::jsonb ? 'renovacao')
                        OR jsonb_array_length(COALESCE(c.tarefas_concluidas::jsonb->'renovacao', '[]'::jsonb)) = 0
                    )
                ), 0) as clientes_em_processo,
                
                -- Última atividade
                (
                    SELECT MAX(ht.data_hora)
                    FROM historico_tarefas ht
                    WHERE ht.usuario_id = u.id
                ) as ultima_atividade,
                
                -- Total de ações realizadas
                COALESCE((
                    SELECT COUNT(*)
                    FROM historico_tarefas ht
                    WHERE ht.usuario_id = u.id
                ), 0) as total_acoes,
                
                -- Ações este mês
                COALESCE((
                    SELECT COUNT(*)
                    FROM historico_tarefas ht
                    WHERE ht.usuario_id = u.id
                    AND ht.data_hora >= DATE_TRUNC('month', CURRENT_DATE)
                ), 0) as acoes_mes_atual

            FROM usuarios u
            JOIN perfis p ON u.perfil_id = p.id
            WHERE u.ativo = true OR u.ativo IS NULL
            ORDER BY u.nome;
        `);
        console.log('✅ View de métricas de vendedores criada');

        // Criar view de ranking mensal
        await client.query(`
            CREATE OR REPLACE VIEW vw_ranking_vendedores AS
            SELECT 
                u.id as usuario_id,
                u.nome as usuario_nome,
                p.nome as perfil,
                u.meta_vendas_mensal,
                
                -- Vendas fechadas no mês atual
                COALESCE((
                    SELECT COUNT(*) 
                    FROM clientes c 
                    WHERE c.consultor_id = u.id 
                    AND c.tarefas_concluidas::jsonb ? 'renovacao'
                    AND jsonb_array_length(c.tarefas_concluidas::jsonb->'renovacao') > 0
                    AND c.updated_at >= DATE_TRUNC('month', CURRENT_DATE)
                ), 0) as vendas_mes,
                
                -- Percentual da meta
                CASE 
                    WHEN u.meta_vendas_mensal > 0 THEN
                        ROUND(
                            (COALESCE((
                                SELECT COUNT(*) 
                                FROM clientes c 
                                WHERE c.consultor_id = u.id 
                                AND c.tarefas_concluidas::jsonb ? 'renovacao'
                                AND jsonb_array_length(c.tarefas_concluidas::jsonb->'renovacao') > 0
                                AND c.updated_at >= DATE_TRUNC('month', CURRENT_DATE)
                            ), 0)::numeric / u.meta_vendas_mensal::numeric) * 100
                        , 1)
                    ELSE 0
                END as percentual_meta

            FROM usuarios u
            JOIN perfis p ON u.perfil_id = p.id
            WHERE p.nome IN ('consultor', 'representante')
            AND (u.ativo = true OR u.ativo IS NULL)
            ORDER BY vendas_mes DESC, u.nome;
        `);
        console.log('✅ View de ranking de vendedores criada');

        console.log('\n🎉 Configuração concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

setup().catch(console.error);
