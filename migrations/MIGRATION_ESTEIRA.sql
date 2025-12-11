-- Migration for Esteira de Trabalho (Workflow)

-- 0. Ensure previous migration columns exist (Fix for missing 'status' column)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Prospecção';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS vendedor_responsavel VARCHAR(100);

-- Ensure interacoes table exists
CREATE TABLE IF NOT EXISTS interacoes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    data_interacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_responsavel VARCHAR(100)
);

-- 1. Add 'tarefas_concluidas' column to 'clientes' table to store completed tasks as JSON
-- Format: { "Prospecção": ["Primeiro contato", "Registro..."], "Negociação": [...] }
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tarefas_concluidas JSONB DEFAULT '{}'::jsonb;

-- 2. Update existing statuses to match the new workflow if necessary
-- This is a best-effort mapping.
UPDATE clientes SET status = 'Apresentação' WHERE status = 'Contato Inicial';
UPDATE clientes SET status = 'Apresentação' WHERE status = 'Proposta'; -- Mapping Proposta to Apresentação or Negociação depending on logic, but let's put it in Apresentação or Negociação. Actually 'Proposta' fits better in 'Negociação' based on the new flow actions.
UPDATE clientes SET status = 'Negociação' WHERE status = 'Proposta';

-- Ensure all statuses are valid according to new config (Optional, but good for consistency)
-- Valid: Prospecção, Apresentação, Negociação, Fechamento, Pós-venda, Renovação
