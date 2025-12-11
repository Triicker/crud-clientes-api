-- Migration: Criar tabela de histórico de alterações nas tarefas da esteira
-- Data: 01/12/2025
-- Descrição: Registra todas as mudanças (marcar/desmarcar) nas tarefas dos clientes

CREATE TABLE IF NOT EXISTS historico_tarefas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    etapa VARCHAR(100) NOT NULL,
    acao_idx INTEGER NOT NULL,
    acao_nome VARCHAR(255),
    operacao VARCHAR(20) NOT NULL CHECK (operacao IN ('marcada', 'desmarcada')),
    data_hora TIMESTAMP DEFAULT NOW(),
    observacao TEXT,
    
    -- Índices para performance
    CONSTRAINT historico_tarefas_idx UNIQUE (cliente_id, etapa, acao_idx, data_hora)
);

-- Índices para consultas rápidas
CREATE INDEX idx_historico_cliente ON historico_tarefas(cliente_id);
CREATE INDEX idx_historico_usuario ON historico_tarefas(usuario_id);
CREATE INDEX idx_historico_data ON historico_tarefas(data_hora DESC);
CREATE INDEX idx_historico_cliente_data ON historico_tarefas(cliente_id, data_hora DESC);

-- Adicionar tipos de usuário que faltam (se não existirem)
DO $$
BEGIN
    -- Verifica se a tabela perfil existe e adiciona novos perfis
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'perfil') THEN
        -- Inserir novos perfis se não existirem
        INSERT INTO perfil (nome) 
        SELECT * FROM (VALUES 
            ('vendedor'),
            ('representante'),
            ('diretor'),
            ('logistica'),
            ('financeiro'),
            ('formador'),
            ('marketing'),
            ('tecnologia')
        ) AS novos_perfis(nome)
        WHERE NOT EXISTS (
            SELECT 1 FROM perfil WHERE perfil.nome = novos_perfis.nome
        );
    END IF;
END $$;

-- Comentários nas colunas
COMMENT ON TABLE historico_tarefas IS 'Registra todas as alterações (marcar/desmarcar) nas tarefas da esteira de processos';
COMMENT ON COLUMN historico_tarefas.cliente_id IS 'ID do cliente que teve a tarefa modificada';
COMMENT ON COLUMN historico_tarefas.usuario_id IS 'ID do usuário que fez a alteração';
COMMENT ON COLUMN historico_tarefas.etapa IS 'ID da etapa (ex: prospeccao)';
COMMENT ON COLUMN historico_tarefas.acao_idx IS 'Índice da ação (0-4)';
COMMENT ON COLUMN historico_tarefas.acao_nome IS 'Nome descritivo da ação';
COMMENT ON COLUMN historico_tarefas.operacao IS 'marcada ou desmarcada';
COMMENT ON COLUMN historico_tarefas.data_hora IS 'Data e hora da alteração';
COMMENT ON COLUMN historico_tarefas.observacao IS 'Observação opcional sobre a alteração';
